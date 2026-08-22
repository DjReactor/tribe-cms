import { getPublicPocketBase } from './pocketbase-public';
import type { Service, ServiceNode } from '@/types/index';
import { cache } from 'react';

/**
 * Server-side access to the service forest. The tree maths itself lives in
 * `./service-tree` with no server imports, so the dashboard's parent picker can
 * run the exact same depth and cycle rules in the browser.
 */
export * from './service-tree';
import { buildServiceTree, flattenServiceTree } from './service-tree';

/** Active services only, in sibling order. Cached per request. */
export const getServices = cache(async (): Promise<Service[]> => {
  try {
    const pb = await getPublicPocketBase();
    return await pb.collection('services').getFullList<Service>({
      filter: 'is_active = true',
      sort: 'sort_order',
    });
  } catch {
    return [];
  }
});

/**
 * The forest built exactly once per request, in both shapes. `list` and `roots`
 * share their node objects, so the flat view and the nested view can never
 * disagree.
 */
const getServiceHierarchy = cache(async (): Promise<{ list: ServiceNode[]; roots: ServiceNode[] }> => {
  const roots = buildServiceTree(await getServices());
  return { roots, list: flattenServiceTree(roots) };
});

/**
 * Every active service as a flat, hierarchy-aware list: depth-first order, each
 * item carrying its `depth`, `children` and canonical `path`.
 *
 * This is what public pages hand to templates. Because each item knows its own
 * path, a template linking to a service never has to know whether that service
 * is nested, and never emits a link that just 301s somewhere else.
 */
export async function getServiceList(): Promise<ServiceNode[]> {
  return (await getServiceHierarchy()).list;
}

/**
 * The same set nested: top-level services only, walk `.children` for the rest.
 *
 * This is what the landing-page enrichers want — they take ROOTS and flatten
 * internally, so handing them `getServiceList()` would walk every subtree twice.
 */
export async function getServiceRoots(): Promise<ServiceNode[]> {
  return (await getServiceHierarchy()).roots;
}
