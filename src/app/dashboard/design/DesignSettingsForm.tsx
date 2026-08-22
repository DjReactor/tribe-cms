'use client';

import { useState, useTransition } from 'react';
import { MediaPickerModal } from '@/components/MediaPickerModal';
import { TemplateManifest } from '@/types';
import { TemplateSettings } from '@/types';
import { saveImageOverrides } from './actions';
import { useToast } from '@/components/ui/Toast';

export function DesignSettingsForm({ 
  manifest, 
  initialSettings 
}: { 
  manifest?: TemplateManifest; 
  initialSettings: TemplateSettings;
}) {
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>(
    initialSettings.template_config?.imageOverrides || {}
  );
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();
  const { addToast } = useToast();

  if (!manifest || !manifest.supportedImageKeys || Object.keys(manifest.supportedImageKeys).length === 0) {
    return null; // This template doesn't support layout image overrides
  }

  const handleImageSelect = (url: string) => {
    if (!activeSlotKey) return;
    
    const newOverrides = { ...imageOverrides, [activeSlotKey]: url };
    setImageOverrides(newOverrides);
    
    startTransition(async () => {
      const res = await saveImageOverrides(newOverrides);
      if (res.success) {
        addToast({ title: 'Image saved successfully', type: 'success' });
      } else {
        addToast({ title: 'Error saving image', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <div className="space-y-6 mt-12 bg-card p-8 rounded-xl border border-border shadow-xs">
      <h2 className="text-xl font-bold text-foreground">Template Layout Images</h2>
      <p className="text-muted-foreground text-sm mb-6">Customize the core images for your active template.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(manifest.supportedImageKeys).map(([key, slot]) => {
          const currentImage = imageOverrides[key] || slot.defaultFallback;
          
          return (
            <div key={key} className="border rounded-xl p-4 bg-muted/50 shadow-xs flex flex-col">
              <h3 className="font-semibold text-foreground mb-4">{slot.label}</h3>
              
              <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden mb-4 border relative">
                {currentImage ? (
                  <img src={currentImage} alt={slot.label} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">No image set</div>
                )}
              </div>
              
              <button 
                onClick={() => setActiveSlotKey(key)}
                className="w-full bg-card border border-border hover:bg-muted text-foreground py-2 rounded-lg transition-colors font-medium text-sm mt-auto"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Change Image'}
              </button>
            </div>
          );
        })}
      </div>

      <MediaPickerModal 
        isOpen={!!activeSlotKey} 
        onClose={() => setActiveSlotKey(null)}
        onSelect={handleImageSelect}
      />
    </div>
  );
}
