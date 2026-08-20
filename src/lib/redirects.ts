import { getAdminPocketBase } from './pocketbase-admin';

/**
 * Shared `redirects` maintenance for every collection whose slug is part of a
 * public URL.
 *
 * `redirects` has superuser-only write rules, so everything here goes through
 * the admin client per the write-path rule; callers do their own
 * `requireAuth()` / `requireAgencyAdmin()` first.
 *
 * Everything is best-effort and swallows its errors on purpose: a missing
 * redirect is a broken old link, not a failed save, and none of this should
 * ever fail the edit somebody actually asked for.
 */

/** One old→new URL move. */
export interface PathMove {
  from: string;
  to: string;
}

type Admin = Awaited<ReturnType<typeof getAdminPocketBase>>;

async function upsertRule(admin: Admin, from: string, to: string, note: string) {
  const existing = await admin.collection('redirects')
    .getFirstListItem(`from_path="${from}"`).catch(() => null);
  if (existing) {
    await admin.collection('redirects').update(existing.id, { to_path: to, type: '301' });
  } else {
    await admin.collection('redirects').create({
      from_path: from,
      to_path: to,
      type: '301',
      note,
    });
  }
}

/**
 * Re-point anything that already pointed at `from`, so a slug edited twice
 * leaves one hop rather than a chain.
 *
 * Middleware follows exactly one rule per request, so `/a → /b → /c` costs the
 * visitor a second round trip and costs the page some of whatever `/a` had
 * earned. A rule that would end up pointing at itself is deleted instead —
 * that is what a rename reversed back to its original slug produces.
 */
async function flattenChains(admin: Admin, from: string, to: string) {
  const inbound = await admin.collection('redirects')
    .getFullList({ filter: `to_path="${from}"` }).catch(() => []);

  for (const rule of inbound) {
    if (rule.from_path === to) {
      await admin.collection('redirects').delete(rule.id);
    } else {
      await admin.collection('redirects').update(rule.id, { to_path: to });
    }
  }
}

/** Point `oldPath` at `newPath`, keeping the rule set free of chains. */
export async function syncSlugRedirect(oldPath: string, newPath: string, note: string) {
  await syncSlugRedirects([{ from: oldPath, to: newPath }], note);
}

/**
 * The batch form. A service area renaming its slug moves its own URL *and*
 * every landing page underneath it, since a pair lives at
 * `/{area.slug}/{pair.slug}` — so one rename is N+1 stranded URLs, not one.
 */
export async function syncSlugRedirects(moves: PathMove[], note: string) {
  const real = moves.filter((m) => m.from && m.to && m.from !== m.to);
  if (real.length === 0) return;

  try {
    const admin = await getAdminPocketBase();
    for (const move of real) {
      await upsertRule(admin, move.from, move.to, note);
      await flattenChains(admin, move.from, move.to);
    }
  } catch {
    // Non-fatal: see the module comment.
  }
}

/**
 * Drop any rule aimed at a path a live page now occupies.
 *
 * Middleware applies redirects *before* routing, so a stale rule whose
 * `from_path` matches a real page shadows that page completely — the page
 * exists and is unreachable. Call this whenever a record takes a path.
 */
export async function clearRedirectShadowing(...paths: string[]) {
  const real = paths.filter(Boolean);
  if (real.length === 0) return;

  try {
    const admin = await getAdminPocketBase();
    for (const path of real) {
      const shadows = await admin.collection('redirects')
        .getFullList({ filter: `from_path="${path}"` }).catch(() => []);
      for (const shadow of shadows) {
        await admin.collection('redirects').delete(shadow.id);
      }
    }
  } catch {
    // Non-fatal: see the module comment.
  }
}
