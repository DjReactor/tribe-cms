import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { findOrCreateContact } from '@/lib/crm-writes';
import { guardCrm, resolveEnum, ENUMS, json, badRequest, serverError } from '@/lib/crm-api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/crm/messages — log an SMS/email (n8n → CMS, §5.2). Dedupes
 * on the unique external_id (provider webhooks fire more than once) → returns
 * { id, deduped }. If contact_id is omitted, the external party (from_addr for
 * inbound, to_addr for outbound) is matched/created by phone (sms) or email.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const denied = await guardCrm(req, raw);
  if (denied) return denied;
  let body: any;
  try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON body'); }

  const direction = resolveEnum(body.direction, ENUMS.direction);
  if (!direction) return badRequest('invalid direction', ENUMS.direction);
  const channel = resolveEnum(body.channel, ENUMS.channel);
  if (!channel) return badRequest('invalid channel', ENUMS.channel);
  const status = resolveEnum(body.status, ENUMS.messageStatus);
  if (!status) return badRequest('invalid status', ENUMS.messageStatus);
  const externalId = body?.external_id != null ? String(body.external_id) : '';
  if (!externalId) return badRequest('external_id is required');

  try {
    const pb = await getAdminPocketBase();

    // Resolve the contact: explicit id, else the external party by address.
    let contactId = body.contact_id ? String(body.contact_id) : '';
    if (contactId) {
      try { await pb.collection('contacts').getOne(contactId); } catch { return badRequest('unknown contact_id'); }
    } else {
      const ident = direction === 'inbound' ? body.from_addr : body.to_addr;
      const identStr = ident != null ? String(ident) : '';
      const resolved = await findOrCreateContact(
        pb,
        channel === 'email' ? { email: identStr, name: identStr } : { phone: identStr, name: identStr },
      );
      if (!resolved) return badRequest('contact_id or a from/to address is required');
      contactId = resolved;
    }

    const fields: Record<string, unknown> = {
      contact: contactId,
      direction,
      channel,
      status,
      external_id: externalId,
      subject: body.subject !== undefined ? String(body.subject) : '',
      body: body.body !== undefined ? String(body.body) : '',
      from_addr: body.from_addr !== undefined ? String(body.from_addr) : '',
      to_addr: body.to_addr !== undefined ? String(body.to_addr) : '',
      provider: body.provider !== undefined ? String(body.provider) : '',
      error: body.error !== undefined ? String(body.error) : '',
      meta: body.meta || {},
    };

    try {
      const rec = await pb.collection('messages').create(fields);
      return json({ id: rec.id, deduped: false });
    } catch {
      // Most likely the unique external_id constraint — return the existing row.
      try {
        const existing = await pb.collection('messages').getFirstListItem(pb.filter('external_id = {:x}', { x: externalId }));
        return json({ id: existing.id, deduped: true });
      } catch {
        return serverError();
      }
    }
  } catch {
    return serverError();
  }
}
