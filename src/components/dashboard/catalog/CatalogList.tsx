'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { SortableList } from '@/components/dashboard/SortableList';
import {
  updateCatalogOrder,
  toggleCatalogItemActive,
  deleteCatalogItem,
} from '@/app/dashboard/catalog/actions';
import { CATALOG_KIND_META, type CatalogKind } from '@/lib/catalog-kinds';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Plus, Pencil } from 'lucide-react';

export default function CatalogList({ kind, initialItems }: { kind: CatalogKind; initialItems: any[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const { addToast } = useToast();
  const meta = CATALOG_KIND_META[kind];

  const handleReorder = (newItems: any[]) => {
    setItems(newItems);
    startTransition(async () => {
      const orderData = newItems.map((item, index) => ({ id: item.id, sort_order: index }));
      const res = await updateCatalogOrder(kind, orderData);
      if (!res.success) {
        addToast({ title: 'Error saving order', description: res.error, type: 'error' });
      }
    });
  };

  const handleToggle = async (id: string, current: boolean) => {
    setItems(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    const res = await toggleCatalogItemActive(kind, id, !current);
    if (!res.success) {
      setItems(prev => prev.map(s => s.id === id ? { ...s, is_active: current } : s));
      addToast({ title: 'Error toggling status', description: res.error, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${meta.singular.toLowerCase()}?`)) return;
    const res = await deleteCatalogItem(kind, id);
    if (res.success) {
      setItems(prev => prev.filter(s => s.id !== id));
      addToast({ title: `${meta.singular} deleted`, type: 'success' });
    } else {
      addToast({ title: 'Error deleting', description: res.error, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href={`/dashboard/${kind}/new`}>
          <Button>
            <Plus className="h-4 w-4" />
            Add {meta.singular}
          </Button>
        </Link>
      </div>

      <SortableList
        items={items}
        onReorder={handleReorder}
        renderItem={(item) => (
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="flex items-center gap-4 flex-1 pr-6 min-w-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate">{item.name}</span>
                {item.description && (
                  <span className="text-sm text-muted-foreground truncate">{item.description}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 pointer-events-auto shrink-0">
              <Toggle
                checked={item.is_active}
                onChange={() => handleToggle(item.id, item.is_active)}
                label={item.is_active ? 'Visible' : 'Hidden'}
              />
              <Link href={`/dashboard/${kind}/${item.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
