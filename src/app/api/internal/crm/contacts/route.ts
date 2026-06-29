import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { resolveLeadSourceId } from '@/lib/lead-sources';
import { applyContactLifecycleChange } from '@/lib/crm-writes';
import { guardCrm, resolveEnum, ENUMS, ALIASES, json, badRequest, serverError } from '@/lib/crm-api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/crm/contacts — upsert a contact by email/phone natural key
 * (n8n → CMS, §5.2). Returns { id, created }. `source` is resolved to a
 * lead_sources row (auto-created on a miss); a lifecycle_status change on an
 * existing contact emits contact.lifecycle_changed.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const denied = await guardCrm(req, raw);
  if (denied) return denied;
  let body: any;
  try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON body'); }

  const name = body?.name != null ? String(body.name).trim() : '';
  if (!name) return badRequest('name is required');
  const email = body?.email != null ? String(body.email).trim() : '';
  const phone = body?.phone != null ? String(body.phone).trim() : '';
  if (!email && !phone) return badRequest('email or phone is required');

  let lifecycle: string | undefined;
  if (body.lifecycle_status !== undefined) {
    const r = resolveEnum(body.lifecycle_status, ENUMS.lifecycle, ALIASES.lifecycle);
    if (!r) return badRequest('invalid lifecycle_status', ENUMS.lifecycle);
    lifecycle = r;
  }

  try {
    const pb = await getAdminPocketBase();

    // Natural-key lookup by email and/or phone (safely parameterized).
    const parts: string[] = [];
    const params: Record<string, string> = {};
    if (email) { parts.push('email = {:email}'); params.email = email; }
    if (phone) { parts.push('phone = {:phone}'); params.phone = phone; }
    let existing: any = null;
    try { existing = await pb.collection('contacts').getFirstListItem(pb.filter(parts.join(' || '), params)); }
    catch { existing = null; }

    const sourceId = body.source !== undefined ? await resolveLeadSourceId(pb, body.source) : undefined;

    const fields: Record<string, unknown> = { name };
    if (body.email !== undefined) fields.email = email;
    if (body.phone !== undefined) fields.phone = phone;
    if (body.message !== undefined) fields.message = String(body.message);
    if (body.notes !== undefined) fields.notes = String(body.notes);
    if (Array.isArray(body.tags)) fields.tags = body.tags;
    if (body.address_street !== undefined) fields.address_street = String(body.address_street);
    if (body.address_city !== undefined) fields.address_city = String(body.address_city);
    if (body.address_state !== undefined) fields.address_state = String(body.address_state);
    if (body.address_zip !== undefined) fields.address_zip = String(body.address_zip);
    if (body.address_full !== undefined) fields.address_full = String(body.address_full);
    if (sourceId !== undefined) fields.source = sourceId;

    if (existing) {
      await pb.collection('contacts').update(existing.id, fields);
      if (lifecycle !== undefined) await applyContactLifecycleChange(pb, existing.id, lifecycle, 'n8n');
      return json({ id: existing.id, created: false });
    }
    if (lifecycle !== undefined) fields.lifecycle_status = lifecycle;
    const created = await pb.collection('contacts').create(fields);
    return json({ id: created.id, created: true });
  } catch {
    return serverError();
  }
}
