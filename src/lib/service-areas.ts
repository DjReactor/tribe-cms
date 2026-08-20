import { getPocketBaseClient } from './pocketbase';
import type { ServiceArea, ServiceAreaNode } from '@/types/index';
import { cache } from 'react';

/**
 * Server-side access to the service-area forest — the mirror of `./services`.
 *
 * The tree maths lives in `./area-tree` with no server imports, so the
 * dashboard's parent picker runs the identical depth and cycle rules in the
 * browser that the server actions enforce on save.
 *
 * Area paths are FLAT at every tier (`/santa-rosa`, never
 * `/california/sonoma-county/santa-rosa`) because landing pages are
 * `/{area.slug}/{pair.slug}`: nested area paths would make a landing page a
 * variable-depth URL with no way for the router to tell where the area ends and
 * the service begins. See `./area-tree` for the full reasoning.
 */
export * from './area-tree';
import { buildAreaTree, flattenAreaTree } from './area-tree';

/** Active areas only, in sibling order. Cached per request. */
export const getServiceAreas = cache(async (): Promise<ServiceArea[]> => {
  try {
    const pb = await getPocketBaseClient();
    return await pb.collection('service_areas').getFullList<ServiceArea>({
      filter: 'is_active = true',
      sort: 'sort_order',
    });
  } catch {
    return [];
  }
});

/**
 * The forest built exactly once per request, in both shapes.
 *
 * `list` and `roots` share their node objects, so a template that walks the
 * flat list and one that walks `.children` are looking at the same records —
 * which matters once those nodes carry a `landingPath` (see `./pairs`).
 */
const getAreaHierarchy = cache(async (): Promise<{ list: ServiceAreaNode[]; roots: ServiceAreaNode[] }> => {
  const roots = buildAreaTree(await getServiceAreas());
  return { roots, list: flattenAreaTree(roots) };
});

/**
 * Every active area as a flat, hierarchy-aware list: depth-first order, each
 * item carrying its `depth`, `children` and canonical `path`.
 *
 * This is what public pages hand to templates, exactly as `getServiceList()`
 * does for services — so a template linking to an area never builds the URL
 * itself and never has to know how deep the area sits.
 */
export async function getAreaList(): Promise<ServiceAreaNode[]> {
  return (await getAreaHierarchy()).list;
}

/** The same set nested: top-level areas only, walk `.children` for the rest. */
export async function getAreaRoots(): Promise<ServiceAreaNode[]> {
  return (await getAreaHierarchy()).roots;
}
