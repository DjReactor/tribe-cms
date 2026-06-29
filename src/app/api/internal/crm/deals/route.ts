import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { resolveLeadSourceId } from '@/lib/lead-sources';
import { createDealRecord } from '@/lib/crm-writes';
import { guardCrm, resolveEnum, toNumber, ENUMS, ALIASES, json, badRequest, serverError } from '@/lib/crm-api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/crm/deals — create a deal for a contact (n8n → CMS, §5.2).
 * Logs the initial stage activity and emits deal.created. Returns { id,
 * created: true }. Deals have no natural dedupe key (one contact → many deals),
 * so this always creates; use PATCH /deals/[id] to update an existing deal.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const denied = await guardCrm(req, raw);
  if (denied) return denied;
  let body: any;
  try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON body'); }

  const contactId = body?.contact_id != null ? String(body.contact_id) : '';
  if (!contactId) return badRequest('contact_id is required');

  let stage = 'new';
  if (body.stage !== undefined) {
    const r = resolveEnum(body.stage, ENUMS.stage, ALIASES.stage);
    if (!r) return badRequest('invalid stage', ENUMS.stage);
    stage = r;
  }

  try {
    const pb = await getAdminPocketBase();
    try { await pb.collection('contacts').getOne(contactId); } catch { return badRequest('unknown contact_id'); }

    const sourceId = body.source !== undefined ? await resolveLeadSourceId(pb, body.source) : undefined;

    const deal = await createDealRecord(pb, {
      contact_id: contactId,
      title: body.title !== undefined ? String(body.title) : undefined,
      stage,
      estimate_value: toNumber(body.estimate_value),
      won_value: toNumber(body.won_value),
      source_id: sourceId,
      referred_by: body.referred_by ? String(body.referred_by) : undefined,
      lost_reason: body.lost_reason !== undefined ? String(body.lost_reason) : undefined,
    }, 'n8n');

    return json({ id: deal.id, created: true });
  } catch {
    return serverError();
  }
}
