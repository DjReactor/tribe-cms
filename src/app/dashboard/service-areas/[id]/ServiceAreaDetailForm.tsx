'use client';

import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createServiceArea, updateServiceArea } from '../actions';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { BlockNoteEditor } from '@/components/dashboard/BlockNoteEditor';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import type { ServiceArea, StateItem } from '@/types/index';
import {
  MAX_AREA_DEPTH,
  indexAreas,
  getAreaAncestors,
  getAreaDepth,
  getAreaDescendantIds,
  getAreaSubtreeHeight,
  isReservedRootSlug,
} from '@/lib/area-tree';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  parent: z.string(),
  state: z.string(),
  custom_h1: z.string().optional().or(z.literal('')),
  custom_intro: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  focus_keyword: z.string().optional().or(z.literal('')),
  geo_latitude: z.string().optional().or(z.literal('')),
  geo_longitude: z.string().optional().or(z.literal('')),
  noindex: z.boolean(),
  page_content: z.any().optional(),
  also_serving: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

export default function ServiceAreaDetailForm(
  { initialData, allAreas = [], states = [] }:
  { initialData: any; allAreas?: ServiceArea[]; states?: StateItem[] },
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
      state: initialData?.state || '',
      custom_h1: initialData?.custom_h1 || '',
      custom_intro: initialData?.custom_intro || '',
      is_active: initialData?.is_active ?? true,
      seo_title: initialData?.seo_title || '',
      seo_description: initialData?.seo_description || '',
      focus_keyword: initialData?.focus_keyword || '',
      geo_latitude: initialData?.geo_latitude || '',
      geo_longitude: initialData?.geo_longitude || '',
      noindex: initialData?.noindex ?? false,
      page_content: initialData?.page_content || undefined,
      also_serving: initialData?.also_serving || [],
    }
  });

  const [isPending, startTransition] = useTransition();
  const parentId = watch('parent');
  const slug = watch('slug');

  /**
   * Valid parents, mirroring validateAreaParent() in ../actions.ts. Three
   * exclusions: the area itself, anything already beneath it (that would close
   * a cycle), and any area too deep to host this one's whole subtree — an area
   * with children of its own needs two free tiers, not one.
   */
  const areasById = indexAreas(allAreas);
  const descendantIds = isNew ? new Set<string>() : getAreaDescendantIds(initialData.id, allAreas);
  const ownHeight = isNew ? 1 : getAreaSubtreeHeight(initialData.id, allAreas);

  const parentOptions = allAreas
    .filter((a) => a.id !== initialData?.id)
    .filter((a) => !descendantIds.has(a.id))
    .filter((a) => getAreaDepth(a, areasById) + ownHeight <= MAX_AREA_DEPTH)
    .map((a) => ({
      id: a.id,
      // Show the full trail so two similarly-named areas are tellable apart.
      label: [...getAreaAncestors(a, areasById).map((x) => x.name), a.name].join('  >  '),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Area URLs are flat whatever the tier, which is what keeps a landing page at
  // exactly two segments however deep the geography goes.
  const previewPath = `/${slug || 'your-area'}`;
  const parentName = parentId ? areasById.get(parentId)?.name : '';

  /**
   * Slug collisions are the one save that fails in a way nobody can act on, so
   * warn before the round trip. The server re-checks both rules — this is the
   * same mirror-the-rule-in-the-picker pattern the parent selector uses.
   */
  const normalizedSlug = (slug || '').trim().toLowerCase();
  const slugReserved = normalizedSlug !== '' && isReservedRootSlug(normalizedSlug);
  const slugTaken = normalizedSlug !== '' && allAreas.some(
    (a) => a.id !== initialData?.id && a.slug.toLowerCase() === normalizedSlug,
  );

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = isNew
        ? await createServiceArea(data)
        : await updateServiceArea(initialData.id, data);
      if (res.success) {
        addToast({ title: isNew ? 'Service Area created' : 'Service Area updated', type: 'success' });
        if ('movedUrls' in res && res.movedUrls) {
          addToast({
            title: `${res.movedUrls} URL${res.movedUrls === 1 ? '' : 's'} redirected`,
            description: res.movedUrls > 1
              ? 'The area and its landing pages all moved, so the old addresses now 301 to the new ones.'
              : 'The old address now 301s to the new one.',
            type: 'info',
          });
        }
        if ('unpublished' in res && res.unpublished) {
          addToast({
            title: `${res.unpublished} landing page${res.unpublished === 1 ? '' : 's'} unpublished`,
            description: 'Hiding an area takes its landing pages down. They are flagged for review.',
            type: 'info',
          });
        }
        router.push('/dashboard/service-areas');
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
          <CardDescription>Core details about this service area.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Visibility</p>
              <p className="text-sm text-slate-500">
                Show this area on the live website. Hiding it also unpublishes its landing pages.
              </p>
            </div>
            <Toggle
              checked={watch('is_active')}
              onChange={(e) => setValue('is_active', e.target.checked, { shouldDirty: true })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Area Name (e.g. Austin)"
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
            <div className="md:col-span-2">
              <Select label="State" {...register('state')}>
                <option value="">— None —</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>{state.name} ({state.code})</option>
                ))}
              </Select>
            </div>
            <Input label="Custom H1 Headline" placeholder="Leaves blank for default" error={errors.custom_h1?.message} {...register('custom_h1')} className="md:col-span-2" />
            <Textarea label="Custom Intro Paragraph" placeholder="Leaves blank for default" error={errors.custom_intro?.message} {...register('custom_intro')} className="md:col-span-2" />
            <TagInput
              label="Also Serving (mentioned, never linked)"
              hint="Places named in this page's copy to prove local coverage. They get no page and no link. If somewhere deserves its own page, add it as a nested service area instead."
              value={watch('also_serving')}
              onChange={(v) => setValue('also_serving', v, { shouldDirty: true })}
              className="md:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placement</CardTitle>
          <CardDescription>
            Nest this under a wider area to build a geography, up to {MAX_AREA_DEPTH} levels
            (state → county → city → neighborhood). This groups the area in navigation and
            breadcrumbs — the URL stays at the site root either way, so moving an area never
            changes its address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select label="Parent Area" {...register('parent')}>
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

          {(slugReserved || slugTaken) && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <p>
                {slugReserved
                  ? `"${previewPath}" is a built-in page. An area with this slug would not error — it would silently sit behind the real page and never be reachable.`
                  : `Another service area already uses "${previewPath}". Area slugs have to be unique because every area lives at the site root.`}
                {' '}Saving will be refused with a suggested alternative.
              </p>
            </div>
          )}

          {!isNew && ownHeight > 1 && (
            <p className="text-xs text-slate-500">
              This area has sub-areas beneath it, so it can only move somewhere with room
              for {ownHeight} levels.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Page Content</CardTitle>
          <CardDescription>Add specialized content for this specific service area.</CardDescription>
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
          <CardTitle>SEO &amp; Search Visibility</CardTitle>
          <CardDescription>Optimize how this page appears on Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input label="Focus Keyword" error={errors.focus_keyword?.message} {...register('focus_keyword')} />
          <Input label="SEO Title (Max 70 chars)" error={errors.seo_title?.message} {...register('seo_title')} />
          <Textarea label="SEO Description (Max 160 chars)" error={errors.seo_description?.message} {...register('seo_description')} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Latitude (for GeoSchema)" error={errors.geo_latitude?.message} {...register('geo_latitude')} />
            <Input label="Longitude (for GeoSchema)" error={errors.geo_longitude?.message} {...register('geo_longitude')} />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 mt-4">
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
          {isNew ? 'Create Service Area' : 'Save Service Area'}
        </Button>
      </div>
    </form>
  );
}
