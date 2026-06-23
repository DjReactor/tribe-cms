'use client';
import { useState, useTransition } from 'react';
import { SortableList } from '@/components/dashboard/SortableList';
import { updateServiceAreasOrder, toggleServiceAreaActive, deleteServiceArea } from './actions';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Edit2, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ServiceAreasList({ initialAreas }: { initialAreas: any[] }) {
  const [areas, setAreas] = useState(initialAreas);
  const [, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleReorder = (newItems: any[]) => {
    setAreas(newItems);
    startTransition(async () => {
      const orderData = newItems.map((item, index) => ({ id: item.id, sort_order: index }));
      const res = await updateServiceAreasOrder(orderData);
      if (!res.success) {
        addToast({ title: 'Error saving order', description: res.error, type: 'error' });
      }
    });
  };

  const handleToggle = async (id: string, current: boolean) => {
    setAreas(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    const res = await toggleServiceAreaActive(id, !current);
    if (!res.success) {
      setAreas(prev => prev.map(s => s.id === id ? { ...s, is_active: current } : s));
      addToast({ title: 'Error toggling status', description: res.error, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this area?')) return;
    const res = await deleteServiceArea(id);
    if (res.success) {
      setAreas(prev => prev.filter(s => s.id !== id));
      addToast({ title: 'Service Area deleted', type: 'success' });
    } else {
      addToast({ title: 'Error deleting area', description: res.error, type: 'error' });
    }
  };

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
      
      <SortableList
        items={areas}
        onReorder={handleReorder}
        renderItem={(item) => (
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">{item.name}</span>
              <span className="text-xs text-slate-500">/{item.slug}</span>
            </div>
            <div className="flex items-center gap-6 pointer-events-auto">
              <Toggle 
                checked={item.is_active} 
                onChange={() => handleToggle(item.id, item.is_active)}
                label={item.is_active ? 'Active' : 'Hidden'} 
              />
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/service-areas/${item.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
