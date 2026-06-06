'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { getMedia, uploadMedia } from '@/app/dashboard/media/actions';
import { MediaItem } from '@/types';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export function MediaPickerModal({ isOpen, onClose, onSelect }: MediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getMedia().then((data) => {
        setMediaList(data as unknown as MediaItem[]);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('label', file.name);
      
      const res = await uploadMedia(formData);
      if (res.success) {
        const freshData = await getMedia();
        setMediaList(freshData as unknown as MediaItem[]);
      } else {
        addToast({ title: 'Upload failed', description: res.error || 'Unknown error', type: 'error' });
      }
    } catch (err: any) {
      addToast({ title: 'Upload error', description: err.message || 'An unexpected error occurred during upload.', type: 'error' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploading(false);
    }
  };

  const handleSelect = (item: MediaItem) => {
    // In actual implementation, we might not have pbUrl in the client component natively unless passed,
    // but we can use relative path since nextjs proxy to pocketbase is typically used or standard route
    const finalUrl = item.file 
      ? `/api/files/media/${item.id}/${item.file}` 
      : '';
      
    onSelect(finalUrl);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select from Media Gallery" className="max-w-4xl max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center py-4 border-b">
         <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer transition-colors">
           {isUploading ? 'Uploading...' : 'Upload New Image'}
           <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} ref={fileInputRef} />
         </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 mt-4 h-[400px]">
        {isLoading ? (
          <p className="text-slate-500">Loading gallery...</p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {mediaList.map((item) => (
              <div 
                key={item.id} 
                className="relative aspect-square border rounded cursor-pointer hover:border-blue-500 overflow-hidden group"
                onClick={() => handleSelect(item)}
              >
                <img 
                  src={item.file ? `/api/files/media/${item.id}/${item.file}?thumb=100x100` : ''} 
                  alt={item.alt_text || item.label}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <CheckCircle className="text-white h-8 w-8" />
                </div>
              </div>
            ))}
            {mediaList.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No media found.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
