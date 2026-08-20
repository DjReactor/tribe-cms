import { getPocketBaseClient } from './pocketbase';
import type { Pair } from '@/types/index';

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
