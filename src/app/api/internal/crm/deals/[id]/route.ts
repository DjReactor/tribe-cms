import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { applyDealStageChange } from '@/lib/crm-writes';
import { guardCrm, resolveEnum, toNumber, ENUMS, ALIASES, json, badRequest, notFound, serverError } from '@/lib/crm-api';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/internal/crm/deals/[id] — update a deal (n8n → CMS, §5.2). A stage
 * change writes a deal_stage_changed activity, stamps closed_at on won/lost, and
 * emits deal.stage_changed (+ deal.won/deal.lost). Returns { ok: true }.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await req.text();
  const denied = await guardCrm(req, raw);
  if (denied) return denied;
  let body: any;
  try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON body'); }

  let stage: string | undefined;
  if (body.stage !== undefined) {
    const r = resolveEnum(body.stage, ENUMS.stage, ALIASES.stage);
    if (!r) return badRequest('invalid stage', ENUMS.stage);
    stage = r;
  }

  try {
    const pb = await getAdminPocketBase();
    try { await pb.collection('deals').getOne(id); } catch { return notFound(); }

    const fields: Record<string, unknown> = {};
    const ev = toNumber(body.estimate_value); if (ev !== undefined) fields.estimate_value = ev;
    const wv = toNumber(body.won_value); if (wv !== undefined) fields.won_value = wv;
    if (body.lost_reason !== undefined) fields.lost_reason = String(body.lost_reason);
    if (body.closed_at !== undefined) fields.closed_at = body.closed_at || '';

    if (Object.keys(fields).length) await pb.collection('deals').update(id, fields);
    // Stage change owns its side effects (activity + events + closed_at on terminal).
    if (stage !== undefined) await applyDealStageChange(pb, id, stage, 'n8n');
    return json({ ok: true });
  } catch {
    return serverError();
  }
}
