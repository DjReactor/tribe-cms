/**
 * The one slug rule, shared by the server actions and the dashboard forms.
 *
 * Every slug in this CMS is a URL segment, and three of them are the whole
 * address of a page: `/services/<slug>`, `/<area-slug>`, and
 * `/<area-slug>/<pair-slug>`. So a slug that is not a clean segment does not
 * merely look untidy — it makes the record unreachable:
 *
 *  - PocketBase text matching is CASE-SENSITIVE (verified against the running
 *    binary), so an area stored as `Napa Valley` is never found by a lookup for
 *    `napa-valley`, and the path built from it contains a literal space.
 *  - A slug containing `/` splits into segments the route cannot match at all.
 *    `wine/country` as an area gives `/wine/country`, which the single-segment
 *    area route never sees and the two-segment landing-page route reads as area
 *    `wine` + page `country` — a 404 either way, and the sitemap advertises it.
 *
 * The dashboard forms auto-derive a slug from the name, but only while creating
 * and only until somebody types in the field — after that whatever they typed
 * was stored verbatim. Normalising here means the rule holds however the value
 * arrives, which is also what "keep normalization server-side" in the project
 * AGENTS.md asks for.
 *
 * Nothing here imports anything server-only, so the browser forms run the exact
 * same rule the actions enforce on save.
 */

/**
 * Lowercase, accents folded, non-alphanumerics collapsed to single hyphens.
 *
 * The fold matters for real place names: without it "Cañon City" becomes
 * `caon-city` and "Española" becomes `espaola`, because the accented letter is
 * simply dropped. Decomposing first turns them into `canon-city` and
 * `espanola`, which is what somebody would have typed by hand.
 */
export function slugify(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * `slugify`, but null when nothing usable survives.
 *
 * `"!!!"` and `"   "` both normalise to the empty string. Storing that would
 * give an area the site root and a landing page its area's own URL, so the
 * caller has to refuse rather than write it.
 */
export function normalizeSlug(value: string): string | null {
  const slug = slugify(value);
  return slug === '' ? null : slug;
}

/** The message shown when a slug normalises away to nothing. */
export const SLUG_UNUSABLE_MESSAGE =
  'That slug has no letters or numbers in it. Use something like "santa-rosa".';
