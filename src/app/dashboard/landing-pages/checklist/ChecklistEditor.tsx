'use client';
import { useState, useTransition } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { updateManualChecklistItems } from '../actions';
import type { ManualChecklistItem } from '@/types/index';

/**
 * Editor for `settings.manual_checklist_items`.
 *
 * Ids are assigned server-side on save, never here: they are the keys each
 * pair's `manual_checklist` ticks against, so a renamed label has to keep its
 * id and a new row must never inherit one.
 */
export function ChecklistEditor({ initialItems }: { initialItems: ManualChecklistItem[] }) {
  const [items, setItems] = useState<ManualChecklistItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const update = (index: number, patch: Partial<ManualChecklistItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    const item = items[index];
    if (item.label.trim() && !confirm(`Remove "${item.label}"? Every landing page loses its tick for this item.`)) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateManualChecklistItems(items);
      if (res.success && 'items' in res && res.items) {
        setItems(res.items);
        addToast({ title: 'Checklist saved', type: 'success' });
      } else {
        addToast({ title: 'Error saving checklist', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={item.id || `new-${index}`}>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-4">
                  <Input
                    label="Label"
                    placeholder="Shot local photos"
                    value={item.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                  />
                  <Input
                    label="Note (optional)"
                    placeholder="At least three, taken on site — not stock."
                    value={item.description || ''}
                    onChange={(e) => update(index, { description: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-7 h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
            No checklist items. Landing pages will show only the readiness checks.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setItems((prev) => [...prev, { id: '', label: '', description: '' }])}
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
        <Button onClick={handleSave} isLoading={isPending}>Save Checklist</Button>
      </div>
    </div>
  );
}
