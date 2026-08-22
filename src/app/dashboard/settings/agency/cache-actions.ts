'use server';

import { requireAgencyAdmin } from '@/lib/auth';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { purgePublicCache } from '@/lib/cache-purge';
import { revalidatePath } from 'next/cache';

export type CacheSettingsView = {
  cache_ttl_minutes: number;
  cache_last_purged: string;
};

/**
 * Agency-only cache controls. `settings` writes are superuser-only per the
 * write-path rule, so these go through `requireAgencyAdmin()` + the admin
 * client rather than the cookie client.
 */
export async function getCacheSettings(): Promise<CacheSettingsView> {
  await requireAgencyAdmin();
  try {
    const pb = await getAdminPocketBase();
    const record: any = await pb.collection('settings').getFirstListItem('');
    return {
      cache_ttl_minutes: Number(record?.cache_ttl_minutes) || 0,
      cache_last_purged: record?.cache_last_purged || '',
    };
  } catch {
    return { cache_ttl_minutes: 0, cache_last_purged: '' };
  }
}

export async function updateCacheSettings(
  ttlMinutes: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAgencyAdmin();

    const n = Math.trunc(Number(ttlMinutes));
    if (!Number.isFinite(n) || n < 0 || n > 1440) {
      return { success: false, error: 'Interval must be between 0 and 1440 minutes.' };
    }

    const pb = await getAdminPocketBase();
    const record: any = await pb.collection('settings').getFirstListItem('');
    if (!record?.id) return { success: false, error: 'Settings record not found.' };

    await pb.collection('settings').update(record.id, { cache_ttl_minutes: n });
    revalidatePath('/dashboard/settings/agency');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to save.' };
  }
}

/** The "Purge now" button. A server action has a request context, so this can
 *  call the shared purge helper directly rather than going over HTTP. */
export async function purgeCacheNow(): Promise<{ success: boolean; purgedAt?: string; error?: string }> {
  try {
    await requireAgencyAdmin();
    const { purgedAt } = await purgePublicCache('manual');
    revalidatePath('/dashboard/settings/agency');
    return { success: true, purgedAt };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Purge failed.' };
  }
}
