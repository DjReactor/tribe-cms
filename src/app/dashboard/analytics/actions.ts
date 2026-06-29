'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/** Read every analytics view collection in parallel (§7). */
export async function getAnalytics() {
  await requireAuth();
  const pb = await getPocketBaseClient();
  const get = (name: string, opts: Record<string, unknown> = {}) =>
    pb.collection(name).getFullList(opts).catch(() => [] as any[]);

  const [summary, funnel, revenueBySource, topReferrers, costClose, costCohort, callOutcomes, speedToLead] =
    await Promise.all([
      get('analytics_summary'),
      get('analytics_deals_funnel'),
      get('analytics_revenue_by_source', { sort: '-revenue' }),
      get('analytics_top_referrers', { sort: '-referred_revenue' }),
      get('analytics_cost_per_source_close', { sort: 'source,period' }),
      get('analytics_cost_per_source_cohort', { sort: 'source,period' }),
      get('analytics_call_outcomes', { sort: '-calls' }),
      get('analytics_speed_to_lead'),
    ]);

  return {
    summary: summary[0] || null,
    funnel,
    revenueBySource,
    topReferrers,
    costClose,
    costCohort,
    callOutcomes,
    speedToLead: speedToLead[0] || null,
  };
}

/** Source-spend rows for the Ad Spend panel, newest period first. */
export async function getSourceSpend() {
  await requireAuth();
  const pb = await getPocketBaseClient();
  return pb.collection('source_spend').getFullList({ sort: '-period', expand: 'source' }).catch(() => []);
}

/** Create or update a monthly spend row (unique by source + period). */
export async function upsertSourceSpend(input: { source: string; period: string; amount: number; notes?: string }) {
  try {
    await requireAuth();
    if (!input.source) return { success: false, error: 'Select a source.' };
    if (!/^\d{4}-\d{2}$/.test(input.period)) return { success: false, error: 'Period must be YYYY-MM.' };
    const pb = await getPocketBaseClient();
    const data = { source: input.source, period: input.period, amount: input.amount ?? 0, notes: input.notes || '' };

    let existing: any = null;
    try {
      existing = await pb
        .collection('source_spend')
        .getFirstListItem(pb.filter('source = {:s} && period = {:p}', { s: input.source, p: input.period }));
    } catch {
      /* none — create */
    }
    if (existing) await pb.collection('source_spend').update(existing.id, data);
    else await pb.collection('source_spend').create(data);

    revalidatePath('/dashboard/analytics');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSourceSpend(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('source_spend').delete(id);
    revalidatePath('/dashboard/analytics');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
