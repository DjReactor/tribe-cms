import { revalidatePath } from 'next/cache';
import { getAdminPocketBase } from './pocketbase-admin';

/**
 * The one place the public ISR cache is purged.
 *
 * `revalidatePath('/', 'layout')` invalidates the public layout and everything
 * beneath it, so the next request for each page regenerates against this
 * instance's real PocketBase.
 *
 * Callers, all of which funnel through here so the `cache_last_purged` stamp
 * can never drift from the actual purge:
 *   - boot            `src/instrumentation.ts`, once per server start
 *   - interval        the background tick, when `cache_ttl_minutes` has elapsed
 *   - manual          the agency settings "Purge now" button
 *
 * NOTE: `revalidatePath` requires a request context, so this can only be called
 * from a server action or route handler — never from module scope or from
 * `instrumentation.ts` directly. That is why boot purging goes over HTTP to the
 * internal route rather than calling this function in-process.
 */
export async function purgePublicCache(reason: string): Promise<{ purgedAt: string }> {
  revalidatePath('/', 'layout');
  const purgedAt = new Date().toISOString();

  // Best-effort stamp. `settings` writes are superuser-only, hence the admin
  // client. A failed stamp must not fail the purge — the cache is already
  // cleared by this point, and the only cost is that the interval check falls
  // back to its previous baseline.
  try {
    const pb = await getAdminPocketBase();
    const record: any = await pb.collection('settings').getFirstListItem('');
    if (record?.id) {
      await pb.collection('settings').update(record.id, { cache_last_purged: purgedAt });
    }
  } catch {
    /* stamp is advisory */
  }

  console.log(`[cache-purge] public cache purged (${reason}) at ${purgedAt}`);
  return { purgedAt };
}

/**
 * Has the agency-configured interval elapsed since the last purge?
 *
 * `cache_ttl_minutes` of 0 (or absent) means "never purge on a timer" — the
 * framework `revalidate` backstop on the public layout is then the only
 * time-based refresh.
 */
export function intervalElapsed(ttlMinutes: number, lastPurged: string): boolean {
  if (!ttlMinutes || ttlMinutes <= 0) return false;
  if (!lastPurged) return true;          // never purged — do it now
  const last = new Date(lastPurged).getTime();
  if (Number.isNaN(last)) return true;   // unparseable stamp — treat as due
  return Date.now() - last >= ttlMinutes * 60_000;
}
