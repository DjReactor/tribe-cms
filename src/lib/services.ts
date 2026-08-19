import { getPocketBaseClient } from './pocketbase';
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
    const pb = await getPocketBaseClient();
    return await pb.collection('services').getFullList<Service>({
      filter: 'is_active = true',
      sort: 'sort_order',
    });
  } catch {
    return [];
  }
});

/**
 * Every active service as a flat, hierarchy-aware list: depth-first order, each
 * item carrying its `depth`, `children` and canonical `path`.
 *
 * This is what public pages hand to templates. Because each item knows its own
 * path, a template linking to a service never has to know whether that service
 * is nested, and never emits a link that just 301s somewhere else.
 */
export const getServiceList = cache(async (): Promise<ServiceNode[]> => {
  const services = await getServices();
  return flattenServiceTree(buildServiceTree(services));
});
