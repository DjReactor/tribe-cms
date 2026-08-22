'use client';
import { useState, useTransition } from 'react';
import { SortableList } from '@/components/dashboard/SortableList';
import { updateTestimonialsOrder, toggleTestimonialVisible, deleteTestimonial, createTestimonial } from './actions';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Plus, Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Field names match the `testimonials` collection exactly — see the note in
// ./actions.ts for why they did not, and what that silently broke.
// No `.default()` here: it changes the inferred input type and breaks the
// zodResolver generic. `is_visible` is defaulted server-side instead, and is
// toggled from the list rather than the modal.
const schema = z.object({
  author_name: z.string().min(1, 'Name is required'),
  title: z.string().optional().or(z.literal('')),
  author_location: z.string().optional().or(z.literal('')),
  rating: z.coerce.number().min(1).max(5),
  content: z.string().min(1, 'Review text is required'),
});

type FormData = z.infer<typeof schema>;

export default function TestimonialsList({ initialTestimonials }: { initialTestimonials: any[] }) {
  const [items, setItems] = useState(initialTestimonials);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.input<typeof schema>, any, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 5 }
  });

  const handleReorder = (newItems: any[]) => {
    setItems(newItems);
    startTransition(async () => {
      const orderData = newItems.map((item, index) => ({ id: item.id, sort_order: index }));
      const res = await updateTestimonialsOrder(orderData);
      if (!res.success) {
        addToast({ title: 'Error saving order', description: res.error, type: 'error' });
      }
    });
  };

  const handleToggle = async (id: string, current: boolean) => {
    setItems(prev => prev.map(s => s.id === id ? { ...s, is_visible: !current } : s));
    const res = await toggleTestimonialVisible(id, !current);
    if (!res.success) {
      setItems(prev => prev.map(s => s.id === id ? { ...s, is_visible: current } : s));
      addToast({ title: 'Error toggling status', description: res.error, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    const res = await deleteTestimonial(id);
    if (res.success) {
      setItems(prev => prev.filter(s => s.id !== id));
      addToast({ title: 'Testimonial deleted', type: 'success' });
    } else {
      addToast({ title: 'Error deleting', description: res.error, type: 'error' });
    }
  };

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = await createTestimonial(data);
      if (res.success) {
        addToast({ title: 'Testimonial added', type: 'success' });
        setIsModalOpen(false);
        reset();
        // Just reload page to get new items for simplicity
        window.location.reload();
      } else {
        addToast({ title: 'Error saving', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Testimonial
        </Button>
      </div>
      
      <SortableList
        items={items}
        onReorder={handleReorder}
        renderItem={(item) => (
          <div className="flex items-center justify-between w-full pointer-events-none">
            <div className="flex flex-col flex-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{item.author_name}</span>
                {item.author_location && (
                  <span className="text-sm text-muted-foreground">{item.author_location}</span>
                )}
                <span className="flex text-warning">
                  {Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground truncate max-w-md">"{item.content}"</span>
            </div>
            <div className="flex items-center gap-6 pointer-events-auto shrink-0">
              <Toggle
                checked={item.is_visible}
                onChange={() => handleToggle(item.id, item.is_visible)}
                label={item.is_visible ? 'Visible' : 'Hidden'}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Testimonial">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Client Name" error={errors.author_name?.message} {...register('author_name')} />
          <Input label="Headline (Optional)" error={errors.title?.message} {...register('title')} />
          {/* Matched against area names to surface this review on the matching
              landing page, so it is worth filling in. */}
          <Input label="Location (Optional)" placeholder="Santa Rosa" error={errors.author_location?.message} {...register('author_location')} />
          <Input label="Rating (1-5)" type="number" min="1" max="5" error={errors.rating?.message} {...register('rating')} />
          <Textarea label="Review Text" error={errors.content?.message} {...register('content')} />
          
          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
