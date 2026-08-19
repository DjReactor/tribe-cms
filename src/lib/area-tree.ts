import type { ServiceArea, ServiceAreaNode } from '@/types/index';
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
 * Service-area hierarchy — State › County › City › Neighborhood.
 *
 * Same two rules as services, with one extra tier because geography has one
 * more natural level than a service catalogue does.
 *
 * Flat URLs matter more here than they do for services: combo landing pages are
 * `/{area}/{service}`. If area paths nested, a combo would become
 * `/new-york/new-york-city/manhattan/kitchen-remodeling` — variable depth, and
 * the router could not tell where the area path ends and the service begins
 * without a catch-all and real ambiguity. Flat area paths keep every combo at
 * exactly two segments no matter how deep the geography goes.
 *
 * `ServiceArea.neighborhoods` (the string array) is the tier *below* this tree:
 * names mentioned as content to prove local coverage, never given their own
 * URLs. Page-worthy => its own area record; name-worthy => a string.
 */

/** State › County › City › Neighborhood. */
export const MAX_AREA_DEPTH = 4;

/**
 * Areas live at the site root — `/santa-rosa`, not `/service-areas/santa-rosa`.
 * That is the most valuable real estate on the site and the reason the root
 * needs a reserved-slug guard (see `RESERVED_ROOT_SLUGS`).
 */
export function getAreaPath(area: ServiceArea, _byId?: Map<string, ServiceArea>): string {
  return `/${area.slug}`;
}

export const indexAreas = indexById<ServiceArea>;
export const getAreaAncestors = getAncestorsGeneric<ServiceArea>;
export const getAreaChildren = getChildrenGeneric<ServiceArea>;
export const getAreaDescendantIds = getDescendantIdsGeneric<ServiceArea>;
export const getAreaSubtreeHeight = getSubtreeHeightGeneric<ServiceArea>;
export const areasHaveHierarchy = hasHierarchyGeneric<ServiceArea>;
export const findAreaNode = findNode<ServiceArea>;
export const flattenAreaTree = flattenTree<ServiceArea>;

export function getAreaDepth(area: ServiceArea, byId: Map<string, ServiceArea>): number {
  return getDepth(area, byId);
}

export function buildAreaTree(areas: ServiceArea[]): ServiceAreaNode[] {
  return buildTree(areas, getAreaPath);
}

export function getAreaTrail(area: ServiceArea, byId: Map<string, ServiceArea>) {
  return getTrail(area, byId, getAreaPath);
}

export function validateAreaParent(parentId: string, id: string | null, areas: ServiceArea[]) {
  return validateParentAssignment(parentId, id, areas, MAX_AREA_DEPTH, {
    self: 'A service area cannot be its own parent.',
    descendant: 'That area is already nested underneath this one.',
    tooDeep: `Service areas can only be ${MAX_AREA_DEPTH} levels deep. Move or flatten this area's own sub-areas first.`,
  });
}

/**
 * Root-level paths an area slug must never take, because Next resolves static
 * segments before dynamic ones — an area slugged `blog` would not 404, it would
 * silently become unreachable behind the real `/blog`. Validated on save.
 *
 * Keep in step with the static routes under `src/app/(public)/`.
 */
export const RESERVED_ROOT_SLUGS = [
  'about', 'awards', 'blog', 'brands', 'certifications', 'contact', 'dashboard',
  'locations', 'login', 'privacy-policy', 'projects', 'robots.txt', 'service-areas',
  'services', 'sitemap.xml', 'sitemap-images.xml', 'terms-of-service', 'testimonials', 'api',
] as const;

export function isReservedRootSlug(slug: string): boolean {
  return (RESERVED_ROOT_SLUGS as readonly string[]).includes(slug.toLowerCase());
}
