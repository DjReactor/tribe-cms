/**
 * Assertions for the generic tree maths in `src/lib/tree.ts` — the shared
 * cycle / orphan / depth handling behind both the service hierarchy (3 tiers,
 * `/services/<slug>`) and the service-area hierarchy (4 tiers, `/<slug>`).
 *
 *   node --experimental-strip-types scripts/check-tree.mts
 *
 * There is no test framework in this repo. `tree.ts` is deliberately
 * import-free so this file can load it directly with Node's type stripping and
 * no build step. `service-tree.ts` and `area-tree.ts` are thin bindings over it
 * (a depth cap plus a `pathFor`), so covering the generic core covers the
 * subtle behaviour in both.
 *
 * Run this after ANY change to tree.ts, or to either binding's depth cap.
 * One of these checks caught a real bug: a parent cycle used to drop BOTH
 * members off the site entirely, because the truncated ancestor chain still
 * looked like a valid parent link.
 */
import {
  indexById,
  getAncestors,
  getDepth,
  getChildren,
  getDescendantIds,
  getSubtreeHeight,
  buildTree,
  flattenTree,
  findNode,
  getTrail,
  hasHierarchy,
  validateParentAssignment,
  type Hierarchical,
} from '../src/lib/tree.ts';

type Item = Hierarchical;
const item = (id: string, slug: string, parent = ''): Item => ({ id, slug, name: slug, parent });

const servicePath = (s: Item) => `/services/${s.slug}`;
const areaPath = (a: Item) => `/${a.slug}`;
const LABELS = { self: 'SELF', descendant: 'DESC', tooDeep: 'TOO_DEEP' };

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n        got      ${a}\n        expected ${e}`}`);
};

// ── services: 3 tiers, flat URLs ────────────────────────────────────────────
const remodel = item('1', 'remodeling');
const interior = item('2', 'interior', '1');
const kitchen = item('3', 'kitchen-remodeling', '2');
const bath = item('4', 'bathroom-remodeling', '2');
const roofing = item('5', 'roofing');
const services = [remodel, interior, kitchen, bath, roofing];
const bySvc = indexById(services);

check('depth of 3rd tier', getDepth(kitchen, bySvc), 3);
check('URL is flat at tier 3', servicePath(kitchen), '/services/kitchen-remodeling');
check('ancestors root-first', getAncestors(kitchen, bySvc).map((s) => s.slug), ['remodeling', 'interior']);
check('trail carries full ancestry', getTrail(kitchen, bySvc, servicePath).map((c) => c.name),
  ['remodeling', 'interior', 'kitchen-remodeling']);
check('each crumb links to its own flat page', getTrail(kitchen, bySvc, servicePath).map((c) => c.path),
  ['/services/remodeling', '/services/interior', '/services/kitchen-remodeling']);
check('direct children only', getChildren('2', services).map((s) => s.slug),
  ['kitchen-remodeling', 'bathroom-remodeling']);
check('descendants of root', [...getDescendantIds('1', services)].sort(), ['2', '3', '4']);
check('subtree height of root', getSubtreeHeight('1', services), 3);
check('subtree height of leaf', getSubtreeHeight('3', services), 1);
check('roots only at top level', buildTree(services, servicePath).map((n) => n.slug), ['remodeling', 'roofing']);
check('depth-first flattening', flattenTree(buildTree(services, servicePath)).map((n) => n.slug),
  ['remodeling', 'interior', 'kitchen-remodeling', 'bathroom-remodeling', 'roofing']);
check('node path precomputed', findNode(buildTree(services, servicePath), '3')!.path,
  '/services/kitchen-remodeling');
check('node depth precomputed', findNode(buildTree(services, servicePath), '3')!.depth, 3);
check('hasHierarchy true when nested', hasHierarchy(services), true);
check('hasHierarchy false when flat', hasHierarchy([roofing]), false);

// ── re-parenting moves the breadcrumb, never the URL ────────────────────────
const moved = services.map((s) => (s.id === '3' ? { ...s, parent: '1' } : s));
check('re-parenting does NOT change the URL', servicePath(moved[2]), '/services/kitchen-remodeling');
check('re-parenting DOES change the breadcrumb',
  getTrail(moved[2], indexById(moved), servicePath).map((c) => c.name),
  ['remodeling', 'kitchen-remodeling']);

// ── orphan: parent deleted, or inactive on the public site ──────────────────
const orphaned = [interior, kitchen];   // 'remodeling' absent
check('orphan is promoted to a root', buildTree(orphaned, servicePath).map((n) => n.slug), ['interior']);
check('orphan keeps its flat path', servicePath(kitchen), '/services/kitchen-remodeling');
check('nothing is dropped from the tree', flattenTree(buildTree(orphaned, servicePath)).length, 2);
check('orphan ancestry stops at the gap', getAncestors(kitchen, indexById(orphaned)).map((s) => s.slug),
  ['interior']);

// ── cycle: A parents B, B parents A. THE REGRESSION TEST. ───────────────────
const a = item('a', 'alpha', 'b');
const b = item('b', 'beta', 'a');
const cyc = [a, b];
check('cycle yields no ancestors (treated as top-level)', getAncestors(a, indexById(cyc)), []);
check('cycle does not hang descendants', [...getDescendantIds('a', cyc)].sort(), ['b']);
check('cycle members STAY on the site', flattenTree(buildTree(cyc, servicePath)).length, 2);
check('cycle members become roots', buildTree(cyc, servicePath).map((n) => n.slug).sort(), ['alpha', 'beta']);

// ── areas: 4 tiers, flat root URLs ──────────────────────────────────────────
const ca = item('s1', 'california');
const sonoma = item('s2', 'sonoma-county', 's1');
const rosa = item('s3', 'santa-rosa', 's2');
const bennett = item('s4', 'bennett-valley', 's3');
const areas = [ca, sonoma, rosa, bennett];

check('areas nest 4 deep', getDepth(bennett, indexById(areas)), 4);
check('area tree has one root', buildTree(areas, areaPath).length, 1);
check('every area path is flat', flattenTree(buildTree(areas, areaPath)).map((n) => n.path),
  ['/california', '/sonoma-county', '/santa-rosa', '/bennett-valley']);
check('area ancestry intact', getAncestors(bennett, indexById(areas)).map((s) => s.slug),
  ['california', 'sonoma-county', 'santa-rosa']);

// ── parent assignment rules ─────────────────────────────────────────────────
check('no parent is always valid', validateParentAssignment('', null, areas, 4, LABELS), null);
check('missing parent rejected', validateParentAssignment('nope', null, areas, 4, LABELS),
  'That parent no longer exists.');
check('cannot be its own parent', validateParentAssignment('s2', 's2', areas, 4, LABELS), 'SELF');
check('cannot re-parent under own descendant', validateParentAssignment('s3', 's2', areas, 4, LABELS), 'DESC');
check('5th tier refused at cap 4', validateParentAssignment('s4', null, areas, 4, LABELS), 'TOO_DEEP');
check('4th tier allowed at cap 4', validateParentAssignment('s3', null, areas, 4, LABELS), null);
check('moving a subtree counts its own height',
  validateParentAssignment('s3', 's2', [ca, sonoma, rosa, bennett], 4, LABELS), 'DESC');
check('services cap 3 refuses a 4th tier',
  validateParentAssignment('3', null, services, 3, LABELS), 'TOO_DEEP');

console.log(failures === 0 ? `\nALL PASS (${33} checks)` : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
