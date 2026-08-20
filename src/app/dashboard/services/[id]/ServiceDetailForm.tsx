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
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { BlockNoteEditor } from '@/components/dashboard/BlockNoteEditor';
import { MediaLibraryModal } from '@/components/dashboard/MediaLibraryModal';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon } from 'lucide-react';
import type { Service } from '@/types/index';
import {
  MAX_SERVICE_DEPTH,
  indexServices,
  getAncestors,
  getServiceDepth,
  getDescendantIds,
  getSubtreeHeight,
} from '@/lib/service-tree';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  parent: z.string(),
  short_description: z.string().max(160, 'Max 160 characters').optional().or(z.literal('')),
  cover_image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  noindex: z.boolean(),
  page_content: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ServiceDetailForm(
  { initialData, allServices = [] }: { initialData: any; allServices?: Service[] },
) {
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
      parent: initialData?.parent || '',
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
  const parentId = watch('parent');

  /**
   * Valid parents, mirroring validateParent() in ../actions.ts. Three exclusions:
   * the service itself, anything already beneath it (that would close a cycle),
   * and any service too deep to host this one's whole subtree - a service that
   * has children of its own needs two free tiers, not one.
   */
  const servicesById = indexServices(allServices);
  const descendantIds = isNew ? new Set<string>() : getDescendantIds(initialData.id, allServices);
  const ownHeight = isNew ? 1 : getSubtreeHeight(initialData.id, allServices);

  const parentOptions = allServices
    .filter((s) => s.id !== initialData?.id)
    .filter((s) => !descendantIds.has(s.id))
    .filter((s) => getServiceDepth(s, servicesById) + ownHeight <= MAX_SERVICE_DEPTH)
    .map((s) => ({
      id: s.id,
      // Show the full trail so two similarly-named services are tellable apart.
      label: [...getAncestors(s, servicesById).map((a) => a.name), s.name].join('  >  '),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // URLs are flat whatever the tier - the parent shapes navigation and the
  // breadcrumb, not the address.
  const previewPath = `/services/${watch('slug') || 'your-service'}`;
  const parentName = parentId ? servicesById.get(parentId)?.name : '';

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = isNew
        ? await createService(data)
        : await updateService(initialData.id, data);
      if (res.success) {
        addToast({ title: isNew ? 'Service created' : 'Service updated', type: 'success' });
        if ('unpublished' in res && res.unpublished) {
          addToast({
            title: `${res.unpublished} landing page${res.unpublished === 1 ? '' : 's'} unpublished`,
            description: 'Hiding a service takes its landing pages down. They are flagged for review.',
            type: 'info',
          });
        }
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
          <CardTitle>Placement</CardTitle>
          <CardDescription>
            Nest this under another service to build a hierarchy, up to {MAX_SERVICE_DEPTH} levels
            deep. This groups the service in navigation and breadcrumbs — the URL stays flat
            either way, so moving a service never changes its address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select label="Parent Service" {...register('parent')}>
            <option value="">— None (top level) —</option>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </Select>

          <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500 mb-1">Page URL</p>
            <p className="font-mono text-sm text-slate-900 break-all">{previewPath}</p>
            {parentName && (
              <p className="text-xs text-slate-500 mt-2">
                Shown under <span className="font-medium text-slate-700">{parentName}</span> in
                navigation and breadcrumbs.
              </p>
            )}
          </div>

          {!isNew && ownHeight > 1 && (
            <p className="text-xs text-slate-500">
              This service has sub-services beneath it, so it can only move somewhere with
              room for {ownHeight} levels.
            </p>
          )}
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
