'use server';

import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { requireAgencyAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const STATUSES = ['pending', 'delivering', 'delivered', 'failed', 'dead'];

/**
 * Outbox observability (Phase 6). event_outbox is admin-only (all rules null),
 * so this reads via getAdminPocketBase but is gated to agency admins. Returns
 * null for non-admins so the page can render a friendly notice.
 */
export async function getOutboxSummary() {
  try {
    await requireAgencyAdmin();
  } catch {
    return null;
  }
  const pb = await getAdminPocketBase();

  const counts: Record<string, number> = {};
  for (const status of STATUSES) {
    try {
      const res = await pb.collection('event_outbox').getList(1, 1, { filter: pb.filter('status = {:s}', { s: status }) });
      counts[status] = res.totalItems;
    } catch {
      counts[status] = 0;
    }
  }

  let recent: any[] = [];
  try {
    recent = (
      await pb.collection('event_outbox').getList(1, 30, { filter: 'status = "failed" || status = "dead"', sort: '-updated' })
    ).items;
  } catch {
    recent = [];
  }

  return { counts, recent };
}

/** Re-queue all failed/dead events for immediate redelivery (ops tool). */
export async function retryOutboxFailures() {
  try {
    await requireAgencyAdmin();
    const pb = await getAdminPocketBase();
    const now = new Date().toISOString();
    const rows = await pb
      .collection('event_outbox')
      .getFullList({ filter: 'status = "failed" || status = "dead"' })
      .catch(() => [] as any[]);
    let count = 0;
    for (const r of rows) {
      try {
        await pb.collection('event_outbox').update(r.id, { status: 'pending', attempts: 0, next_attempt_at: now, last_error: '' });
        count += 1;
      } catch {
        /* skip */
      }
    }
    revalidatePath('/dashboard/outbox');
    return { success: true, count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
