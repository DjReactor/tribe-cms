import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { purgePublicCache, intervalElapsed } from '@/lib/cache-purge';

export const dynamic = 'force-dynamic';

/**
 * Purge the ISR cache for the whole public site.
 *
 * Two modes:
 *   {}                 force  — purge unconditionally. Used by the boot purge
 *                               in `src/instrumentation.ts`.
 *   { mode: 'ttl' }    timed  — purge only if `settings.cache_ttl_minutes` has
 *                               elapsed since `cache_last_purged`. Called every
 *                               tick by the background worker, so the schedule
 *                               lives in the database and survives restarts.
 *
 * WHY A BOOT PURGE IS REQUIRED, not merely nice to have: public pages are
 * prerendered at build time, and the pipeline builds `.next` ONCE on the master
 * checkout with no client PocketBase reachable, then reuses that artifact for
 * every instance. The shipped HTML therefore carries the mock fallbacks from
 * `lib/settings.ts` — "Tribe CMS Preview", "(555) 123-4567" — identical for
 * every client. Without a purge on boot each instance serves that placeholder
 * until the layout's `revalidate` backstop expires it.
 *
 * Boot is the right trigger because every deploy restarts the process, so this
 * covers both `update-instance.sh` and the host-side `deploy-instance.sh`
 * without either script needing to know the cache exists.
 *
 * Auth: Bearer INTERNAL_SECRET, same as the other /api/internal routes.
 */
function authorized(req: Request): boolean {
  const secret = process.env.INTERNAL_SECRET;
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let mode = 'force';
  try {
    const body = await req.json();
    if (body && typeof body.mode === 'string') mode = body.mode;
  } catch {
    /* no body = force */
  }

  if (mode === 'ttl') {
    const settings = await getSettings();
    const ttl = settings.cache_ttl_minutes ?? 0;
    if (!intervalElapsed(ttl, settings.cache_last_purged ?? '')) {
      return NextResponse.json({ revalidated: false, reason: 'interval-not-elapsed', ttlMinutes: ttl });
    }
    const { purgedAt } = await purgePublicCache(`interval:${ttl}m`);
    return NextResponse.json({ revalidated: true, mode: 'ttl', purgedAt });
  }

  const { purgedAt } = await purgePublicCache('force');
  return NextResponse.json({ revalidated: true, mode: 'force', purgedAt });
}
