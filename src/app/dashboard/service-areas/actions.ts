'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ServiceArea } from '@/types/index';
import { validateAreaParent, isReservedRootSlug, RESERVED_ROOT_SLUGS } from '@/lib/area-tree';
import { autoUnpublishPairsFor, pairsForArea, blockedByPairsMessage } from '@/lib/pairs';

const serviceAreaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  parent: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  custom_h1: z.string().optional().or(z.literal('')),
  custom_intro: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  page_content: z.any().optional(),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  focus_keyword: z.string().optional().or(z.literal('')),
  noindex: z.boolean().default(false),
  geo_latitude: z.string().optional().or(z.literal('')),
  geo_longitude: z.string().optional().or(z.literal('')),
  also_serving: z.array(z.string()).default([])
    .transform((arr) => Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)))),
});

export async function getServiceAreas() {
  const pb = await getPocketBaseClient();
  return pb.collection('service_areas').getFullList({
    sort: 'sort_order',
  }).catch(() => []);
}

export async function getServiceArea(id: string) {
  const pb = await getPocketBaseClient();
  return pb.collection('service_areas').getOne(id).catch(() => null);
}

/** Every area, active or not — hierarchy and slug rules must see hidden ones. */
async function allAreas(): Promise<ServiceArea[]> {
  const pb = await getPocketBaseClient();
  return pb.collection('service_areas').getFullList<ServiceArea>({ sort: 'sort_order' }).catch(() => []);
}

/**
 * Areas live at the site ROOT, which makes their slugs the scarcest namespace
 * on the site and gives them two failure modes a nested collection does not
 * have:
 *
 *  1. A slug that collides with a static route (`blog`, `contact`) does not
 *     error — Next resolves static segments before dynamic ones, so the area
 *     silently becomes unreachable behind the real page. Nothing about the save
 *     would look wrong.
 *  2. A slug that collides with another area hits the unique index and comes
 *     back as a PocketBase constraint error nobody can act on.
 *
 * Both are common in real use ("New York" the state next to "New York City"),
 * so both are caught here and answered with a slug that would work rather than
 * a flat refusal.
 */
function checkAreaSlug(
  slug: string,
  id: string | null,
  areas: ServiceArea[],
  stateCode?: string,
): string | null {
  const wanted = slug.trim().toLowerCase();
  if (!wanted) return null;

  const taken = new Set<string>(RESERVED_ROOT_SLUGS.map((s) => s.toLowerCase()));
  for (const area of areas) {
    if (area.id !== id) taken.add(area.slug.toLowerCase());
  }
  if (!taken.has(wanted)) return null;

  const suggestion = suggestAreaSlug(wanted, taken, stateCode);
  if (isReservedRootSlug(wanted)) {
    return `"/${wanted}" is a built-in page, so an area with that slug would never be reachable. `
      + `Try "${suggestion}".`;
  }
  return `Another service area already uses "/${wanted}". Try "${suggestion}".`;
}

/**
 * The state code first ("new-york" -> "new-york-ny"), because that is what a
 * human writing the two apart would reach for; a counter only when there is no
 * state to lean on or it is taken too.
 */
function suggestAreaSlug(slug: string, taken: Set<string>, stateCode?: string): string {
  const code = (stateCode || '').trim().toLowerCase();
  if (code && !taken.has(`${slug}-${code}`)) return `${slug}-${code}`;
  for (let n = 2; n < 50; n += 1) {
    if (!taken.has(`${slug}-${n}`)) return `${slug}-${n}`;
  }
  return `${slug}-area`;
}

async function stateCodeFor(id: string | undefined): Promise<string | undefined> {
  if (!id) return undefined;
  try {
    const pb = await getPocketBaseClient();
    const state = await pb.collection('states').getOne(id);
    return state.code as string;
  } catch {
    return undefined;
  }
}

/** Area pages are dynamic under one root segment — revalidate the segment. */
function revalidateAreas() {
  revalidatePath('/dashboard/service-areas');
  revalidatePath('/service-areas');
  revalidatePath('/[area-slug]', 'page');
  revalidatePath('/');
  revalidatePath('/sitemap.xml');
}

export async function createServiceArea(data: any) {
  try {
    await requireAuth();
    const parsedData = serviceAreaSchema.parse(data);
    const pb = await getPocketBaseClient();

    const areas = await allAreas();
    const parentError = validateAreaParent(parsedData.parent || '', null, areas);
    if (parentError) return { success: false, error: parentError };

    const slugError = checkAreaSlug(
      parsedData.slug, null, areas, await stateCodeFor(parsedData.state || undefined),
    );
    if (slugError) return { success: false, error: slugError };

    const record = await pb.collection('service_areas').create({ ...parsedData, sort_order: 999 });

    revalidateAreas();
    return { success: true, id: record.id };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateServiceArea(id: string, data: any) {
  try {
    await requireAuth();
    const parsedData = serviceAreaSchema.parse(data);
    const pb = await getPocketBaseClient();

    const areas = await allAreas();
    const parentError = validateAreaParent(parsedData.parent || '', id, areas);
    if (parentError) return { success: false, error: parentError };

    const slugError = checkAreaSlug(
      parsedData.slug, id, areas, await stateCodeFor(parsedData.state || undefined),
    );
    if (slugError) return { success: false, error: slugError };

    const before = areas.find((area) => area.id === id);

    await pb.collection('service_areas').update(id, parsedData);

    // Hiding an area takes its landing pages down with it (decision 4).
    let unpublished = 0;
    if (before?.is_active && !parsedData.is_active) {
      unpublished = await autoUnpublishPairsFor({ serviceArea: id });
    }

    revalidateAreas();
    return { success: true, unpublished };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateServiceAreasOrder(items: { id: string; sort_order: number }[]) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();

    for (const item of items) {
      await pb.collection('service_areas').update(item.id, { sort_order: item.sort_order });
    }

    revalidateAreas();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleServiceAreaActive(id: string, is_active: boolean) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('service_areas').update(id, { is_active });

    const unpublished = is_active ? 0 : await autoUnpublishPairsFor({ serviceArea: id });

    revalidateAreas();
    return { success: true, unpublished };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * PocketBase refuses to delete a record a required relation points at, and a
 * landing page requires its area. Rather than surfacing that as a constraint
 * error, refuse first and say what to do — which is also what the design wants:
 * a landing page is reviewed by a human, never removed as a side effect.
 *
 * Child areas are a different case: `parent` is optional, so they survive the
 * delete and surface as top-level areas.
 */
export async function deleteServiceArea(id: string) {
  try {
    await requireAuth();

    const dependents = await pairsForArea(id);
    if (dependents.length > 0) {
      return { success: false, error: blockedByPairsMessage(dependents.length, 'service area') };
    }

    const pb = await getPocketBaseClient();
    await pb.collection('service_areas').delete(id);
    revalidateAreas();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
