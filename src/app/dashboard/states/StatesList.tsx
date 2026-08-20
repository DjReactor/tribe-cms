'use client';
import { useState, useTransition } from 'react';
import { SortableList } from '@/components/dashboard/SortableList';
import { createState, updateState, updateStatesOrder, toggleStateActive, deleteState } from './actions';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Edit2, Plus } from 'lucide-react';
import type { StateItem } from '@/types/index';

/** Small enough that add and edit are one modal rather than their own route. */
export default function StatesList({ initialStates }: { initialStates: StateItem[] }) {
  const [states, setStates] = useState<StateItem[]>(initialStates);
  const [editing, setEditing] = useState<StateItem | 'new' | null>(null);
  const [draft, setDraft] = useState({ name: '', code: '' });
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const openNew = () => {
    setDraft({ name: '', code: '' });
    setEditing('new');
  };

  const openEdit = (state: StateItem) => {
    setDraft({ name: state.name, code: state.code });
    setEditing(state);
  };

  const handleSave = () => {
    const isNew = editing === 'new';
    const payload = { name: draft.name.trim(), code: draft.code.trim(), is_active: isNew ? true : (editing as StateItem).is_active };

    startTransition(async () => {
      const res = isNew
        ? await createState(payload)
        : await updateState((editing as StateItem).id, payload);

      if (!res.success) {
        addToast({ title: 'Error saving state', description: res.error, type: 'error' });
        return;
      }

      if (isNew && 'id' in res && res.id) {
        setStates((prev) => [...prev, {
          id: res.id as string,
          name: payload.name,
          code: payload.code.toUpperCase(),
          is_active: true,
          sort_order: 999,
        }]);
      } else if (!isNew) {
        const id = (editing as StateItem).id;
        setStates((prev) => prev.map((s) => (s.id === id
          ? { ...s, name: payload.name, code: payload.code.toUpperCase() }
          : s)));
      }
      setEditing(null);
      addToast({ title: isNew ? 'State added' : 'State updated', type: 'success' });
    });
  };

  const handleReorder = (newItems: StateItem[]) => {
    setStates(newItems);
    startTransition(async () => {
      const res = await updateStatesOrder(newItems.map((item, index) => ({ id: item.id, sort_order: index })));
      if (!res.success) {
        addToast({ title: 'Error saving order', description: res.error, type: 'error' });
      }
    });
  };

  const handleToggle = async (id: string, current: boolean) => {
    setStates((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
    const res = await toggleStateActive(id, !current);
    if (!res.success) {
      setStates((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: current } : s)));
      addToast({ title: 'Error toggling status', description: res.error, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this state? Service areas and projects pointing at it keep their own records — they just lose the state.')) return;
    const res = await deleteState(id);
    if (res.success) {
      setStates((prev) => prev.filter((s) => s.id !== id));
      addToast({ title: 'State deleted', type: 'success' });
    } else {
      addToast({ title: 'Error deleting state', description: res.error, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add State
        </Button>
      </div>

      <SortableList
        items={states}
        onReorder={(newItems) => handleReorder(newItems as StateItem[])}
        emptyLabel="No states yet. Add one to tag your service areas and projects."
        renderItem={(item) => (
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="flex items-center gap-3 min-w-0">
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">
                {item.code}
              </span>
              <span className="font-medium text-slate-900 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-6 pointer-events-auto shrink-0">
              <Toggle
                checked={item.is_active}
                onChange={() => handleToggle(item.id, item.is_active)}
                label={item.is_active ? 'Active' : 'Hidden'}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => openEdit(item as StateItem)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      />

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add State' : 'Edit State'}
        description="The full name is for prose; the code is what most templates render next to a city."
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="California"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <Input
            label="Code"
            placeholder="CA"
            value={draft.code}
            onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={handleSave}
              isLoading={isPending}
              disabled={!draft.name.trim() || !draft.code.trim()}
            >
              {editing === 'new' ? 'Add State' : 'Save State'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
