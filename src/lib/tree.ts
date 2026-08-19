/**
 * Generic parent/child tree maths, shared by services and service areas.
 *
 * Both collections carry a `parent` self-relation and need identical handling
 * for the awkward cases — cycles, orphans, depth caps, subtree moves. That
 * logic is subtle enough that having two copies would guarantee they drift, so
 * it lives here once and each domain binds it with its own depth cap and URL
 * builder (`service-tree.ts`, `area-tree.ts`).
 *
 * Nothing here imports anything server-only, so dashboard client components can
 * run the exact same rules in the browser that the server actions enforce on
 * save.
 */

/** The minimum shape this module can work with. */
export interface Hierarchical {
  id: string
  name: string
  slug: string
  /** Parent id. Empty/undefined = top level. */
  parent?: string
}

export type TreeNode<T extends Hierarchical> = T & {
  children: TreeNode<T>[]
  /** 1-based tier: a top-level item is 1. */
  depth: number
  /** Canonical public path, precomputed so templates never build URLs. */
  path: string
}

export function indexById<T extends Hierarchical>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

/**
 * Ancestors root-first, excluding the item itself.
 *
 * A `parent` pointing at something not in `byId` — deleted (relations are
 * non-cascading), or inactive on the public site — ends the walk, which
 * promotes the orphan to a root rather than hiding it.
 *
 * A cycle returns `[]`, i.e. the item is treated as top-level. PocketBase
 * cannot express "no cycles", so a record edited outside the dashboard could
 * make A the parent of B and B the parent of A. Returning `[]` rather than a
 * truncated chain is what keeps every derived value consistent: `buildTree`
 * sees no resolvable parent and files the item under the roots, so a corrupt
 * pair still renders at a usable URL instead of vanishing from the site.
 *
 * The visited set also makes the walk self-terminating, so no depth cap is
 * applied here — the cap is a write-time rule, and truncating a genuinely deep
 * chain would silently produce the wrong breadcrumb.
 */
export function getAncestors<T extends Hierarchical>(item: T, byId: Map<string, T>): T[] {
  const chain: T[] = [];
  const visited = new Set<string>([item.id]);
  let current = item;

  while (current.parent) {
    if (visited.has(current.parent)) return [];   // cycle — treat as top-level
    const parent = byId.get(current.parent);
    if (!parent) break;                           // orphan — treat as top-level
    visited.add(parent.id);
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

/** 1-based: a top-level item is depth 1. */
export function getDepth<T extends Hierarchical>(item: T, byId: Map<string, T>): number {
  return getAncestors(item, byId).length + 1;
}

export function getChildren<T extends Hierarchical>(id: string, items: T[]): T[] {
  return items.filter((item) => item.parent === id);
}

/** Every descendant id of `id` (excludes `id` itself). Cycle-safe. */
export function getDescendantIds<T extends Hierarchical>(id: string, items: T[]): Set<string> {
  const out = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    for (const child of items) {
      if (child.parent === current && !out.has(child.id) && child.id !== id) {
        out.add(child.id);
        queue.push(child.id);
      }
    }
  }
  return out;
}

/** Tiers occupied by an item's subtree: a leaf is 1, a parent of leaves is 2. */
export function getSubtreeHeight<T extends Hierarchical>(id: string, items: T[]): number {
  const children = getChildren(id, items);
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((c) => getSubtreeHeight(c.id, items)));
}

/**
 * Nest a flat list. Items whose parent is missing, inactive, or part of a cycle
 * surface as roots, so nothing is ever silently dropped from the tree.
 *
 * `pathFor` builds each node's canonical URL. Both current callers return a
 * flat path that ignores ancestry — the hierarchy shapes navigation and
 * breadcrumbs, not addresses — but it stays a parameter so a domain that wants
 * nested URLs can have them without touching this file.
 */
export function buildTree<T extends Hierarchical>(
  items: T[],
  pathFor: (item: T) => string,
): TreeNode<T>[] {
  const byId = indexById(items);
  const nodes = new Map<string, TreeNode<T>>(
    items.map((item) => [item.id, { ...item, children: [], depth: 1, path: pathFor(item) } as TreeNode<T>]),
  );
  const roots: TreeNode<T>[] = [];

  for (const item of items) {
    const node = nodes.get(item.id)!;
    const parentNode = item.parent ? nodes.get(item.parent) : undefined;
    const ancestors = getAncestors(item, byId);
    if (parentNode && ancestors.length > 0 && ancestors[ancestors.length - 1].id === item.parent) {
      node.depth = ancestors.length + 1;
      parentNode.children.push(node);
    } else {
      node.depth = 1;
      roots.push(node);
    }
  }
  return roots;
}

/** Depth-first: each parent immediately followed by its own descendants. */
export function flattenTree<T extends Hierarchical>(nodes: TreeNode<T>[]): TreeNode<T>[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

/** Find one item's node inside a built tree. */
export function findNode<T extends Hierarchical>(nodes: TreeNode<T>[], id: string): TreeNode<T> | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const hit = findNode(node.children, id);
    if (hit) return hit;
  }
  return null;
}

/**
 * Breadcrumb trail, root-first, ending with the item itself. Each crumb links
 * to that ancestor's own page — this is where the hierarchy is expressed to
 * users and to Google (via BreadcrumbList), since the URLs don't carry it.
 */
export function getTrail<T extends Hierarchical>(
  item: T,
  byId: Map<string, T>,
  pathFor: (item: T) => string,
): { name: string; path: string }[] {
  return [...getAncestors(item, byId), item].map((entry) => ({
    name: entry.name,
    path: pathFor(entry),
  }));
}

/** True when any item in the list has a resolvable parent. */
export function hasHierarchy<T extends Hierarchical>(items: T[]): boolean {
  const byId = indexById(items);
  return items.some((item) => item.parent && byId.has(item.parent));
}

/**
 * Validate a proposed parent assignment. Returns an error message, or null when
 * the move is legal. `id` is null when creating (nothing can point at an item
 * that does not exist yet).
 *
 * The depth test uses the combined height because a moved item carries its
 * whole subtree with it: something that already has children of its own needs
 * two free tiers below the new parent, not one.
 */
export function validateParentAssignment<T extends Hierarchical>(
  parentId: string,
  id: string | null,
  items: T[],
  maxDepth: number,
  labels: { self: string; descendant: string; tooDeep: string },
): string | null {
  if (!parentId) return null;

  const byId = indexById(items);
  const parent = byId.get(parentId);
  if (!parent) return 'That parent no longer exists.';
  if (id && parentId === id) return labels.self;
  if (id && getDescendantIds(id, items).has(parentId)) return labels.descendant;

  const height = id ? getSubtreeHeight(id, items) : 1;
  if (getDepth(parent, byId) + height > maxDepth) return labels.tooDeep;
  return null;
}
