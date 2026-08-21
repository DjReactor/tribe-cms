/**
 * On-page analysis of a page against its focus keyword.
 *
 * `focus_keyword` was a write-only field for a long time: two forms collected
 * it, two actions wrote it, no migration created the column, and nothing read
 * it. Migration `2070000000` gave it somewhere to live; this module is what
 * makes it mean something.
 *
 * The checks are HARDCODED PREDICATES over the page's own content, exactly like
 * `./pair-readiness` — and for the same reason: a check is a predicate over
 * data, so it belongs in code rather than in a settings row.
 *
 * Everything here is ADVISORY. Nothing blocks a save, because a keyword the
 * copy does not happen to repeat is a judgement call about writing, not an
 * error. What the checks are actually good for is catching the mechanical
 * misses — a page targeting "kitchen remodeling santa rosa" whose H1 says
 * "Our Services" and whose meta description was never written.
 *
 * Deliberately NOT here: a keyword-density target. Density thresholds are
 * pseudo-precision — Google has not ranked on term frequency in that naive form
 * for many years, and writing to hit a percentage produces exactly the stilted
 * copy the landing-page design exists to avoid. The one frequency check below
 * is a *ceiling*, to catch stuffing, not a floor to aim at.
 *
 * Nothing imports anything server-only, so the dashboard forms re-score as you
 * type from the same function a server would use.
 */

export type KeywordCheckId = 'heading' | 'seo_title' | 'seo_description' | 'slug' | 'opening' | 'stuffing';

export interface KeywordCheck {
  id: KeywordCheckId;
  label: string;
  ok: boolean;
  /** One line of "why", shown whether it passes or not. */
  detail: string;
  /** True when failing this is a warning about overdoing it, not a gap. */
  inverse?: boolean;
}

/** The page being analysed, reduced to the fields that carry the keyword. */
export interface KeywordSubject {
  keyword: string;
  /** The visible heading — an area's `custom_h1`, a post's title. */
  heading: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  /** BlockNote blocks, or a plain string. */
  body: unknown;
}

/** Lowercase, punctuation flattened to spaces, runs collapsed. */
function norm(value: string | undefined | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Plain text out of BlockNote JSON.
 *
 * Walks `content` and `children` the same way the renderer does, so what is
 * counted here is what a reader actually sees. Unknown block types still give
 * up their text rather than being skipped.
 */
export function blockText(body: unknown): string {
  if (typeof body === 'string') return body;
  if (!Array.isArray(body)) return '';

  const out: string[] = [];
  const walk = (nodes: unknown) => {
    if (typeof nodes === 'string') { out.push(nodes); return; }
    if (!Array.isArray(nodes)) return;
    for (const raw of nodes) {
      const node = raw as { text?: unknown; content?: unknown; children?: unknown };
      if (!node || typeof node !== 'object') continue;
      if (typeof node.text === 'string') out.push(node.text);
      if (node.content !== undefined) walk(node.content);
      if (node.children !== undefined) walk(node.children);
    }
  };
  walk(body);
  return out.join(' ');
}

/**
 * Does this text mention the keyword?
 *
 * ALL WORDS PRESENT, order-independent — not a contiguous phrase match. English
 * copy puts function words inside the phrase: a page targeting "kitchen
 * remodeling santa rosa" is almost always headed "Kitchen Remodeling in Santa
 * Rosa", and a strict substring test would call that a miss, which is the
 * single most common real heading there is. "Santa Rosa Kitchen Remodeling"
 * should pass too, so order is not required either.
 *
 * Stuffing is measured separately, on the literal phrase — see
 * `countOccurrences`. Presence should be lenient; over-use should not be.
 */
function mentionsKeyword(haystack: string, keyword: string): boolean {
  const words = norm(keyword).split(' ').filter(Boolean);
  if (words.length === 0) return false;
  const text = ` ${norm(haystack)} `;
  return words.every((word) => text.includes(` ${word} `));
}

/** How many times the LITERAL phrase appears — this is what stuffing looks like. */
function countOccurrences(haystack: string, keyword: string): number {
  const k = norm(keyword);
  if (!k) return 0;
  const text = norm(haystack);
  let count = 0;
  let from = 0;
  for (;;) {
    const at = text.indexOf(k, from);
    if (at === -1) return count;
    count += 1;
    from = at + k.length;
  }
}

/**
 * The slug check is word-wise, not phrase-wise: a slug is usually a shortened
 * form of the keyword ("kitchen-remodeling" for "kitchen remodeling santa
 * rosa"), so demanding the whole phrase would fail every sensibly short URL.
 * Every word of the SLUG appearing in the keyword is the honest test.
 */
function slugMatchesKeyword(slug: string, keyword: string): boolean {
  const slugWords = norm(slug).split(' ').filter(Boolean);
  const keywordWords = new Set(norm(keyword).split(' ').filter(Boolean));
  if (slugWords.length === 0 || keywordWords.size === 0) return false;
  return slugWords.every((word) => keywordWords.has(word));
}

/** Roughly the first paragraph — what a reader and a snippet both see first. */
const OPENING_CHARS = 300;

/**
 * A ceiling, not a target. Ten repetitions of the phrase in one page is the
 * point at which copy reads as written for a crawler; below that this stays
 * silent rather than nudging anybody toward a number.
 */
const STUFFING_LIMIT = 10;

export function analyzeFocusKeyword(subject: KeywordSubject): KeywordCheck[] {
  const keyword = (subject.keyword || '').trim();
  const text = blockText(subject.body);
  const opening = text.slice(0, OPENING_CHARS);
  const occurrences = countOccurrences(text, keyword);

  return [
    {
      id: 'heading',
      label: 'Keyword in the page heading',
      ok: mentionsKeyword(subject.heading, keyword),
      detail: mentionsKeyword(subject.heading, keyword)
        ? 'Every word of the keyword appears in the H1.'
        : 'The H1 is the strongest on-page signal of the subject, and the first thing a reader reads.',
    },
    {
      id: 'seo_title',
      label: 'Keyword in the SEO title',
      ok: mentionsKeyword(subject.seoTitle, keyword),
      detail: mentionsKeyword(subject.seoTitle, keyword)
        ? 'Every word appears in the title shown in search results.'
        : 'This is the line people actually click in search results. Empty falls back to the page name.',
    },
    {
      id: 'seo_description',
      label: 'Keyword in the meta description',
      ok: mentionsKeyword(subject.seoDescription, keyword),
      detail: mentionsKeyword(subject.seoDescription, keyword)
        ? 'Every word appears in the snippet.'
        : 'Not a ranking factor, but it is the copy someone reads before deciding whether to click.',
    },
    {
      id: 'slug',
      label: 'URL reflects the keyword',
      ok: slugMatchesKeyword(subject.slug, keyword),
      detail: slugMatchesKeyword(subject.slug, keyword)
        ? 'Every word in the URL appears in the keyword.'
        : 'The URL carries words the keyword does not. A short slug is fine — an unrelated one is not.',
    },
    {
      id: 'opening',
      label: 'Keyword in the opening paragraph',
      ok: mentionsKeyword(opening, keyword),
      detail: mentionsKeyword(opening, keyword)
        ? 'All the terms appear in the first paragraph.'
        : text.trim() === ''
          ? 'Nothing written yet.'
          : 'The opening is where a reader decides they are in the right place.',
    },
    {
      id: 'stuffing',
      label: 'Not over-used',
      inverse: true,
      ok: occurrences <= STUFFING_LIMIT,
      detail: occurrences <= STUFFING_LIMIT
        ? occurrences === 0
          ? 'The exact phrase does not appear in the body — fine if the copy says it another way.'
          : `The exact phrase appears ${occurrences} time${occurrences === 1 ? '' : 's'}.`
        : `The exact phrase appears ${occurrences} times. That reads as written for a crawler. `
          + 'There is no density target to hit — say it once where it matters and write normally.',
    },
  ];
}

export function focusKeywordScore(checks: KeywordCheck[]): { passed: number; total: number } {
  return { passed: checks.filter((c) => c.ok).length, total: checks.length };
}
