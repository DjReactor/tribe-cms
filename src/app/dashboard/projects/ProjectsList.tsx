'use client';
import { useState, useTransition } from 'react';
import { SortableList } from '@/components/dashboard/SortableList';
import { deleteProject, toggleProjectActive, updateProjectsOrder } from './actions';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Edit2, Plus, Star } from 'lucide-react';
import Link from 'next/link';

type FilterTab = 'all' | 'planned' | 'in_progress' | 'completed';

const statusBadgeVariant: Record<string, 'default' | 'warning' | 'success'> = {
  planned: 'default',
  in_progress: 'warning',
  completed: 'success',
};

const statusLabel: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export function ProjectsList({ initialProjects }: { initialProjects: any[] }) {
  const [items, setItems] = useState(initialProjects);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleReorder = (newItems: any[]) => {
    setItems(newItems);
    startTransition(async () => {
      const orderData = newItems.map((item, index) => ({ id: item.id, sort_order: index }));
      const res = await updateProjectsOrder(orderData);
      if (!res.success) {
        addToast({ title: 'Error saving order', description: res.error, type: 'error' });
      }
    });
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
    const res = await toggleProjectActive(id, !current);
    if (!res.success) {
      setItems(prev => prev.map(p => p.id === id ? { ...p, is_active: current } : p));
      addToast({ title: 'Error toggling status', description: res.error, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const res = await deleteProject(id);
    if (res.success) {
      setItems(prev => prev.filter(p => p.id !== id));
      addToast({ title: 'Project deleted', type: 'success' });
    } else {
      addToast({ title: 'Error deleting', description: res.error, type: 'error' });
    }
  };

  const filtered = items.filter(p => {
    if (featuredOnly && !p.featured) return false;
    if (activeTab !== 'all' && p.status !== activeTab) return false;
    return true;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'planned', label: 'Planned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFeaturedOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              featuredOnly
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            Featured
          </button>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-12 text-center">
          <p className="text-slate-500 mb-4">
            {items.length === 0
              ? 'No projects yet. Add your first project to start showcasing your work.'
              : 'No projects match the current filter.'}
          </p>
          {items.length === 0 && (
            <Link href="/dashboard/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Project
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <SortableList
          items={filtered}
          onReorder={handleReorder}
          renderItem={(item) => (
            <div className="flex items-center gap-4 w-full pointer-events-none">
              {item.cover_image_url ? (
                <img
                  src={item.cover_image_url}
                  alt={item.title}
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-slate-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900 truncate">{item.title}</span>
                  {item.featured && (
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-slate-400">/{item.slug}</span>
                  {item.location_city && (
                    <span className="text-xs text-slate-400">· {item.location_city}{item.location_state ? `, ${item.location_state}` : ''}</span>
                  )}
                  {(item.expand?.services ?? []).map((s: any) => (
                    <span key={s.id} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 pointer-events-auto shrink-0">
                <Badge variant={statusBadgeVariant[item.status] ?? 'default'}>
                  {statusLabel[item.status] ?? item.status}
                </Badge>
                <Toggle
                  checked={item.is_active}
                  onChange={() => handleToggleActive(item.id, item.is_active)}
                  label={item.is_active ? 'Active' : 'Hidden'}
                />
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/projects/${item.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>
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
      )}
    </div>
  );
}
