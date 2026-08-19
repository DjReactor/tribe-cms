import type { Service, ServiceNode } from '@/types/index';
import {
  indexById,
  getAncestors as getAncestorsGeneric,
  getDepth,
  getChildren as getChildrenGeneric,
  getDescendantIds as getDescendantIdsGeneric,
  getSubtreeHeight as getSubtreeHeightGeneric,
  buildTree,
  flattenTree,
  findNode,
  getTrail,
  hasHierarchy as hasHierarchyGeneric,
  validateParentAssignment,
} from './tree';

/**
 * Service hierarchy (schema: migration 2010000000). Thin binding over the
 * generic tree maths in `./tree`.
 *
 * Two rules carry the design:
 *
 *  1. **Slugs are globally unique and URLs are FLAT** — every service lives at
 *     `/services/<slug>` whatever its tier. The hierarchy shapes navigation,
 *     breadcrumbs and the index grouping; it is deliberately absent from the
 *     address, which is what ranks in this niche and what keeps a service's URL
 *     stable when it is re-parented.
 *  2. **The depth cap lives here, never in the schema** — raising it must not
 *     require a migration. It is enforced twice from this module: the dashboard
 *     parent picker filters its options, and `validateServiceParent` re-checks
 *     on save.
 */

/** Services nest 3 tiers. Areas allow 4 — see `area-tree.ts`. */
export const MAX_SERVICE_DEPTH = 3;

/** Canonical public path. Flat by design, whatever the tier. */
export function getServicePath(service: Service, _byId?: Map<string, Service>): string {
  return `/services/${service.slug}`;
}

export const indexServices = indexById<Service>;
export const getAncestors = getAncestorsGeneric<Service>;
export const getChildren = getChildrenGeneric<Service>;
export const getDescendantIds = getDescendantIdsGeneric<Service>;
export const getSubtreeHeight = getSubtreeHeightGeneric<Service>;
export const hasHierarchy = hasHierarchyGeneric<Service>;
export const findServiceNode = findNode<Service>;
export const flattenServiceTree = flattenTree<Service>;

export function getServiceDepth(service: Service, byId: Map<string, Service>): number {
  return getDepth(service, byId);
}

export function buildServiceTree(services: Service[]): ServiceNode[] {
  return buildTree(services, getServicePath);
}

export function getServiceTrail(service: Service, byId: Map<string, Service>) {
  return getTrail(service, byId, getServicePath);
}

/** Mirror of the picker's filter — see `validateParentAssignment`. */
export function validateServiceParent(parentId: string, id: string | null, services: Service[]) {
  return validateParentAssignment(parentId, id, services, MAX_SERVICE_DEPTH, {
    self: 'A service cannot be its own parent.',
    descendant: 'That service is already nested underneath this one.',
    tooDeep: `Services can only be ${MAX_SERVICE_DEPTH} levels deep. Move or flatten this service's own sub-services first.`,
  });
}

/**
 * Which layout the services index should use. `auto` nests only when a
 * hierarchy exists, so a flat site never has to touch the setting and a nested
 * one works without being told.
 */
export function resolveDisplayMode(
  setting: string | undefined,
  services: Service[],
): 'flat' | 'tree' {
  if (setting === 'flat' || setting === 'tree') return setting;
  return hasHierarchy(services) ? 'tree' : 'flat';
}
