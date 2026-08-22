import PocketBase from 'pocketbase';

/**
 * The anonymous, cookie-free PocketBase client for public-site reads.
 *
 * WHY THIS EXISTS — this is the difference between a cached site and a
 * server-rendered-on-every-request one:
 *
 * `getPocketBaseClient()` in `./pocketbase` calls `cookies()` to load the BO
 * session. In Next.js, touching `cookies()` opts the surrounding route out of
 * static rendering permanently — no `revalidate` export can override it. Because
 * the root `not-found.tsx` calls `getSettings()`, and Next renders the root
 * not-found speculatively as part of *every* route, that one `cookies()` call
 * made every route in the app dynamic, including routes that fetch nothing at
 * all. Verified by build: a page returning a literal `<div>hello</div>` was
 * still marked `ƒ` until the public paths moved onto this client.
 *
 * RULES:
 * - Use this for anything the public site renders, plus `not-found.tsx`,
 *   `sitemap.ts` and `sitemap-images.xml`.
 * - Never use it for dashboard writes. It carries no auth, so per the
 *   write-path rule in AGENTS.md the write would be rejected outright.
 * - Only read collections that are anonymously readable in committed
 *   migrations. An anonymous client reading an auth-gated collection gets an
 *   EMPTY LIST, not an error — and every caller here has a `catch { return [] }`,
 *   so the failure looks exactly like "no data yet". `contacts` and
 *   `ai_call_logs` are `@request.auth.id != ''`; `redirects`, `seo_404_log` and
 *   `api_keys` are superuser-only. Those need `getAdminPocketBase()`.
 */
export async function getPublicPocketBase() {
  const url = process.env['PB_URL'] || 'http://127.0.0.1:8090';
  return new PocketBase(url);
}
