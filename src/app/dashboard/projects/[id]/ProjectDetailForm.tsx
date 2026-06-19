'use client';

import { useForm } from 'react-hook-form';
import { useTransition, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createProject, updateProject } from '../actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { MediaLibraryModal } from '@/components/dashboard/MediaLibraryModal';
import { useRouter } from 'next/navigation';
import { Star, X, Image as ImageIcon } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  summary: z.string().min(1, 'Summary is required').max(300),
  status: z.enum(['planned', 'in_progress', 'completed']),
  featured: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number(),
  service_ids: z.array(z.string()),
  location_city: z.string().optional().or(z.literal('')),
  location_state: z.string().optional().or(z.literal('')),
  completed_at: z.string().optional().or(z.literal('')),
  cover_image_url: z.string().optional().or(z.literal('')),
  gallery_media_ids: z.array(z.string()),
  content_problem: z.string().optional().or(z.literal('')),
  content_solution: z.string().optional().or(z.literal('')),
  content_process: z.string().optional().or(z.literal('')),
  content_outcome: z.string().optional().or(z.literal('')),
  testimonial_enabled: z.boolean(),
  testimonial_quote: z.string().optional().or(z.literal('')),
  testimonial_client: z.string().optional().or(z.literal('')),
  testimonial_client_info: z.string().optional().or(z.literal('')),
  testimonial_rating: z.number().min(1).max(5).optional(),
  testimonial_client_image_url: z.string().optional().or(z.literal('')),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  canonical_url: z.string().url().optional().or(z.literal('')),
  og_image_url: z.string().optional().or(z.literal('')),
  noindex: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.testimonial_enabled) {
    if (!data.testimonial_quote?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['testimonial_quote'], message: 'Quote is required when a testimonial is enabled' });
    }
    if (!data.testimonial_client?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['testimonial_client'], message: 'Client name is required when a testimonial is enabled' });
    }
  }
});

type FormData = z.infer<typeof schema>;

interface GalleryPreview {
  id: string;
  url: string;
}

interface Props {
  initialData: any;
  availableServices: any[];
}

function charCountClass(len: number, warn: number, max: number) {
  if (len > max) return 'text-red-500';
  if (len >= warn) return 'text-amber-500';
  return 'text-slate-400';
}

export default function ProjectDetailForm({ initialData, availableServices }: Props) {
  const { addToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isNew = initialData?.id === 'new';

  const [galleryPreviews, setGalleryPreviews] = useState<GalleryPreview[]>(
    (initialData?.expand?.gallery_media ?? []).map((m: any) => ({
      id: m.id,
      url: `${process.env.NEXT_PUBLIC_POCKETBASE_URL || ''}/api/files/media/${m.id}/${m.file}`,
    }))
  );
  const [clientPhotoPreview, setClientPhotoPreview] = useState<string>(
    initialData?.testimonial_client_image_url || initialData?.testimonial?.client_image_url || ''
  );

  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [ogPickerOpen, setOgPickerOpen] = useState(false);
  const [clientPhotoPickerOpen, setClientPhotoPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      summary: initialData?.summary || '',
      status: initialData?.status || 'planned',
      featured: initialData?.featured ?? false,
      is_active: initialData?.is_active ?? true,
      sort_order: initialData?.sort_order ?? 0,
      service_ids: initialData?.service_ids ?? initialData?.services ?? [],
      location_city: initialData?.location_city || initialData?.location?.city || '',
      location_state: initialData?.location_state || initialData?.location?.state || '',
      completed_at: initialData?.completed_at || '',
      cover_image_url: initialData?.cover_image_url || '',
      gallery_media_ids: initialData?.gallery_media_ids ?? initialData?.gallery_media ?? [],
      content_problem: initialData?.content_problem || initialData?.content?.problem || '',
      content_solution: initialData?.content_solution || initialData?.content?.solution || '',
      content_process: initialData?.content_process || initialData?.content?.process || '',
      content_outcome: initialData?.content_outcome || initialData?.content?.outcome || '',
      testimonial_enabled: !!(initialData?.testimonial_quote || initialData?.testimonial?.quote),
      testimonial_quote: initialData?.testimonial_quote || initialData?.testimonial?.quote || '',
      testimonial_client: initialData?.testimonial_client || initialData?.testimonial?.client || '',
      testimonial_client_info: initialData?.testimonial_client_info || initialData?.testimonial?.client_info || '',
      testimonial_rating: initialData?.testimonial_rating || initialData?.testimonial?.rating || undefined,
      testimonial_client_image_url: initialData?.testimonial_client_image_url || initialData?.testimonial?.client_image_url || '',
      seo_title: initialData?.seo_title || '',
      seo_description: initialData?.seo_description || '',
      canonical_url: initialData?.canonical_url || '',
      og_image_url: initialData?.og_image_url || '',
      noindex: initialData?.noindex ?? false,
    },
  });

  // Auto-slug from title while slug is untouched
  const titleValue = watch('title');
  useEffect(() => {
    if (!dirtyFields.slug && titleValue) {
      const slug = titleValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setValue('slug', slug, { shouldValidate: true, shouldDirty: false });
    }
  }, [titleValue, dirtyFields.slug, setValue]);

  // Clear completed_at when status changes away from 'completed'
  const statusValue = watch('status');
  useEffect(() => {
    if (statusValue !== 'completed') {
      setValue('completed_at', '');
    }
  }, [statusValue, setValue]);

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      let res;
      if (isNew) {
        res = await createProject(data);
      } else {
        res = await updateProject(initialData.id, data);
      }

      if (!res.success) {
        addToast({ title: 'Error saving', description: (res as any).error, type: 'error' });
        return;
      }

      addToast({ title: isNew ? 'Project created' : 'Project updated', type: 'success' });
      router.push('/dashboard/projects');
    });
  };

  const handleGalleryPickerSelect = (selected: any) => {
    const items: { id: string; url: string }[] = Array.isArray(selected) ? selected : [selected];
    const currentIds = watch('gallery_media_ids');
    const newItems = items.filter(i => !currentIds.includes(i.id));
    setValue('gallery_media_ids', [...currentIds, ...newItems.map(i => i.id)]);
    setGalleryPreviews(prev => [...prev, ...newItems]);
  };

  const removeGalleryItem = (id: string) => {
    setValue('gallery_media_ids', watch('gallery_media_ids').filter(i => i !== id));
    setGalleryPreviews(prev => prev.filter(p => p.id !== id));
  };

  const coverImageUrl = watch('cover_image_url');
  const testimonialEnabled = watch('testimonial_enabled');
  const testimonialRating = watch('testimonial_rating');
  const seoTitle = watch('seo_title') || '';
  const seoDesc = watch('seo_description') || '';
  const summaryVal = watch('summary') || '';
  const serviceIds = watch('service_ids') || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* ── Card 1: Basic Information ─────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core details about this project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex-1">
              <div>
                <p className="font-medium text-slate-900">Active</p>
                <p className="text-sm text-slate-500">Visible on website</p>
              </div>
              <Toggle
                checked={watch('is_active')}
                onChange={(e) => setValue('is_active', e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex-1">
              <div>
                <p className="font-medium text-slate-900">Featured</p>
                <p className="text-sm text-slate-500">Feature on homepage</p>
              </div>
              <Toggle
                checked={watch('featured')}
                onChange={(e) => setValue('featured', e.target.checked)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Project Title" error={errors.title?.message} {...register('title')} />
            <Input label="URL Slug" error={errors.slug?.message} {...register('slug')} />
          </div>

          <div className="space-y-1">
            <Textarea label="Summary (max 300 chars)" error={errors.summary?.message} {...register('summary')} />
            <p className={`text-xs text-right ${charCountClass(summaryVal.length, 260, 300)}`}>
              {summaryVal.length}/300
            </p>
          </div>

          <Select label="Status" error={errors.status?.message} {...register('status')}>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Services</label>
            <div className="grid grid-cols-2 gap-2">
              {availableServices.map((svc: any) => (
                <label key={svc.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600"
                    checked={serviceIds.includes(svc.id)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...serviceIds, svc.id]
                        : serviceIds.filter((id: string) => id !== svc.id);
                      setValue('service_ids', next);
                    }}
                  />
                  <span className="text-sm text-slate-700">{svc.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Location City" {...register('location_city')} />
            <Input label="Location State" {...register('location_state')} />
          </div>

          {statusValue === 'completed' && (
            <Input
              label="Month Completed"
              type="date"
              error={errors.completed_at?.message}
              {...register('completed_at')}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Card 2: Cover Image ───────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Image</CardTitle>
          <CardDescription>The main image shown on project cards and the detail page hero.</CardDescription>
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

      {/* ── Card 3: Project Gallery ───────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Project Gallery</CardTitle>
          <CardDescription>Additional images shown on the project detail page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {galleryPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {galleryPreviews.map((item) => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square">
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(item.id)}
                    className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5 text-slate-700" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button type="button" variant="outline" onClick={() => setGalleryPickerOpen(true)}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Select from Media Library
          </Button>
          <p className="text-xs text-slate-400">
            To add new images, upload them in the{' '}
            <a href="/dashboard/media" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
              Media Library
            </a>{' '}
            first.
          </p>
        </CardContent>
      </Card>

      {/* ── Card 4: Project Story ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Project Story</CardTitle>
          <CardDescription>These sections appear on the project detail page. Fill in only what applies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Textarea label="The Challenge — What was the client's problem or situation?" {...register('content_problem')} />
          <Textarea label="Our Solution — What did you do to solve it?" {...register('content_solution')} />
          <Textarea label="The Process — How did the work unfold?" {...register('content_process')} />
          <Textarea label="The Result — What was the outcome for the client?" {...register('content_outcome')} />
        </CardContent>
      </Card>

      {/* ── Card 5: Client Testimonial ───────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Client Testimonial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <p className="font-medium text-slate-900">Include a testimonial with this project</p>
            <Toggle
              checked={testimonialEnabled}
              onChange={(e) => setValue('testimonial_enabled', e.target.checked)}
            />
          </div>

          {testimonialEnabled && (
            <div className="space-y-6">
              <Textarea
                label="Quote"
                error={errors.testimonial_quote?.message}
                {...register('testimonial_quote')}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Client name" error={errors.testimonial_client?.message} {...register('testimonial_client')} />
                <Input
                  label="Client details"
                  placeholder="e.g. Home Owner, CEO Mark Construction"
                  {...register('testimonial_client_info')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Star Rating (optional)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setValue('testimonial_rating', n)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          (testimonialRating ?? 0) >= n
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  {testimonialRating && (
                    <button
                      type="button"
                      onClick={() => setValue('testimonial_rating', undefined)}
                      className="ml-2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Client Photo (optional)</label>
                {(clientPhotoPreview || watch('testimonial_client_image_url')) && (
                  <div className="flex items-center gap-3">
                    <img
                      src={clientPhotoPreview || watch('testimonial_client_image_url')}
                      alt="Client"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setClientPhotoPreview('');
                        setValue('testimonial_client_image_url', '');
                      }}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setClientPhotoPickerOpen(true)}
                >
                  <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                  Select from Media Library
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Card 6: SEO ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>SEO &amp; Search Visibility</CardTitle>
          <CardDescription>Optimize how this project appears on Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <Input label="SEO Title (max 70 chars)" error={errors.seo_title?.message} {...register('seo_title')} />
            <p className={`text-xs text-right ${charCountClass(seoTitle.length, 55, 70)}`}>
              {seoTitle.length}/70
            </p>
          </div>
          <div className="space-y-1">
            <Textarea label="SEO Description (max 160 chars)" error={errors.seo_description?.message} {...register('seo_description')} />
            <p className={`text-xs text-right ${charCountClass(seoDesc.length, 140, 160)}`}>
              {seoDesc.length}/160
            </p>
          </div>
          <Input label="Canonical URL (optional)" placeholder="https://..." error={errors.canonical_url?.message} {...register('canonical_url')} />

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Social Share Image (optional)"
                placeholder="https://... — defaults to cover image if empty"
                {...register('og_image_url')}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => setOgPickerOpen(true)}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Pick
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Hide from Search Engines</p>
              <p className="text-sm text-slate-500">Prevent Google from indexing this project page.</p>
            </div>
            <Toggle
              checked={watch('noindex')}
              onChange={(e) => setValue('noindex', e.target.checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Save Buttons ──────────────────────────────── */}
      <div className="flex justify-end gap-4 pt-4 pb-12">
        <Button
          type="button"
          variant="outline"
          isLoading={isPending}
          size="lg"
          onClick={() => {
            setValue('is_active', false);
            handleSubmit(onSubmit)();
          }}
        >
          Save Draft
        </Button>
        <Button
          type="button"
          isLoading={isPending}
          size="lg"
          onClick={() => {
            setValue('is_active', true);
            handleSubmit(onSubmit)();
          }}
        >
          {isNew ? 'Create Project' : 'Save & Publish'}
        </Button>
      </div>

      {/* ── Media Library Modals ──────────────────────── */}
      <MediaLibraryModal
        isOpen={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        mode="single"
        onSelect={(sel: any) => {
          setValue('cover_image_url', (sel as { id: string; url: string }).url);
        }}
      />
      <MediaLibraryModal
        isOpen={galleryPickerOpen}
        onClose={() => setGalleryPickerOpen(false)}
        mode="multi"
        alreadySelectedIds={watch('gallery_media_ids')}
        onSelect={handleGalleryPickerSelect}
      />
      <MediaLibraryModal
        isOpen={ogPickerOpen}
        onClose={() => setOgPickerOpen(false)}
        mode="single"
        onSelect={(sel: any) => {
          setValue('og_image_url', (sel as { id: string; url: string }).url);
        }}
      />
      <MediaLibraryModal
        isOpen={clientPhotoPickerOpen}
        onClose={() => setClientPhotoPickerOpen(false)}
        mode="single"
        onSelect={(sel: any) => {
          const { url } = sel as { id: string; url: string };
          setValue('testimonial_client_image_url', url);
          setClientPhotoPreview(url);
        }}
      />
    </form>
  );
}
