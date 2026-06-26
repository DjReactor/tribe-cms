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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { BlockNoteEditor } from '@/components/dashboard/BlockNoteEditor';
import { useRouter } from 'next/navigation';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
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
  neighborhoods: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

export default function ServiceAreaDetailForm({ initialData }: { initialData: any }) {
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
      neighborhoods: initialData?.neighborhoods || [],
    }
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = isNew
        ? await createServiceArea(data)
        : await updateServiceArea(initialData.id, data);
      if (res.success) {
        addToast({ title: isNew ? 'Service Area created' : 'Service Area updated', type: 'success' });
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
              <p className="text-sm text-slate-500">Show this area on the live website</p>
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
            <Input label="Custom H1 Headline" placeholder="Leaves blank for default" error={errors.custom_h1?.message} {...register('custom_h1')} className="md:col-span-2" />
            <Textarea label="Custom Intro Paragraph" placeholder="Leaves blank for default" error={errors.custom_intro?.message} {...register('custom_intro')} className="md:col-span-2" />
            <TagInput
              label="Neighborhoods (sub-areas served)"
              hint="Add the neighborhoods this area covers — shown under the area on the site."
              value={watch('neighborhoods')}
              onChange={(v) => setValue('neighborhoods', v, { shouldDirty: true })}
              className="md:col-span-2"
            />
          </div>
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
          <CardTitle>SEO & Search Visibility</CardTitle>
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
