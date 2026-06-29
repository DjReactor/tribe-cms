'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { createDealRecord, applyDealStageChange } from '@/lib/crm-writes';
import { revalidatePath } from 'next/cache';

const STAGES = ['new', 'estimate_scheduled', 'quoted', 'won', 'lost'];

export async function getDeals() {
  const pb = await getPocketBaseClient();
  return pb
    .collection('deals')
    .getFullList({ sort: '-created', expand: 'contact,source,referred_by' })
    .catch(() => []);
}

export async function getActiveLeadSources() {
  const pb = await getPocketBaseClient();
  return pb
    .collection('lead_sources')
    .getFullList({ filter: 'is_active = true', sort: 'sort_order,slug' })
    .catch(() => []);
}

/** Fuzzy typeahead for the contact + referrer pickers (§4.1). */
export async function searchContacts(q: string) {
  const term = (q || '').trim().replace(/["\\]/g, ''); // strip filter-breaking chars
  if (!term) return [];
  const pb = await getPocketBaseClient();
  try {
    const res = await pb.collection('contacts').getList(1, 10, {
      filter: `name ~ "${term}" || phone ~ "${term}" || email ~ "${term}"`,
      sort: '-created',
    });
    return res.items.map((c: any) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone }));
  } catch {
    return [];
  }
}

export async function createDeal(input: {
  contact_id: string;
  title?: string;
  stage: string;
  estimate_value?: number;
  won_value?: number;
  source_id?: string;
  referred_by?: string;
}) {
  try {
    const user = await requireAuth();
    if (!input.contact_id) return { success: false, error: 'Select a contact for this deal.' };
    if (!STAGES.includes(input.stage)) return { success: false, error: 'Invalid stage.' };

    const pb = await getPocketBaseClient();
    await createDealRecord(pb, {
      contact_id: input.contact_id,
      title: input.title,
      stage: input.stage,
      estimate_value: input.estimate_value,
      won_value: input.won_value,
      source_id: input.source_id,
      referred_by: input.referred_by,
    }, `user:${user.id}`);

    revalidatePath('/dashboard/deals');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create deal.' };
  }
}

export async function updateDealStage(id: string, stage: string) {
  try {
    const user = await requireAuth();
    if (!STAGES.includes(stage)) return { success: false, error: 'Invalid stage.' };

    const pb = await getPocketBaseClient();
    await applyDealStageChange(pb, id, stage, `user:${user.id}`);

    revalidatePath('/dashboard/deals');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update stage.' };
  }
}

/** Edit a deal's non-stage fields (title/values). Stage changes go through updateDealStage. */
export async function updateDeal(
  id: string,
  fields: { title?: string; estimate_value?: number; won_value?: number },
) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    const data: Record<string, unknown> = {};
    if (fields.title !== undefined) data.title = fields.title;
    if (fields.estimate_value !== undefined) data.estimate_value = fields.estimate_value;
    if (fields.won_value !== undefined) data.won_value = fields.won_value;
    if (Object.keys(data).length) await pb.collection('deals').update(id, data);
    revalidatePath('/dashboard/deals');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update deal.' };
  }
}
