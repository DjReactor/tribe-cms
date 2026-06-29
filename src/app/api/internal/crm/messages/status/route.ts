import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { guardCrm, resolveEnum, ENUMS, json, badRequest, notFound, serverError } from '@/lib/crm-api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/crm/messages/status — update a message's delivery status by
 * external_id (n8n → CMS, §5.2). Returns { ok: true }; 404 if no such message.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const denied = await guardCrm(req, raw);
  if (denied) return denied;
  let body: any;
  try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON body'); }

  const externalId = body?.external_id != null ? String(body.external_id) : '';
  if (!externalId) return badRequest('external_id is required');
  const status = resolveEnum(body.status, ENUMS.messageStatus);
  if (!status) return badRequest('invalid status', ENUMS.messageStatus);

  try {
    const pb = await getAdminPocketBase();
    let msg: any;
    try { msg = await pb.collection('messages').getFirstListItem(pb.filter('external_id = {:x}', { x: externalId })); }
    catch { return notFound(); }

    const patch: Record<string, unknown> = { status };
    if (body.error !== undefined) patch.error = String(body.error);
    await pb.collection('messages').update(msg.id, patch);
    return json({ ok: true });
  } catch {
    return serverError();
  }
}
