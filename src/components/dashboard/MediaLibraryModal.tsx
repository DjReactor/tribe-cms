'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getMedia } from '@/app/dashboard/media/actions';
import { Check } from 'lucide-react';

export interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: { id: string; url: string } | { id: string; url: string }[]) => void;
  mode: 'single' | 'multi';
  alreadySelectedIds?: string[];
}

const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  mode,
  alreadySelectedIds = [],
}: MediaLibraryModalProps) {
  const [media, setMedia] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ id: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelected([]);
    setLoading(true);
    getMedia().then((items) => {
      setMedia(items);
      setLoading(false);
    });
  }, [isOpen]);

  const getUrl = (item: any) =>
    `${pbUrl}/api/files/media/${item.id}/${item.file}`;

  const handleClick = (item: any) => {
    const url = getUrl(item);
    if (alreadySelectedIds.includes(item.id)) return;

    if (mode === 'single') {
      onSelect({ id: item.id, url });
      onClose();
      return;
    }

    setSelected(prev => {
      const exists = prev.find(s => s.id === item.id);
      if (exists) return prev.filter(s => s.id !== item.id);
      return [...prev, { id: item.id, url }];
    });
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Media Library"
      className="max-w-3xl"
    >
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading media…</div>
      ) : media.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <p className="text-slate-400 text-sm">No media uploaded yet.</p>
          <a
            href="/dashboard/media"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-blue-600 hover:underline"
          >
            Go to Media Library to upload images ↗
          </a>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-3">
            <a
              href="/dashboard/media"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Upload new images in Media Library ↗
            </a>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {media.map((item) => {
              const url = getUrl(item);
              const isAlready = alreadySelectedIds.includes(item.id);
              const isChosen = selected.find(s => s.id === item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClick(item)}
                  disabled={isAlready}
                  className={`relative rounded-lg overflow-hidden aspect-square group transition-all ${
                    isAlready
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer hover:ring-2 hover:ring-blue-400'
                  } ${isChosen ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <img
                    src={url}
                    alt={item.alt_text || item.label || ''}
                    className="w-full h-full object-cover"
                  />
                  {isChosen && (
                    <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                      <div className="bg-blue-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  {isAlready && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-slate-600 bg-white/80 px-1.5 py-0.5 rounded">Added</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {mode === 'multi' && (
            <div className="flex justify-end mt-4 pt-4 border-t border-slate-200">
              <Button onClick={handleConfirm} disabled={selected.length === 0}>
                Add Selected ({selected.length})
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
