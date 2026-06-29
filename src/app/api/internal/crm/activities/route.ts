import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { guardCrm, resolveEnum, ENUMS, json, badRequest, serverError } from '@/lib/crm-api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/crm/activities — log a non-message activity on a contact's
 * timeline (n8n → CMS, §5.2). Returns { id }.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const denied = await guardCrm(req, raw);
  if (denied) return denied;
  let body: any;
  try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON body'); }

  const contactId = body?.contact_id != null ? String(body.contact_id) : '';
  if (!contactId) return badRequest('contact_id is required');
  const title = body?.title != null ? String(body.title) : '';
  if (!title) return badRequest('title is required');
  const type = resolveEnum(body.type, ENUMS.activityType);
  if (!type) return badRequest('invalid type', ENUMS.activityType);

  try {
    const pb = await getAdminPocketBase();
    try { await pb.collection('contacts').getOne(contactId); } catch { return badRequest('unknown contact_id'); }

    const rec = await pb.collection('activities').create({
      contact: contactId,
      deal: body.deal_id ? String(body.deal_id) : '',
      type,
      title,
      detail: body.detail !== undefined ? String(body.detail) : '',
      meta: body.meta || {},
      actor: body.actor ? String(body.actor) : 'n8n',
    });
    return json({ id: rec.id });
  } catch {
    return serverError();
  }
}
