'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { updateSeoSettings } from '../actions';

export default function SeoForm({ initialData }: { initialData: any }) {
  const { register, handleSubmit } = useForm({
    defaultValues: initialData || {
      schema_business_type: 'LocalBusiness',
      title_separator: '|',
      enable_breadcrumbs: true,
      enable_aggregate_rating: true,
      noindex_blog: false,
      noindex_service_areas: false,
    }
  });

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const onSubmit = (data: any) => {
    setMessage('');
    startTransition(async () => {
      const res = await updateSeoSettings(data);
      if (res.success) {
        setMessage('SEO settings updated successfully!');
      } else {
        setMessage('Error: ' + res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-8 shadow-xs rounded-xl border border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground">Schema Business Type</label>
          <input {...register('schema_business_type')} className="mt-1 block w-full p-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-all" />
          <p className="text-xs text-muted-foreground mt-1">e.g., Plumber, HVACBusiness, LocalBusiness</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Title Separator</label>
          <input {...register('title_separator')} className="mt-1 block w-full p-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-all" />
        </div>
        
        <div className="md:col-span-2 space-y-4 pt-4 border-t border-border">
          <label className="flex items-center space-x-3">
            <input type="checkbox" {...register('enable_breadcrumbs')} className="w-5 h-5 text-primary rounded border-input focus:ring-ring" />
            <span className="text-sm font-medium text-foreground">Enable JSON-LD Breadcrumbs</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" {...register('enable_aggregate_rating')} className="w-5 h-5 text-primary rounded border-input focus:ring-ring" />
            <span className="text-sm font-medium text-foreground">Enable Aggregate Rating Schema</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" {...register('noindex_blog')} className="w-5 h-5 text-primary rounded border-input focus:ring-ring" />
            <span className="text-sm font-medium text-foreground">No-Index Blog Pages</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" {...register('noindex_service_areas')} className="w-5 h-5 text-primary rounded border-input focus:ring-ring" />
            <span className="text-sm font-medium text-foreground">No-Index Service Area Pages</span>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm text-success font-medium">{message}</span>
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-6 rounded-md transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
