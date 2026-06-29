import { NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { authenticateWebhook } from '@/lib/webhook-auth';
import { dispatchEvent } from '@/lib/automation';
import { findOrCreateContact } from '@/lib/crm-writes';
import { resolveEnum, ENUMS } from '@/lib/crm-api';

export const dynamic = 'force-dynamic';

/** Retell epoch-ms timestamp → ISO string (PocketBase date field); '' if absent. */
function isoFromMs(ms: unknown): string {
  const n = Number(ms);
  return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : '';
}

/**
 * Retell call webhook (§5.3). Authenticates, maps the Retell "Get Call" payload
 * into the enriched ai_call_logs schema (§4.5), UPSERTS by call_id (Retell fires
 * multiple webhooks per call — call_ended then call_analyzed — which converge to
 * one row), links a contact (metadata.contact_id, else from_number → contacts),
 * and emits call.completed once the call is analyzed/ended.
 */
export async function POST(request: Request) {
  const secret = process.env.RETELL_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });

  const raw = await request.text();
  if (!(await authenticateWebhook(request, raw, secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const call = payload.call;
  if (!call || !call.call_id) return NextResponse.json({ success: true, skipped: 'no call' });

  const pb = await getAdminPocketBase();
  try {
    const analysis = call.call_analysis || {};

    // Resolve the contact: explicit metadata.contact_id, else the caller's number.
    let contactId = '';
    const metaContactId = call.metadata?.contact_id || payload.metadata?.contact_id;
    if (metaContactId) {
      try { await pb.collection('contacts').getOne(String(metaContactId)); contactId = String(metaContactId); }
      catch { contactId = ''; }
    }
    if (!contactId) {
      const resolved = await findOrCreateContact(pb, { phone: call.from_number, name: call.from_number });
      if (resolved) contactId = resolved;
    }

    // Map Retell "Get Call" → ai_call_logs. Selects/bools only set when present
    // (a select rejects unknown values; an undefined bool would coerce to false).
    const fields: Record<string, unknown> = {
      call_id: call.call_id,
      caller_number: call.from_number || '',
      from_number: call.from_number || '',
      to_number: call.to_number || '',
      transcript: call.transcript || '',
      summary: analysis.call_summary || '',
      sentiment: analysis.user_sentiment || '',
      duration: Number(call.duration_ms) || 0,
      agent_id: call.agent_id || '',
      agent_name: call.agent_name || '',
      twilio_call_sid: call.telephony_identifier?.twilio_call_sid || call.twilio_call_sid || '',
      disconnection_reason: call.disconnection_reason || '',
      start_timestamp: isoFromMs(call.start_timestamp),
      end_timestamp: isoFromMs(call.end_timestamp),
      recording_url: call.recording_url || '',
      public_log_url: call.public_log_url || '',
      custom_analysis_data: analysis.custom_analysis_data || {},
      combined_cost: Number(call.call_cost?.combined_cost) || 0,
      metadata: call.metadata || {},
    };
    if (contactId) fields.contact = contactId;
    const ct = resolveEnum(call.call_type, ENUMS.callType); if (ct) fields.call_type = ct;
    const dir = resolveEnum(call.direction, ENUMS.direction); if (dir) fields.direction = dir;
    const cs = resolveEnum(call.call_status, ENUMS.callStatus); if (cs) fields.call_status = cs;
    if (analysis.call_successful !== undefined) fields.call_successful = !!analysis.call_successful;
    if (analysis.in_voicemail !== undefined) fields.in_voicemail = !!analysis.in_voicemail;

    // Upsert by call_id (unique index).
    let existing: any = null;
    try { existing = await pb.collection('ai_call_logs').getFirstListItem(pb.filter('call_id = {:c}', { c: call.call_id })); }
    catch { existing = null; }
    const record = existing
      ? await pb.collection('ai_call_logs').update(existing.id, fields)
      : await pb.collection('ai_call_logs').create(fields);

    // Emit call.completed exactly once — when the call first becomes analyzed
    // (or ended, if no event field). Guard re-delivered webhooks by checking
    // whether the PRE-update row was already analyzed.
    const completed = payload.event ? payload.event === 'call_analyzed' : cs === 'ended';
    const alreadyAnalyzed = !!existing && (
      !!existing.summary ||
      (existing.custom_analysis_data &&
        typeof existing.custom_analysis_data === 'object' &&
        Object.keys(existing.custom_analysis_data).length > 0)
    );
    if (completed && !alreadyAnalyzed) {
      try { await dispatchEvent('call.completed', { call: record, contact_id: contactId || null }); }
      catch { /* swallow */ }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
