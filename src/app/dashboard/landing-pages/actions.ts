'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAgencyAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Pair, Service, ServiceArea, ManualChecklistItem } from '@/types/index';
import { canPublish, getPairPath, type ReadinessSource } from '@/lib/pair-readiness';
import { syncSlugRedirect, clearRedirectShadowing } from '@/lib/redirects';
import { normalizeSlug, SLUG_UNUSABLE_MESSAGE } from '@/lib/slug';

/**
 * Landing pages (`pairs`) — one service in one area, at `/{area.slug}/{slug}`.
 *
 * Every action here gates on `requireAgencyAdmin()`. The collection's own write
 * rule is `@request.auth.id != ''`, which is the FLOOR, not the policy: pairs
 * live in the agency-only Design & SEO group, and the rule alone would let a BO
 * write them through the API. The cookie client is the correct write path given
 * that rule (see the write-path rule in tribe-cms/AGENTS.md).
 *
 * There is deliberately NO bulk-create path. Creation is one deliberate act per
 * page, because the page count equalling what somebody actually wrote is the
 * entire defence against this looking like a doorway family to Google.
 */

const pairSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  h1: z.string().optional().or(z.literal('')),
  intro: z.string().optional().or(z.literal('')),
  body: z.any().optional(),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  noindex: z.boolean(),
  is_published: z.boolean(),
  manual_checklist: z.record(z.string(), z.boolean()),
});

const plain = <T,>(value: unknown): T => JSON.parse(JSON.stringify(value)) as T;

function revalidatePairs(areaSlug?: string, slug?: string) {
  // Every one of these records is passed to the shared (public) layout
  // (nav, JSON-LD, global props), so a change affects every public page,
  // not just this section's routes. Public pages are cached, so scope the
  // invalidation to the layout rather than enumerating routes that drift.
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/landing-pages');
  if (areaSlug && slug) revalidatePath(`/${areaSlug}/${slug}`);
  revalidatePath('/sitemap.xml');
}

/** Everything the three landing-page screens read, in one pass. */
export async function getLandingPagesData(): Promise<{
  pairs: Pair[];
  services: Service[];
  areas: ServiceArea[];
  source: ReadinessSource;
  checklistItems: ManualChecklistItem[];
}> {
  await requireAgencyAdmin();
  const pb = await getPocketBaseClient();

  const [pairs, services, areas, projects, testimonials, checklistItems] = await Promise.all([
    pb.collection('pairs').getFullList({ sort: 'sort_order,created' }).catch(() => []),
    pb.collection('services').getFullList({ sort: 'sort_order' }).catch(() => []),
    pb.collection('service_areas').getFullList({ sort: 'sort_order' }).catch(() => []),
    pb.collection('projects').getFullList({ filter: 'is_active = true' }).catch(() => []),
    pb.collection('testimonials').getFullList({ filter: 'is_visible = true' }).catch(() => []),
    getManualChecklistItems(),
  ]);

  return {
    pairs: plain<Pair[]>(pairs),
    services: plain<Service[]>(services),
    areas: plain<ServiceArea[]>(areas),
    source: {
      pairs: pairs.map((p: any) => ({ id: p.id, h1: p.h1, intro: p.intro })),
      // Unexpanded relations: `services` is an array of ids, `service_area` one id.
      projects: projects.map((p: any) => ({
        serviceIds: Array.isArray(p.services) ? p.services : [],
        areaId: p.service_area || '',
      })),
      testimonials: testimonials.map((t: any) => ({ location: t.author_location || '' })),
      areas: areas.map((a: any) => ({
        id: a.id,
        name: a.name,
        also_serving: Array.isArray(a.also_serving) ? a.also_serving : [],
      })),
    },
    checklistItems,
  };
}

/**
 * Materialise the second URL segment.
 *
 * `slug` is required in the schema and defaults to the service slug because the
 * URL is resolved from the stored value, never recomputed: two blank-slug pairs
 * in one area would collide on `idx_pairs_area_slug_unique` despite having
 * different real URLs. Uniqueness is scoped to the area, exactly as the URL is.
 */
function uniqueSlugInArea(wanted: string, areaPairs: Pair[], selfId: string | null): string {
  const taken = new Set(
    areaPairs.filter((p) => p.id !== selfId).map((p) => p.slug.toLowerCase()),
  );
  const base = wanted.toLowerCase();
  if (!taken.has(base)) return wanted;
  for (let n = 2; n < 100; n += 1) {
    if (!taken.has(`${base}-${n}`)) return `${wanted}-${n}`;
  }
  return `${wanted}-${Date.now()}`;
}

/**
 * Create one landing page as a draft.
 *
 * ANY pair may be created, including one with no supporting content behind it:
 * agencies do keyword research off-platform and routinely create the record
 * before the projects and reviews that will back it exist. Readiness is
 * advisory; the only hard gate is the body, and that applies at publish.
 */
export async function createPair(input: { service: string; service_area: string }) {
  try {
    await requireAgencyAdmin();
    const pb = await getPocketBaseClient();

    if (!input.service || !input.service_area) {
      return { success: false, error: 'Pick both a service and an area.' };
    }

    const service = await pb.collection('services').getOne(input.service).catch(() => null);
    const area = await pb.collection('service_areas').getOne(input.service_area).catch(() => null);
    if (!service || !area) {
      return { success: false, error: 'That service or area no longer exists.' };
    }

    const existing = await pb.collection('pairs')
      .getFirstListItem<Pair>(`service = "${input.service}" && service_area = "${input.service_area}"`)
      .catch(() => null);
    if (existing) {
      return {
        success: false,
        existingId: existing.id,
        error: 'A landing page already exists for this service in this area.',
      };
    }

    const areaPairs = await pb.collection('pairs')
      .getFullList<Pair>({ filter: `service_area = "${input.service_area}"` })
      .catch(() => []);

    const slug = uniqueSlugInArea(normalizeSlug(service.slug) || 'page', areaPairs, null);
    const record = await pb.collection('pairs').create({
      service: input.service,
      service_area: input.service_area,
      slug,
      h1: '',
      intro: '',
      body: null,
      is_published: false,
      auto_unpublished: false,
      noindex: false,
      manual_checklist: {},
      sort_order: 999,
    });

    await clearRedirectShadowing(getPairPath(area.slug, slug));

    revalidatePairs();
    return { success: true, id: record.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Publishing needs three things true: a body (the hard gate), and a service and
 * an area that are both live — a published page whose service is hidden would
 * be a page about something the site says it does not do.
 */
async function publishBlocker(pair: Pair, body: unknown): Promise<string | null> {
  if (!canPublish(body)) {
    return 'Write the page body before publishing. A landing page with no body of its own is exactly the page family Google acts on.';
  }
  const pb = await getPocketBaseClient();
  const service = await pb.collection('services').getOne(pair.service).catch(() => null);
  const area = await pb.collection('service_areas').getOne(pair.service_area).catch(() => null);
  if (!service?.is_active) return 'The service behind this page is hidden. Make it active first.';
  if (!area?.is_active) return 'The area behind this page is hidden. Make it active first.';
  return null;
}

export async function updatePair(id: string, data: unknown) {
  try {
    await requireAgencyAdmin();
    const parsed = pairSchema.parse(data);
    const pb = await getPocketBaseClient();

    const pair = await pb.collection('pairs').getOne<Pair>(id).catch(() => null);
    if (!pair) return { success: false, error: 'That landing page no longer exists.' };

    if (parsed.is_published) {
      const blocker = await publishBlocker(pair, parsed.body);
      if (blocker) return { success: false, error: blocker };
    }

    // Normalise BEFORE the clash check, so it tests the value that will be
    // stored and that the public route will look up. A slug is a URL segment:
    // `Kitchen Remodel` or `kitchen/remodel` would make the page unreachable.
    const slug = normalizeSlug(parsed.slug);
    if (!slug) return { success: false, error: SLUG_UNUSABLE_MESSAGE };

    const areaPairs = await pb.collection('pairs')
      .getFullList<Pair>({ filter: `service_area = "${pair.service_area}"` })
      .catch(() => []);
    const slugClash = areaPairs.some((p) => p.id !== id && p.slug.toLowerCase() === slug);
    if (slugClash) {
      return {
        success: false,
        error: `Another landing page in this area already uses "/${slug}". `
          + `Try "${uniqueSlugInArea(slug, areaPairs, id)}".`,
      };
    }
    await pb.collection('pairs').update(id, {
      ...parsed,
      slug,
      // Publishing is the agency saying they have looked at it, so it clears
      // the flag a cascade left behind.
      auto_unpublished: parsed.is_published ? false : pair.auto_unpublished,
    });

    const area = await pb.collection('service_areas').getOne(pair.service_area).catch(() => null);

    // The pair owns only the second segment; the first moves with the area, and
    // the area's own save handles that side (see service-areas/actions.ts).
    if (area?.slug && slug !== pair.slug) {
      await syncSlugRedirect(
        getPairPath(area.slug, pair.slug),
        getPairPath(area.slug, slug),
        'Auto-created when a landing page slug changed',
      );
      await clearRedirectShadowing(getPairPath(area.slug, slug));
    }

    revalidatePairs(area?.slug, pair.slug);
    if (area?.slug && slug !== pair.slug) revalidatePairs(area.slug, slug);
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/** The list's publish switch. Same gate as the editor, one field. */
export async function setPairPublished(id: string, is_published: boolean) {
  try {
    await requireAgencyAdmin();
    const pb = await getPocketBaseClient();

    const pair = await pb.collection('pairs').getOne<Pair>(id).catch(() => null);
    if (!pair) return { success: false, error: 'That landing page no longer exists.' };

    if (is_published) {
      const blocker = await publishBlocker(pair, pair.body);
      if (blocker) return { success: false, error: blocker };
    }

    await pb.collection('pairs').update(id, {
      is_published,
      auto_unpublished: is_published ? false : pair.auto_unpublished,
    });

    const area = await pb.collection('service_areas').getOne(pair.service_area).catch(() => null);
    revalidatePairs(area?.slug, pair.slug);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePair(id: string) {
  try {
    await requireAgencyAdmin();
    const pb = await getPocketBaseClient();

    const pair = await pb.collection('pairs').getOne<Pair>(id).catch(() => null);
    const area = pair
      ? await pb.collection('service_areas').getOne(pair.service_area).catch(() => null)
      : null;

    await pb.collection('pairs').delete(id);
    revalidatePairs(area?.slug, pair?.slug);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * The agency-defined half of the checklist: plain labels with NO logic, stored
 * in `settings.manual_checklist_items`. Adding "shot local photos" is then data,
 * not a deploy. Anything that has to be *evaluated* is a predicate over data and
 * belongs in `lib/pair-readiness.ts` as code — expressing arbitrary predicates
 * as settings rows means building a rule engine.
 *
 * Not mapped into `getSettings()`/`TemplateSettings`: this is internal agency
 * data, never a template input.
 */
export async function getManualChecklistItems(): Promise<ManualChecklistItem[]> {
  try {
    const pb = await getPocketBaseClient();
    const settings = await pb.collection('settings').getFirstListItem('');
    const items = settings.manual_checklist_items;
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export async function updateManualChecklistItems(items: ManualChecklistItem[]) {
  try {
    await requireAgencyAdmin();
    const pb = await getPocketBaseClient();
    const settings = await pb.collection('settings').getFirstListItem('');

    // Ids are assigned here rather than in the browser because they are the keys
    // `pairs.manual_checklist` ticks against: a renamed label must keep its id,
    // and a new item must never reuse one.
    const existing = new Set<string>();
    const clean = items
      .filter((item) => item.label?.trim())
      .map((item) => {
        let id = (item.id || '').trim();
        if (!id || existing.has(id)) {
          id = `chk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        }
        existing.add(id);
        return {
          id,
          label: item.label.trim(),
          ...(item.description?.trim() ? { description: item.description.trim() } : {}),
        };
      });

    await pb.collection('settings').update(settings.id, { manual_checklist_items: clean });
    revalidatePath('/dashboard/landing-pages/checklist');
    revalidatePath('/dashboard/landing-pages');
    return { success: true, items: clean };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}
