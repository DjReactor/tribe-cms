import type PocketBase from 'pocketbase';

/**
 * Canonicalize a source value into a `lead_sources` slug.
 * Restricts to [a-z0-9_] so the result is safe to interpolate into a PB filter
 * and stable as a lookup key (e.g. "Facebook Ads" -> "facebook_ads").
 */
export function normalizeSourceSlug(input?: string | null): string {
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function labelOf(slug: string): string {
  return slug
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Resolve a source value to a `lead_sources` record id, auto-creating the row
 * (flagged `needs_review`) on a miss so an inbound/form lead is never dropped
 * for an unknown source (§4.0.1 / §5.2). Empty/blank input resolves to the
 * seeded "website" row. Requires a pb client that can read+write lead_sources
 * (admin client for webhooks, or an authenticated BO client).
 */
export async function resolveLeadSourceId(pb: PocketBase, input?: string | null): Promise<string> {
  const slug = normalizeSourceSlug(input) || 'website';
  try {
    const row = await pb.collection('lead_sources').getFirstListItem(`slug="${slug}"`);
    return row.id;
  } catch {
    try {
      const created = await pb.collection('lead_sources').create({
        slug,
        label: labelOf(slug),
        is_active: true,
        needs_review: true,
        sort_order: 99,
      });
      return created.id;
    } catch {
      // Lost a create race with a concurrent request — re-read the winner.
      const row = await pb.collection('lead_sources').getFirstListItem(`slug="${slug}"`);
      return row.id;
    }
  }
}
