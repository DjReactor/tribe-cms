'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createCatalogItem, updateCatalogItem } from '@/app/dashboard/catalog/actions';
import { CATALOG_KIND_META, type CatalogKind } from '@/lib/catalog-kinds';
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
import { slugify } from '@/lib/slug';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().or(z.literal('')),
  image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  noindex: z.boolean(),
  details: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CatalogItemForm({ kind, initialData }: { kind: CatalogKind; initialData: any }) {
  const { addToast } = useToast();
  const router = useRouter();
  const meta = CATALOG_KIND_META[kind];
  const isNew = initialData?.id === 'new';
  const { register, handleSubmit, setValue, watch, formState: { errors, dirtyFields } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      image_url: initialData?.image_url || '',
      is_active: initialData?.is_active ?? true,
      seo_title: initialData?.seo_title || '',
      seo_description: initialData?.seo_description || '',
      noindex: initialData?.noindex ?? false,
      details: initialData?.details || undefined,
    }
  });

  const [isPending, startTransition] = useTransition();
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const imageUrl = watch('image_url');

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = isNew
        ? await createCatalogItem(kind, data)
        : await updateCatalogItem(kind, initialData.id, data);
      if (res.success) {
        addToast({ title: isNew ? `${meta.singular} created` : `${meta.singular} updated`, type: 'success' });
        router.push(`/dashboard/${kind}`);
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
          <CardDescription>Core details about this {meta.singular.toLowerCase()}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/60">
            <div>
              <p className="font-medium text-foreground">Visibility</p>
              <p className="text-sm text-muted-foreground">Show this {meta.singular.toLowerCase()} on the live website</p>
            </div>
            <Toggle
              checked={watch('is_active')}
              onChange={(e) => setValue('is_active', e.target.checked, { shouldDirty: true })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Name"
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
            <Textarea label="Description" error={errors.description?.message} {...register('description')} className="md:col-span-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image</CardTitle>
          <CardDescription>The image or logo shown on the listing and detail pages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input label="Image URL" placeholder="https://..." {...register('image_url')} />
            </div>
            <Button type="button" variant="outline" onClick={() => setImagePickerOpen(true)}>
              <ImageIcon className="h-4 w-4" />
              Select from Media Library
            </Button>
          </div>
          {imageUrl && (
            <img src={imageUrl} alt="Image preview" className="h-40 w-full object-contain rounded-xl bg-muted/50" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Write the detailed content using the rich text editor.</CardDescription>
        </CardHeader>
        <CardContent>
          <BlockNoteEditor
            initialContent={initialData.details}
            onChange={(content) => setValue('details', content, { shouldDirty: true })}
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

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/60">
            <div>
              <p className="font-medium text-foreground">Hide from Search Engines (Noindex)</p>
              <p className="text-sm text-muted-foreground">Prevent Google from indexing this page</p>
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
          {isNew ? `Create ${meta.singular}` : `Save ${meta.singular}`}
        </Button>
      </div>

      <MediaLibraryModal
        isOpen={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        mode="single"
        onSelect={(sel: any) => {
          setValue('image_url', (sel as { id: string; url: string }).url, { shouldDirty: true });
        }}
      />
    </form>
  );
}
