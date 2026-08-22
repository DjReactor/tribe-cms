'use client';
import { useState, useTransition } from 'react';
import { SortableList } from '@/components/dashboard/SortableList';
import { updateServicesOrder, toggleServiceActive, deleteService } from './actions';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Edit2, Plus, CornerDownRight } from 'lucide-react';
import Link from 'next/link';
import type { Service, ServiceNode } from '@/types/index';
import { buildServiceTree, indexServices, getServicePath } from '@/lib/service-tree';

/**
 * Services are a forest (see lib/service-tree.ts). Each sibling group is its own
 * SortableList, so dragging can only reorder within a level — moving a service
 * to a different level is a parent change, made in the edit form.
 *
 * `sort_order` stays a single global sequence: after any reorder the whole tree
 * is re-numbered depth-first, so every consumer that just sorts flat by
 * `sort_order` (layout nav, footer, templates in flat mode) gets parents
 * immediately followed by their children, with no tree awareness of its own.
 */
export default function ServicesList({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [, startTransition] = useTransition();
  const { addToast } = useToast();

  const tree = buildServiceTree(services);
  const byId = indexServices(services);

  /** Depth-first walk → the canonical global ordering. */
  const flatten = (nodes: ServiceNode[]): ServiceNode[] =>
    nodes.flatMap((node) => [node, ...flatten(node.children)]);

  /**
   * Re-seat one sibling group inside the tree, leaving every other group's
   * relative order untouched.
   */
  const applyOrder = (nodes: ServiceNode[], parentId: string, ordered: Service[]): ServiceNode[] => {
    const reseat = (group: ServiceNode[]) =>
      ordered
        .map((o) => group.find((n) => n.id === o.id))
        .filter((n): n is ServiceNode => Boolean(n));

    if (parentId === '') return reseat(nodes);
    return nodes.map((node) =>
      node.id === parentId
        ? { ...node, children: reseat(node.children) }
        : { ...node, children: applyOrder(node.children, parentId, ordered) },
    );
  };

  const handleReorder = (parentId: string, siblings: Service[]) => {
    const ordered = flatten(applyOrder(tree, parentId, siblings));
    const payload = ordered.map((node, index) => ({ id: node.id, sort_order: index }));

    setServices(
      ordered.map(({ children, depth, ...rest }, index) =>
        ({ ...rest, sort_order: index }) as Service),
    );

    startTransition(async () => {
      const res = await updateServicesOrder(payload);
      if (!res.success) {
        addToast({ title: 'Error saving order', description: res.error, type: 'error' });
      }
    });
  };

  const handleToggle = async (id: string, current: boolean) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
    const res = await toggleServiceActive(id, !current);
    if (!res.success) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: current } : s)));
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
    const node = services.find((s) => s.id === id);
    const childCount = services.filter((s) => s.parent === id).length;
    const warning = childCount > 0
      ? `"${node?.name}" has ${childCount} sub-service${childCount === 1 ? '' : 's'}. `
        + 'They will not be deleted — they move up to the top level. Continue?'
      : 'Are you sure you want to delete this service?';
    if (!confirm(warning)) return;

    const res = await deleteService(id);
    if (res.success) {
      // Mirror the non-cascading relation: orphans become roots.
      setServices((prev) =>
        prev.filter((s) => s.id !== id).map((s) => (s.parent === id ? { ...s, parent: '' } : s)));
      addToast({ title: 'Service deleted', type: 'success' });
    } else {
      addToast({ title: 'Cannot delete this service', description: res.error, type: 'error' });
    }
  };

  const renderRow = (item: any) => {
    const node = item as ServiceNode;
    return (
      <div className="flex items-center justify-between w-full pointer-events-none">
        <div className="flex items-center gap-2 min-w-0">
          {node.depth > 1 && <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground truncate">{node.name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {getServicePath(node, byId)}
            </span>
          </div>
          {node.children.length > 0 && (
            <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
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
            <Link href={`/dashboard/services/${node.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(node.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderLevel = (nodes: ServiceNode[], parentId: string) => (
    <SortableList
      items={nodes}
      onReorder={(newItems) => handleReorder(parentId, newItems as Service[])}
      renderItem={renderRow}
      emptyLabel="No services yet. Add one to get started."
      renderBelow={(item) => {
        const node = item as ServiceNode;
        if (node.children.length === 0) return null;
        return (
          <div className="ml-8 mt-2 space-y-2 border-l-2 border-border pl-4">
            {renderLevel(node.children, node.id)}
          </div>
        );
      }}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/dashboard/services/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </Link>
      </div>

      {renderLevel(tree, '')}
    </div>
  );
}
