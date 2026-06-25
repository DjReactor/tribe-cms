'use client';
import { useState, useTransition } from 'react';
import { SortableList } from '@/components/dashboard/SortableList';
import {
  updateLocationsOrder,
  toggleLocationActive,
  deleteLocation,
  createLocation,
  updateLocation,
} from './actions';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Plus, Pencil, MapPin, Phone } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  area_name: z.string().min(1, 'Area name is required'),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  seo_title: z.string().optional().or(z.literal('')),
  seo_description: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const EMPTY: FormData = { area_name: '', address: '', phone: '', seo_title: '', seo_description: '' };

export default function LocationsList({ initialLocations }: { initialLocations: any[] }) {
  const [items, setItems] = useState(initialLocations);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const openAdd = () => {
    setEditingId(null);
    reset(EMPTY);
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    reset({
      area_name: item.area_name ?? '',
      address: item.address ?? '',
      phone: item.phone ?? '',
      seo_title: item.seo_title ?? '',
      seo_description: item.seo_description ?? '',
    });
    setIsModalOpen(true);
  };

  const handleReorder = (newItems: any[]) => {
    setItems(newItems);
    startTransition(async () => {
      const orderData = newItems.map((item, index) => ({ id: item.id, sort_order: index }));
      const res = await updateLocationsOrder(orderData);
      if (!res.success) {
        addToast({ title: 'Error saving order', description: res.error, type: 'error' });
      }
    });
  };

  const handleToggle = async (id: string, current: boolean) => {
    setItems(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    const res = await toggleLocationActive(id, !current);
    if (!res.success) {
      setItems(prev => prev.map(s => s.id === id ? { ...s, is_active: current } : s));
      addToast({ title: 'Error toggling status', description: res.error, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    const res = await deleteLocation(id);
    if (res.success) {
      setItems(prev => prev.filter(s => s.id !== id));
      addToast({ title: 'Location deleted', type: 'success' });
    } else {
      addToast({ title: 'Error deleting', description: res.error, type: 'error' });
    }
  };

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = editingId ? await updateLocation(editingId, data) : await createLocation(data);
      if (res.success) {
        addToast({ title: editingId ? 'Location updated' : 'Location added', type: 'success' });
        setIsModalOpen(false);
        reset(EMPTY);
        // Reload to pull fresh records (ids, derived slug) for simplicity.
        window.location.reload();
      } else {
        addToast({ title: 'Error saving', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <SortableList
        items={items}
        onReorder={handleReorder}
        renderItem={(item) => (
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="flex flex-col flex-1 pr-6">
              <span className="font-medium text-slate-900">{item.area_name}</span>
              <span className="text-sm text-slate-500 flex items-center gap-4 flex-wrap mt-0.5">
                {item.address && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{item.address}</span>
                )}
                {item.phone && (
                  <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-4 pointer-events-auto shrink-0">
              <Toggle
                checked={item.is_active}
                onChange={() => handleToggle(item.id, item.is_active)}
                label={item.is_active ? 'Visible' : 'Hidden'}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEdit(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Location' : 'Add Location'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Area Name" error={errors.area_name?.message} {...register('area_name')} />
          <Input label="Address" error={errors.address?.message} {...register('address')} />
          <Input label="Phone Number" error={errors.phone?.message} {...register('phone')} />
          <Input label="SEO Title (optional)" error={errors.seo_title?.message} {...register('seo_title')} />
          <Textarea label="SEO Description (optional)" error={errors.seo_description?.message} {...register('seo_description')} />

          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
