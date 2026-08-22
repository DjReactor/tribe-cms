'use client';
import { useState, useTransition } from 'react';
import { deleteRedirect, createRedirect } from '../actions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Plus, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';

export function RedirectsTable({ initialData }: { initialData: any[] }) {
  const [redirects, setRedirects] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      from_path: '',
      to_path: '',
      type: '301',
      note: ''
    }
  });

  const onSubmit = (data: any) => {
    // Basic formatting
    if (!data.from_path.startsWith('/')) data.from_path = '/' + data.from_path;
    if (!data.to_path.startsWith('http') && !data.to_path.startsWith('/')) {
      data.to_path = '/' + data.to_path;
    }

    startTransition(async () => {
      const res = await createRedirect(data);
      if (res.success) {
        addToast({ title: 'Redirect created', type: 'success' });
        setIsModalOpen(false);
        reset();
        window.location.reload(); // Simple refresh to pick up new data
      } else {
        addToast({ title: 'Creation failed', description: res.error, type: 'error' });
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redirect?')) return;
    const res = await deleteRedirect(id);
    if (res.success) {
      setRedirects(prev => prev.filter(r => r.id !== id));
      addToast({ title: 'Redirect deleted', type: 'success' });
    } else {
      addToast({ title: 'Deletion failed', description: res.error, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Redirect
        </Button>
      </div>
      
      <div className="bg-card rounded-xl border border-border/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/60">
              <tr>
                <th className="px-6 py-4">From Path</th>
                <th className="px-6 py-4 w-8"></th>
                <th className="px-6 py-4">To Path / URL</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Hits</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {redirects.map((redirect) => (
                <tr key={redirect.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-foreground">{redirect.from_path}</td>
                  <td className="px-2 py-4 text-muted-foreground"><ArrowRight className="h-4 w-4" /></td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{redirect.to_path}</td>
                  <td className="px-6 py-4">
                    <Badge variant={redirect.type === '301' ? 'success' : 'warning'}>
                      {redirect.type === '301' ? '301 Permanent' : '302 Temporary'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{redirect.hit_count || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(redirect.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {redirects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No redirects configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Redirect">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="From Path" 
            placeholder="/old-page" 
            {...register('from_path', { required: 'Required' })} 
            error={errors.from_path?.message as string} 
          />
          <Input 
            label="To Path or URL" 
            placeholder="/new-page or https://..." 
            {...register('to_path', { required: 'Required' })} 
            error={errors.to_path?.message as string} 
          />
          <Select label="Redirect Type" {...register('type')}>
            <option value="301">301 Permanent (SEO Friendly)</option>
            <option value="302">302 Temporary</option>
          </Select>
          <Input label="Internal Note (Optional)" placeholder="Why was this created?" {...register('note')} />
          
          <div className="flex justify-end pt-4">
            <Button type="submit" isLoading={isPending}>Create Redirect</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
