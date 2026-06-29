import type PocketBase from 'pocketbase';
import { dispatchEvent } from '@/lib/automation';

/**
 * Shared CRM mutation helpers used by BOTH the dashboard server actions
 * (`getPocketBaseClient`, BO-scoped) and the inbound n8n write-back API
 * (`getAdminPocketBase`). Centralizing the activity-logging + event-emission
 * side effects keeps the §5.2 contract — "a stage/lifecycle change writes a
 * transition activity and emits the matching event" — identical across entry
 * points. The CALLER owns auth, input validation, and revalidation; these own
 * the DB write plus its side effects. `actor` is "user:<id>" | "n8n" | "system".
 */

type Pb = PocketBase;

/** Best-effort activity write — must never break the primary mutation. */
export async function logActivity(
  pb: Pb,
  a: { contact: string; deal?: string; type: string; title: string; detail?: string; meta?: unknown; actor?: string },
): Promise<void> {
  try {
    await pb.collection('activities').create({
      contact: a.contact,
      deal: a.deal || '',
      type: a.type,
      title: a.title,
      detail: a.detail || '',
      meta: a.meta || {},
      actor: a.actor || 'system',
    });
  } catch {
    /* swallow */
  }
}

/**
 * Find a contact by phone and/or email, creating a minimal one (lifecycle
 * "lead") if none matches. Used for inbound messages/calls where only the
 * external party's number/address is known (§9: unmatched inbound → auto-upsert
 * by phone/email). Returns the contact id, or null if no identifier was given.
 */
export async function findOrCreateContact(
  pb: Pb,
  opts: { phone?: string; email?: string; name?: string },
): Promise<string | null> {
  const phone = (opts.phone || '').trim();
  const email = (opts.email || '').trim();
  if (!phone && !email) return null;

  const parts: string[] = [];
  const params: Record<string, string> = {};
  if (phone) { parts.push('phone = {:phone}'); params.phone = phone; }
  if (email) { parts.push('email = {:email}'); params.email = email; }
  const lookup = () => pb.collection('contacts').getFirstListItem(pb.filter(parts.join(' || '), params));

  try {
    return (await lookup()).id;
  } catch {
    /* not found — create below */
  }
  try {
    const created = await pb.collection('contacts').create({
      name: opts.name || phone || email,
      phone,
      email,
      lifecycle_status: 'lead',
    });
    return created.id;
  } catch {
    try { return (await lookup()).id; } catch { return null; } // lost a create race
  }
}

export interface CreateDealInput {
  contact_id: string;
  title?: string;
  stage: string;
  estimate_value?: number;
  won_value?: number;
  source_id?: string;
  referred_by?: string;
  lost_reason?: string;
}

/** Create a deal, log the initial stage as an activity, and emit deal.created. */
export async function createDealRecord(pb: Pb, input: CreateDealInput, actor: string): Promise<any> {
  const data: Record<string, unknown> = {
    contact: input.contact_id,
    title: input.title || '',
    stage: input.stage,
    estimate_value: input.estimate_value ?? 0,
    won_value: input.won_value ?? 0,
    source: input.source_id || '',
    referred_by: input.referred_by || '',
  };
  if (input.lost_reason) data.lost_reason = input.lost_reason;
  if (input.stage === 'won' || input.stage === 'lost') data.closed_at = new Date().toISOString();

  const deal = await pb.collection('deals').create(data);
  await logActivity(pb, {
    contact: input.contact_id,
    deal: deal.id,
    type: 'deal_stage_changed',
    title: `Deal created in stage "${input.stage}"`,
    meta: { old: null, new: input.stage },
    actor,
  });
  try { await dispatchEvent('deal.created', deal); } catch { /* swallow */ }
  return deal;
}

/**
 * Apply a deal stage transition: no-op if unchanged; else update (stamping
 * closed_at on won/lost), log a deal_stage_changed activity, and emit
 * deal.stage_changed (+ deal.won / deal.lost on a terminal stage).
 */
export async function applyDealStageChange(
  pb: Pb, id: string, newStage: string, actor: string,
): Promise<{ changed: boolean; deal: any }> {
  const existing = await pb.collection('deals').getOne(id);
  const old = existing.stage;
  if (old === newStage) return { changed: false, deal: existing };

  const data: Record<string, unknown> = { stage: newStage };
  if (newStage === 'won' || newStage === 'lost') data.closed_at = new Date().toISOString();
  const deal = await pb.collection('deals').update(id, data);

  await logActivity(pb, {
    contact: existing.contact,
    deal: id,
    type: 'deal_stage_changed',
    title: `Stage changed: ${old} → ${newStage}`,
    meta: { old, new: newStage },
    actor,
  });
  try {
    await dispatchEvent('deal.stage_changed', { deal, old_stage: old, new_stage: newStage });
    if (newStage === 'won') await dispatchEvent('deal.won', { deal });
    else if (newStage === 'lost') await dispatchEvent('deal.lost', { deal });
  } catch { /* swallow */ }
  return { changed: true, deal };
}

/**
 * Apply a contact lifecycle_status transition: no-op if unchanged; else update,
 * log a lifecycle_changed activity, and emit contact.lifecycle_changed.
 */
export async function applyContactLifecycleChange(
  pb: Pb, id: string, newLifecycle: string, actor: string,
): Promise<{ changed: boolean; contact: any }> {
  const existing = await pb.collection('contacts').getOne(id);
  const old = existing.lifecycle_status || '';
  if (old === newLifecycle) return { changed: false, contact: existing };

  const contact = await pb.collection('contacts').update(id, { lifecycle_status: newLifecycle });
  await logActivity(pb, {
    contact: id,
    type: 'lifecycle_changed',
    title: `Lifecycle: ${old || '—'} → ${newLifecycle}`,
    meta: { old: old || null, new: newLifecycle },
    actor,
  });
  try { await dispatchEvent('contact.lifecycle_changed', { contact, old: old || null, new: newLifecycle }); }
  catch { /* swallow */ }
  return { changed: true, contact };
}
