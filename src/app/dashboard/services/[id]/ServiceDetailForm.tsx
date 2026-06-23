'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createService, updateService } from '../actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { BlockNoteEditor } from '@/components/dashboard/BlockNoteEditor';
import { MediaLibraryModal } from '@/components/dashboard/MediaLibraryModal';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  short_description: z.string().max(160, 'Max 160 characters').optional().or(z.literal('')),
  cover_image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  noindex: z.boolean(),
  page_content: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ServiceDetailForm({ initialData }: { initialData: any }) {
  const { addToast } = useToast();
  const router = useRouter();
  const isNew = initialData?.id === 'new';
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const { register, handleSubmit, setValue, watch, formState: { errors, dirtyFields } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      short_description: initialData?.short_description || '',
      cover_image_url: initialData?.cover_image_url || '',
      is_active: initialData?.is_active ?? true,
      seo_title: initialData?.seo_title || '',
      seo_description: initialData?.seo_description || '',
      noindex: initialData?.noindex ?? false,
      page_content: initialData?.page_content || undefined,
    }
  });

  const [isPending, startTransition] = useTransition();
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const coverImageUrl = watch('cover_image_url');

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = isNew
        ? await createService(data)
        : await updateService(initialData.id, data);
      if (res.success) {
        addToast({ title: isNew ? 'Service created' : 'Service updated', type: 'success' });
        router.push('/dashboard/services');
      } else {
        addToast({ title: 'Error saving', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core details about this service.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Visibility</p>
              <p className="text-sm text-slate-500">Show this service on the live website</p>
            </div>
            <Toggle 
              checked={watch('is_active')} 
              onChange={(e) => setValue('is_active', e.target.checked, { shouldDirty: true })} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Service Name"
              error={errors.name?.message}
              {...register('name', {
                onChange: (e) => {
                  if (isNew && !dirtyFields.slug) {
                    setValue('slug', slugify(e.target.value), { shouldValidate: true });
                  }
                },
              })}
            />
            <Input label="URL Slug" error={errors.slug?.message} {...register('slug')} />
            <Textarea label="Short Description (Max 160 chars)" error={errors.short_description?.message} {...register('short_description')} className="md:col-span-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cover Image</CardTitle>
          <CardDescription>The main image shown on the services list and the service page hero.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input label="Cover Image URL" placeholder="https://..." {...register('cover_image_url')} />
            </div>
            <Button type="button" variant="outline" onClick={() => setCoverPickerOpen(true)}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Select from Media Library
            </Button>
          </div>
          {coverImageUrl && (
            <img src={coverImageUrl} alt="Cover preview" className="h-40 w-full object-cover rounded-xl" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
          <CardDescription>Write the detailed description using the rich text editor.</CardDescription>
        </CardHeader>
        <CardContent>
          <BlockNoteEditor 
            initialContent={initialData.page_content} 
            onChange={(content) => setValue('page_content', content, { shouldDirty: true })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO & Search Visibility</CardTitle>
          <CardDescription>Optimize how this page appears on Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input label="SEO Title (Max 70 chars)" error={errors.seo_title?.message} {...register('seo_title')} />
          <Textarea label="SEO Description (Max 160 chars)" error={errors.seo_description?.message} {...register('seo_description')} />
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Hide from Search Engines (Noindex)</p>
              <p className="text-sm text-slate-500">Prevent Google from indexing this page</p>
            </div>
            <Toggle 
              checked={watch('noindex')} 
              onChange={(e) => setValue('noindex', e.target.checked, { shouldDirty: true })} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4 pb-12">
        <Button type="submit" isLoading={isPending} size="lg">
          {isNew ? 'Create Service' : 'Save Service'}
        </Button>
      </div>

      <MediaLibraryModal
        isOpen={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        mode="single"
        onSelect={(sel: any) => {
          setValue('cover_image_url', (sel as { id: string; url: string }).url, { shouldDirty: true });
        }}
      />
    </form>
  );
}
