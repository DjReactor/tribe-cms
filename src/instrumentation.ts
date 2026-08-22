/**
 * Boot-time ISR cache purge.
 *
 * THE PROBLEM: public pages are prerendered at build time, and the deploy
 * pipeline builds `.next` once on the master checkout — with no client
 * PocketBase reachable — then copies that same artifact to every instance. So
 * the HTML that ships contains the mock fallbacks from `lib/settings.ts`
 * ("Tribe CMS Preview", "(555) 123-4567"), identical for every client. Left
 * alone, each site serves that placeholder until the `revalidate` backstop on
 * `(public)/layout.tsx` expires it an hour later.
 *
 * WHY HERE: every deploy restarts the process, so boot is a reliable signal
 * that new pre-baked HTML may have landed. Putting it in the app means both
 * `update-instance.sh` and the host-side `deploy-instance.sh` are covered
 * without either knowing the cache exists — the earlier version of this fix
 * lived in the update script, which left fresh deploys broken and depended on
 * an easily-forgotten `scp`.
 *
 * WHY OVER HTTP: `revalidatePath` needs a request context. It cannot be called
 * from `register()`, so this pokes the app's own internal route, which has one.
 *
 * Fire-and-forget by design: `register()` must not block startup, and a failed
 * purge is a soft failure — pages still refresh on the backstop.
 */
export async function register() {
  // Node runtime only (skip the edge/middleware pass), and production only —
  // in dev nothing is prerendered from a stale build.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.TRIBE_DISABLE_BOOT_PURGE === '1') return;

  void purgeWhenReady();
}

async function purgeWhenReady() {
  const port = process.env.PORT || '3000';
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    console.warn('[boot-purge] INTERNAL_SECRET not set; skipping. Public pages will refresh on the revalidate backstop.');
    return;
  }

  const url = `http://127.0.0.1:${port}/api/internal/revalidate`;

  // `register()` runs before the server accepts connections, so the first few
  // attempts are expected to fail. Back off and retry for ~30s, then give up.
  for (let attempt = 1; attempt <= 10; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 1 ? 2000 : 3000));
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        console.log('[boot-purge] public cache purged on startup');
        return;
      }
      // 401 means the secret is wrong — retrying will not fix it.
      if (res.status === 401) {
        console.warn('[boot-purge] unauthorized; check INTERNAL_SECRET');
        return;
      }
    } catch {
      /* server not listening yet — retry */
    }
  }
  console.warn('[boot-purge] gave up after 10 attempts; pages will refresh on the revalidate backstop.');
}
