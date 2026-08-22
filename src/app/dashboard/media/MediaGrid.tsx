'use client';
import { deleteMedia } from './actions';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function MediaGrid({ items, pbUrl }: { items: any[], pbUrl: string }) {
  const { addToast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image? It may break pages where it is used.')) return;
    const res = await deleteMedia(id);
    if (res.success) {
      addToast({ title: 'Image deleted', type: 'success' });
    } else {
      addToast({ title: 'Error deleting', description: res.error, type: 'error' });
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast({ title: 'URL copied to clipboard', type: 'success' });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
      {items.map((item) => {
        // Build the public URL. In production this should be a relative path if proxied.
        const url = item.file ? `${pbUrl}/api/files/media/${item.id}/${item.file}` : '';
        
        return (
          <div key={item.id} className="group relative rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs hover:shadow-md transition-all">
            <div className="aspect-[4/3] bg-muted relative overflow-hidden flex items-center justify-center">
              {/* Using native img tag per instructions to avoid extra config overhead for PB URLs in Next Image */}
              <img src={url} alt={item.alt_text || item.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" onClick={() => handleCopy(url)}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="danger" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{item.category}</p>
            </div>
          </div>
        );
      })}
      {items.length === 0 && (
        <div className="col-span-full py-12 text-center text-muted-foreground">
          No media uploaded yet.
        </div>
      )}
    </div>
  );
}
