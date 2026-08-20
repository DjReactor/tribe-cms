'use client';
import { useState, useTransition } from 'react';
import { SortableList } from '@/components/dashboard/SortableList';
import { updateServiceAreasOrder, toggleServiceAreaActive, deleteServiceArea } from './actions';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Edit2, Plus, CornerDownRight } from 'lucide-react';
import Link from 'next/link';
import type { ServiceArea, ServiceAreaNode, StateItem } from '@/types/index';
import { buildAreaTree, getAreaPath } from '@/lib/area-tree';

/**
 * Service areas are a forest (see lib/area-tree.ts), the same shape as Services
 * with one extra tier. Each sibling group is its own SortableList, so dragging
 * only reorders within a level — moving an area to a different level is a
 * parent change, made in the edit form.
 *
 * `sort_order` stays a single global sequence: after any reorder the whole tree
 * is renumbered depth-first, so every consumer that just sorts flat by
 * `sort_order` gets parents immediately followed by their children.
 */
export default function ServiceAreasList(
  { initialAreas, states = [] }: { initialAreas: ServiceArea[]; states?: StateItem[] },
) {
  const [areas, setAreas] = useState<ServiceArea[]>(initialAreas);
  const [, startTransition] = useTransition();
  const { addToast } = useToast();

  const tree = buildAreaTree(areas);
  const stateById = new Map(states.map((s) => [s.id, s]));

  /** Depth-first walk → the canonical global ordering. */
  const flatten = (nodes: ServiceAreaNode[]): ServiceAreaNode[] =>
    nodes.flatMap((node) => [node, ...flatten(node.children)]);

  /**
   * Re-seat one sibling group inside the tree, leaving every other group's
   * relative order untouched.
   */
  const applyOrder = (
    nodes: ServiceAreaNode[], parentId: string, ordered: ServiceArea[],
  ): ServiceAreaNode[] => {
    const reseat = (group: ServiceAreaNode[]) =>
      ordered
        .map((o) => group.find((n) => n.id === o.id))
        .filter((n): n is ServiceAreaNode => Boolean(n));

    if (parentId === '') return reseat(nodes);
    return nodes.map((node) =>
      node.id === parentId
        ? { ...node, children: reseat(node.children) }
        : { ...node, children: applyOrder(node.children, parentId, ordered) },
    );
  };

  const handleReorder = (parentId: string, siblings: ServiceArea[]) => {
    const ordered = flatten(applyOrder(tree, parentId, siblings));
    const payload = ordered.map((node, index) => ({ id: node.id, sort_order: index }));

    setAreas(
      ordered.map(({ children, depth, path, ...rest }, index) =>
        ({ ...rest, sort_order: index }) as ServiceArea),
    );

    startTransition(async () => {
      const res = await updateServiceAreasOrder(payload);
      if (!res.success) {
        addToast({ title: 'Error saving order', description: res.error, type: 'error' });
      }
    });
  };

  const handleToggle = async (id: string, current: boolean) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !current } : a)));
    const res = await toggleServiceAreaActive(id, !current);
    if (!res.success) {
      setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: current } : a)));
      addToast({ title: 'Error toggling status', description: res.error, type: 'error' });
      return;
    }
    if (res.unpublished) {
      addToast({
        title: `${res.unpublished} landing page${res.unpublished === 1 ? '' : 's'} unpublished`,
        description: 'They are flagged under Landing Pages for review.',
        type: 'info',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const node = areas.find((a) => a.id === id);
    const childCount = areas.filter((a) => a.parent === id).length;
    const warning = childCount > 0
      ? `"${node?.name}" has ${childCount} sub-area${childCount === 1 ? '' : 's'}. `
        + 'They will not be deleted — they move up to the top level. Continue?'
      : 'Are you sure you want to delete this area?';
    if (!confirm(warning)) return;

    const res = await deleteServiceArea(id);
    if (res.success) {
      // Mirror the non-cascading relation: orphans become roots.
      setAreas((prev) =>
        prev.filter((a) => a.id !== id).map((a) => (a.parent === id ? { ...a, parent: '' } : a)));
      addToast({ title: 'Service Area deleted', type: 'success' });
    } else {
      addToast({ title: 'Cannot delete this area', description: res.error, type: 'error' });
    }
  };

  const renderRow = (item: any) => {
    const node = item as ServiceAreaNode;
    const state = node.state ? stateById.get(node.state) : undefined;
    return (
      <div className="flex items-center justify-between w-full pointer-events-none">
        <div className="flex items-center gap-2 min-w-0">
          {node.depth > 1 && <CornerDownRight className="h-4 w-4 text-slate-300 shrink-0" />}
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-slate-900 truncate">
              {node.name}{state ? `, ${state.code}` : ''}
            </span>
            <span className="text-xs text-slate-500 truncate">{getAreaPath(node)}</span>
          </div>
          {node.children.length > 0 && (
            <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {node.children.length} sub
            </span>
          )}
        </div>
        <div className="flex items-center gap-6 pointer-events-auto shrink-0">
          <Toggle
            checked={node.is_active}
            onChange={() => handleToggle(node.id, node.is_active)}
            label={node.is_active ? 'Active' : 'Hidden'}
          />
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/service-areas/${node.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => handleDelete(node.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderLevel = (nodes: ServiceAreaNode[], parentId: string) => (
    <SortableList
      items={nodes}
      onReorder={(newItems) => handleReorder(parentId, newItems as ServiceArea[])}
      renderItem={renderRow}
      emptyLabel="No service areas yet. Add one to get started."
      renderBelow={(item) => {
        const node = item as ServiceAreaNode;
        if (node.children.length === 0) return null;
        return (
          <div className="ml-8 mt-2 space-y-2 border-l-2 border-slate-100 pl-4">
            {renderLevel(node.children, node.id)}
          </div>
        );
      }}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/dashboard/service-areas/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Area
          </Button>
        </Link>
      </div>

      {renderLevel(tree, '')}
    </div>
  );
}
