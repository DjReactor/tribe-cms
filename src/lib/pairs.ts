import { cache } from 'react';
import { getPocketBaseClient } from './pocketbase';
import { getPairPath, locationNamesArea } from './pair-readiness';
import { getServices } from './services';
import { getServiceAreas } from './service-areas';
import type {
  Pair,
  Project,
  Service,
  Testimonial,
  ServiceArea,
  ServiceAreaNode,
  ServiceNode,
  AreaWithLanding,
  ServiceWithLanding,
} from '@/types/index';

/**
 * Server-side access to `pairs` (landing pages), plus the cascade that keeps
 * them honest when the service or area underneath one goes away.
 *
 * The readiness maths itself is in `./pair-readiness`, which imports nothing
 * server-only so the creation flow can score a combination in the browser.
 *
 * Write path: `pairs` carries `@request.auth.id != ''` write rules in committed
 * migrations, so the cookie client is correct here. That rule is the FLOOR, not
 * the policy — pairs are agency-only, and the dashboard actions gate on
 * `requireAgencyAdmin()`. The cascade below is the deliberate exception: it runs
 * as a side effect of Services and Service Areas, which the BO does own, so a
 * BO deactivating a service must be able to take its landing pages down.
 */

export async function getAllPairs(): Promise<Pair[]> {
  try {
    const pb = await getPocketBaseClient();
    return await pb.collection('pairs').getFullList<Pair>({ sort: 'sort_order,created' });
  } catch {
    return [];
  }
}

async function pairsReferencing(field: 'service' | 'service_area', id: string): Promise<Pair[]> {
  if (!id) return [];
  try {
    const pb = await getPocketBaseClient();
    return await pb.collection('pairs').getFullList<Pair>({ filter: `${field} = "${id}"` });
  } catch {
    return [];
  }
}

export function pairsForService(serviceId: string): Promise<Pair[]> {
  return pairsReferencing('service', serviceId);
}

export function pairsForArea(areaId: string): Promise<Pair[]> {
  return pairsReferencing('service_area', areaId);
}

/**
 * Take down every published landing page that depends on a service or area, and
 * flag it for the agency to review.
 *
 * Called when a service or area is DEACTIVATED. Nothing is deleted and nothing
 * is auto-republished when the parent comes back: `auto_unpublished` is a note
 * to a human, cleared when the agency publishes the pair again.
 *
 * Returns how many pairs were taken down, so the caller can say so.
 */
export async function autoUnpublishPairsFor(
  target: { service?: string; serviceArea?: string },
): Promise<number> {
  const field = target.service ? 'service' : 'service_area';
  const id = target.service || target.serviceArea || '';
  if (!id) return 0;

  const affected = (await pairsReferencing(field, id)).filter((pair) => pair.is_published);
  if (affected.length === 0) return 0;

  try {
    const pb = await getPocketBaseClient();
    for (const pair of affected) {
      await pb.collection('pairs').update(pair.id, {
        is_published: false,
        auto_unpublished: true,
      });
    }
  } catch {
    // Best effort: a failed cascade must not fail the toggle the BO asked for.
    // The pair still points at an inactive service, and the public route
    // resolves against active records, so nothing broken is served either way.
  }
  return affected.length;
}

/**
 * The message shown when a delete is refused because landing pages depend on
 * the record.
 *
 * PocketBase refuses to delete a record referenced by a REQUIRED relation, and
 * `pairs.service` / `pairs.service_area` are both required (verified against
 * the running binary: "Make sure that the record is not part of a required
 * relation reference"). That is the right outcome rather than something to work
 * around — the design says a pair survives to be reviewed by a human, never
 * disappears with its service — so the dashboard refuses first, with a sentence
 * that says what to do, instead of surfacing PocketBase's phrasing.
 */
export function blockedByPairsMessage(count: number, noun: 'service' | 'service area'): string {
  return `${count} landing page${count === 1 ? '' : 's'} still use${count === 1 ? 's' : ''} this ${noun}. `
    + `Deactivate it instead — that takes the landing pages down and flags them — or have your agency delete them under Landing Pages first.`;
}

// ── Public site ────────────────────────────────────────────────────────────
//
// Everything below serves the public routes. Two rules run through all of it:
//
//  1. A pair is live only when the pair itself is published AND both records
//     underneath it are active. The deactivation cascade
//     (`autoUnpublishPairsFor`) is best-effort by design — it swallows its
//     errors rather than failing the toggle the BO asked for — and reactivating
//     a service never auto-republishes its pages. So the public side re-derives
//     liveness from the active sets instead of trusting `is_published` alone.
//  2. `getPairPath` is the only place a pair URL is built, here as everywhere.

/** Cache key for one service×area combination. */
const pairKey = (serviceId: string, areaId: string) => `${serviceId}:${areaId}`;

/** A published pair whose service and area are both still active, with its URL. */
export interface LivePair {
  pair: Pair;
  area: ServiceArea;
  service: Service;
  /** `/{area.slug}/{pair.slug}` — built by `getPairPath`, as everywhere. */
  path: string;
}

/** Every published pair. Liveness still depends on the two records underneath. */
export const getPublishedPairs = cache(async (): Promise<Pair[]> => {
  try {
    const pb = await getPocketBaseClient();
    return await pb.collection('pairs').getFullList<Pair>({
      filter: 'is_published = true',
      sort: 'sort_order,created',
    });
  } catch {
    return [];
  }
});

/**
 * Every landing page the public site will actually serve, resolved once per
 * request. One query backs every mutual link, the route itself and the sitemap.
 *
 * Published is necessary but not sufficient: the deactivation cascade
 * (`autoUnpublishPairsFor`) is best-effort by design — it swallows its errors
 * rather than failing the toggle the BO asked for — and reactivating a service
 * never auto-republishes its pages. So liveness is re-derived here from the
 * active sets rather than trusted from `is_published` alone.
 */
export const getLivePairs = cache(async (): Promise<LivePair[]> => {
  const [pairs, services, areas] = await Promise.all([
    getPublishedPairs(),
    getServices(),
    getServiceAreas(),
  ]);

  const serviceById = new Map(services.map((s) => [s.id, s]));
  const areaById = new Map(areas.map((a) => [a.id, a]));

  const live: LivePair[] = [];
  for (const pair of pairs) {
    const area = areaById.get(pair.service_area);
    const service = serviceById.get(pair.service);
    if (!area || !service) continue;
    live.push({ pair, area, service, path: getPairPath(area.slug, pair.slug) });
  }
  return live;
});

/**
 * `service:area` → landing-page URL, for every live pair.
 *
 * This is what makes a service page listing thirty areas cost one query rather
 * than thirty existence checks.
 */
export const getPairIndex = cache(async (): Promise<Map<string, string>> => {
  const live = await getLivePairs();
  return new Map(live.map((entry) => [pairKey(entry.pair.service, entry.pair.service_area), entry.path]));
});

/**
 * Resolve one live pair from the URL it was requested at.
 *
 * The route matches on `(area.slug, pair.slug)` — the same key
 * `idx_pairs_area_slug_unique` enforces — and an unpaired combination simply
 * has no record, which is what makes it 404. Returns null for anything not
 * live: no area, no pair, unpublished, or a service since hidden.
 */
export async function resolveLivePair(areaSlug: string, pairSlug: string): Promise<LivePair | null> {
  const live = await getLivePairs();
  return live.find((entry) => entry.area.slug === areaSlug && entry.pair.slug === pairSlug) ?? null;
}

/** Depth-first flatten that keeps whatever the caller attached to each node. */
export function flattenLanding<T extends { children: T[] }>(nodes: T[]): T[] {
  return nodes.flatMap((node) => [node, ...flattenLanding(node.children)]);
}

/**
 * Attach `landingPath` to a tree of areas, for one service.
 *
 * Recursive so `.children` carries the same contract — a template rendering the
 * area tree gets a path (or a null) at every tier, not just the roots.
 */
export function areasWithLanding(
  nodes: ServiceAreaNode[],
  serviceId: string,
  index: Map<string, string>,
): AreaWithLanding[] {
  return nodes.map((node) => ({
    ...node,
    children: areasWithLanding(node.children, serviceId, index),
    landingPath: index.get(pairKey(serviceId, node.id)) ?? null,
  }));
}

/** The service side of the same enrichment — see `areasWithLanding`. */
export function servicesWithLanding(
  nodes: ServiceNode[],
  areaId: string,
  index: Map<string, string>,
): ServiceWithLanding[] {
  return nodes.map((node) => ({
    ...node,
    children: servicesWithLanding(node.children, areaId, index),
    landingPath: index.get(pairKey(node.id, areaId)) ?? null,
  }));
}

/**
 * The proof a local page pulls in automatically: work done here, and reviews
 * from here.
 *
 * Fires on AREA pages as well as pair pages, and that is the important half. A
 * single-service business normally publishes no pairs at all — `/santa-rosa`
 * *is* their "Kitchen Remodeling in Santa Rosa" page — so auto-pull that only
 * ran on pairs would starve exactly the sites that lean hardest on their area
 * pages. `serviceId` narrows the projects on a pair page and is omitted on an
 * area page, which is the only difference between the two.
 *
 * Reviews match on `locationNamesArea`, the same free-text test the readiness
 * checklist counts with, so the agency is never told a page has proof it does
 * not show.
 *
 * Projects arrive from `getProjects()`, which returns `[]` when the projects
 * feature is switched off — so the master switch gates auto-pull for free.
 */
export function localProof(
  source: { projects: Project[]; testimonials: Testimonial[] },
  area: { id: string; name: string },
  serviceId?: string,
): { projects: Project[]; testimonials: Testimonial[] } {
  return {
    projects: source.projects.filter((project) => {
      if (project.serviceArea?.id !== area.id) return false;
      if (!serviceId) return true;
      return project.services.some((service) => service.id === serviceId);
    }),
    testimonials: source.testimonials.filter((testimonial) =>
      locationNamesArea(testimonial.author_location, area.name),
    ),
  };
}
