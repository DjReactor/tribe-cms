'use client';

import { useRef, useTransition } from 'react';
import { useToast } from '@/components/ui/Toast';
import { uploadMedia } from './actions';
import { UploadCloud } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export function MediaUploader() {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', file.name);
    formData.append('category', 'other');

    startTransition(async () => {
      const res = await uploadMedia(formData);
      if (res.success) {
        addToast({ title: 'Upload complete', type: 'success' });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        addToast({ title: 'Upload failed', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <div className="relative group rounded-xl border-2 border-dashed border-input hover:border-ring hover:bg-primary/10 transition-all p-12 text-center cursor-pointer overflow-hidden">
      <Input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={handleUpload}
        disabled={isPending}
        ref={fileInputRef}
        accept="image/*"
      />
      <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
        <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          <UploadCloud className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isPending ? 'Uploading...' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG or WEBP (max. 5MB)</p>
        </div>
      </div>
    </div>
  );
}
