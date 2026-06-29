import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { applyContactLifecycleChange } from '@/lib/crm-writes';
import { guardCrm, resolveEnum, ENUMS, ALIASES, json, badRequest, notFound, serverError } from '@/lib/crm-api';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/internal/crm/contacts/[id] — update a contact (n8n → CMS, §5.2).
 * A lifecycle_status change writes a lifecycle_changed activity and emits
 * contact.lifecycle_changed. Returns { ok: true }.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await req.text();
  const denied = await guardCrm(req, raw);
  if (denied) return denied;
  let body: any;
  try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON body'); }

  let lifecycle: string | undefined;
  if (body.lifecycle_status !== undefined) {
    const r = resolveEnum(body.lifecycle_status, ENUMS.lifecycle, ALIASES.lifecycle);
    if (!r) return badRequest('invalid lifecycle_status', ENUMS.lifecycle);
    lifecycle = r;
  }

  try {
    const pb = await getAdminPocketBase();
    try { await pb.collection('contacts').getOne(id); } catch { return notFound(); }

    const fields: Record<string, unknown> = {};
    if (body.notes !== undefined) fields.notes = String(body.notes);
    if (Array.isArray(body.tags)) fields.tags = body.tags;
    if (body.assigned_to !== undefined) fields.assigned_to = body.assigned_to || '';
    if (body.last_contacted_at !== undefined) fields.last_contacted_at = body.last_contacted_at || '';

    if (Object.keys(fields).length) await pb.collection('contacts').update(id, fields);
    if (lifecycle !== undefined) await applyContactLifecycleChange(pb, id, lifecycle, 'n8n');
    return json({ ok: true });
  } catch {
    return serverError();
  }
}
