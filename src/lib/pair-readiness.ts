/**
 * Readiness for a landing page (a service×area `pair`).
 *
 * Readiness is ADVISORY, with exactly one exception: an empty `body` blocks
 * publishing. Everything else is a nudge, because the failure mode this whole
 * feature guards against is publishing pages nobody wrote — not publishing a
 * page whose area happens to have no testimonial yet.
 *
 * Every check here is a HARDCODED PREDICATE OVER DATA, and that is deliberate.
 * Expressing arbitrary predicates as settings rows means building a rule
 * engine, so the free-text half of the checklist ("shot local photos") lives in
 * `settings.manual_checklist_items` as plain labels with no logic at all, and
 * the predicated half lives here in code.
 *
 * Nothing in this module imports anything server-only: the creation flow scores
 * a combination in the browser before any record exists, and the dashboard
 * scores saved records on the server, from the same function.
 */

/** Checks split into two groups; the creation flow only shows `support`. */
export type ReadinessGroup = 'support' | 'copy';

export type ReadinessCheckId =
  | 'project'
  | 'testimonial'
  | 'also_serving'
  | 'body'
  | 'h1'
  | 'intro';

export interface ReadinessCheck {
  id: ReadinessCheckId;
  group: ReadinessGroup;
  label: string;
  ok: boolean;
  /** One line of "why", shown under the label whether it passes or not. */
  detail: string;
  /** True only for the check that actually prevents publishing. */
  blocking: boolean;
}

/** The measured facts a set of checks is derived from. */
export interface ReadinessFacts {
  /** Active projects tagged with both this service and this area. */
  projectCount: number;
  /** Visible testimonials whose free-text location names this area. */
  testimonialCount: number;
  /** Entries in the area's `also_serving` list. */
  alsoServingCount: number;
  hasBody: boolean;
  h1: string;
  intro: string;
  /** Another pair already uses this H1 / intro verbatim. */
  h1Duplicated: boolean;
  introDuplicated: boolean;
}

/**
 * The already-reduced data readiness is computed from. The caller does the
 * fetching and hands over only the fields that matter, which keeps this module
 * free of PocketBase record shapes.
 */
export interface ReadinessSource {
  /** Every pair, for duplicate-copy detection. */
  pairs: { id: string; h1?: string; intro?: string }[];
  /** Active projects, reduced to the two ids readiness cares about. */
  projects: { serviceIds: string[]; areaId: string }[];
  /** Visible testimonials, reduced to their free-text location. */
  testimonials: { location: string }[];
  areas: { id: string; name: string; also_serving?: string[] | null }[];
}

/** The pair being scored. Absent during creation, before a record exists. */
export interface ReadinessSubject {
  id?: string;
  h1?: string;
  intro?: string;
  body?: unknown;
}

const norm = (value: string | undefined | null) => (value || '').trim().toLowerCase();

/**
 * Block types whose emptiness has to be judged by their text.
 *
 * BlockNote never serialises an "empty" document as `[]` — an untouched editor
 * still emits one empty paragraph — so a plain length check would let a blank
 * page through the publish gate. Text blocks need actual text; anything else
 * (an image, a table, an embed) counts by existing.
 */
const TEXT_BLOCK_TYPES = [
  'paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem', 'quote',
];

export function hasBlockContent(body: unknown): boolean {
  if (!Array.isArray(body) || body.length === 0) return false;

  return body.some((raw) => {
    const block = raw as { type?: string; content?: unknown; children?: unknown };
    if (!block || typeof block !== 'object') return false;
    if (block.type && !TEXT_BLOCK_TYPES.includes(block.type)) return true;

    if (typeof block.content === 'string') return block.content.trim().length > 0;
    if (Array.isArray(block.content)) {
      const filled = block.content.some((span) => {
        const text = (span as { text?: unknown })?.text;
        return typeof text === 'string' ? text.trim().length > 0 : true;
      });
      if (filled) return true;
    }
    return hasBlockContent(block.children);
  });
}

/**
 * Does this area's name appear in a testimonial's free-text location?
 *
 * Exported because the public pages auto-pull reviews with this exact test: if
 * the checklist counted matches one way and the page rendered them another, the
 * agency would be told a page has proof it does not show (or the reverse).
 */
export function locationNamesArea(location: string, areaName: string): boolean {
  const name = norm(areaName);
  if (!name) return false;
  return norm(location).includes(name);
}

/**
 * Reduce the source data to the facts for one service×area combination.
 *
 * Testimonials match on text because `testimonials` carries a free-text
 * `author_location` and no area relation. A fuzzy match that occasionally
 * over-counts is the right failure for an advisory check — a missed match would
 * nag the agency about content it already has.
 */
export function buildReadinessFacts(
  source: ReadinessSource,
  serviceId: string,
  areaId: string,
  subject?: ReadinessSubject | null,
): ReadinessFacts {
  const area = source.areas.find((a) => a.id === areaId);
  const h1 = (subject?.h1 || '').trim();
  const intro = (subject?.intro || '').trim();
  const others = source.pairs.filter((p) => p.id !== subject?.id);

  return {
    projectCount: source.projects.filter(
      (p) => p.areaId === areaId && p.serviceIds.includes(serviceId),
    ).length,
    testimonialCount: area
      ? source.testimonials.filter((t) => locationNamesArea(t.location, area.name)).length
      : 0,
    alsoServingCount: area?.also_serving?.filter((entry) => entry.trim()).length || 0,
    hasBody: hasBlockContent(subject?.body),
    h1,
    intro,
    h1Duplicated: h1 !== '' && others.some((p) => norm(p.h1) === norm(h1)),
    introDuplicated: intro !== '' && others.some((p) => norm(p.intro) === norm(intro)),
  };
}

export function evaluateReadiness(facts: ReadinessFacts): ReadinessCheck[] {
  return [
    {
      id: 'project',
      group: 'support',
      label: 'A project for this service in this area',
      ok: facts.projectCount > 0,
      blocking: false,
      detail: facts.projectCount > 0
        ? `${facts.projectCount} matching project${facts.projectCount === 1 ? '' : 's'}.`
        : 'No active project is tagged with both this service and this area. Proof the work was done here is the hardest part of this page to fake.',
    },
    {
      id: 'testimonial',
      group: 'support',
      label: 'A review from this area',
      ok: facts.testimonialCount > 0,
      blocking: false,
      detail: facts.testimonialCount > 0
        ? `${facts.testimonialCount} review${facts.testimonialCount === 1 ? '' : 's'} name this area.`
        : 'No visible review names this area in its location field.',
    },
    {
      id: 'also_serving',
      group: 'support',
      label: 'The area lists nearby places it also serves',
      ok: facts.alsoServingCount > 0,
      blocking: false,
      detail: facts.alsoServingCount > 0
        ? `${facts.alsoServingCount} place${facts.alsoServingCount === 1 ? '' : 's'} named on the area.`
        : 'Add a few on the area record. They are named on the page and deliberately never linked.',
    },
    {
      id: 'body',
      group: 'copy',
      label: 'Page body written',
      ok: facts.hasBody,
      blocking: true,
      detail: facts.hasBody
        ? 'Written.'
        : 'Required to publish. A landing page with no body of its own is exactly the page family Google acts on.',
    },
    {
      id: 'h1',
      group: 'copy',
      label: 'Unique H1',
      ok: facts.h1 !== '' && !facts.h1Duplicated,
      blocking: false,
      detail: facts.h1 === ''
        ? 'Empty — the page falls back to a generated heading shared with every other pair.'
        : facts.h1Duplicated
          ? 'Another landing page already uses this exact H1.'
          : 'Unique across landing pages.',
    },
    {
      id: 'intro',
      group: 'copy',
      label: 'Unique intro',
      ok: facts.intro !== '' && !facts.introDuplicated,
      blocking: false,
      detail: facts.intro === ''
        ? 'Empty — the opening paragraph is what a reader compares against the last city page they saw.'
        : facts.introDuplicated
          ? 'Another landing page already uses this exact intro.'
          : 'Unique across landing pages.',
    },
  ];
}

export function readinessScore(checks: ReadinessCheck[]): { passed: number; total: number } {
  return { passed: checks.filter((c) => c.ok).length, total: checks.length };
}

/** The one hard gate: no body, no publish. */
export function canPublish(body: unknown): boolean {
  return hasBlockContent(body);
}

/** `/{area.slug}/{pair.slug}` — the only place a pair URL is built. */
export function getPairPath(areaSlug: string, pairSlug: string): string {
  return `/${areaSlug}/${pairSlug}`;
}

/**
 * Where the dashboard starts warning about page count.
 *
 * Sterling Sky documented a manual thin-content action on a site with 3,000+
 * location pages whose copy was human-written and unique — volume alone did it
 * — while ~35 pages at 85% similarity ranked fine. Nobody on page one for these
 * terms builds the cartesian product. Thirty sits inside what has been observed
 * to work and well short of what has been penalised, so it is where the
 * dashboard starts asking whether the next one is worth writing.
 */
export const PAIR_COUNT_WARNING_THRESHOLD = 30;
