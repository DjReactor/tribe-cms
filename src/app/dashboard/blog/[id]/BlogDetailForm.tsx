'use client';

import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateBlogPost, createBlogPost } from '../actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { BlockNoteEditor } from '@/components/dashboard/BlockNoteEditor';
import { useRouter } from 'next/navigation';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().max(200, 'Max 200 characters').optional().or(z.literal('')),
  content: z.any().optional(),
  status: z.enum(['draft', 'published']),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  focus_keyword: z.string().optional().or(z.literal('')),
  noindex: z.boolean(),
  canonical_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function BlogDetailForm({ initialData }: { initialData: any }) {
  const { addToast } = useToast();
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors, dirtyFields } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      excerpt: initialData?.excerpt || '',
      status: initialData?.status || 'draft',
      seo_title: initialData?.seo_title || '',
      seo_description: initialData?.seo_description || '',
      focus_keyword: initialData?.focus_keyword || '',
      noindex: initialData?.noindex ?? false,
      canonical_url: initialData?.canonical_url || '',
      content: initialData?.content || undefined,
    }
  });

  const isNew = initialData?.id === 'new';
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const [isPending, startTransition] = useTransition();

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      let res;
      if (isNew) {
        res = await createBlogPost(data);
      } else {
        res = await updateBlogPost(initialData.id, data);
      }
      if (res.success) {
        addToast({ title: isNew ? 'Post created' : 'Post updated', type: 'success' });
        router.push('/dashboard/blog');
      } else {
        addToast({ title: 'Error saving', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>Core details about this post.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Post Title"
              error={errors.title?.message}
              {...register('title', {
                onChange: (e) => {
                  if (isNew && !dirtyFields.slug) {
                    setValue('slug', slugify(e.target.value), { shouldValidate: true });
                  }
                },
              })}
            />
            <Input label="URL Slug" error={errors.slug?.message} {...register('slug')} />
            <Textarea label="Excerpt (Max 200 chars)" error={errors.excerpt?.message} {...register('excerpt')} className="md:col-span-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Post Content</CardTitle>
          <CardDescription>Write the article using the rich text editor.</CardDescription>
        </CardHeader>
        <CardContent>
          <BlockNoteEditor 
            initialContent={initialData.content} 
            onChange={(content) => setValue('content', content, { shouldDirty: true })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO & Search Visibility</CardTitle>
          <CardDescription>Optimize how this post appears on Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input label="Focus Keyword" error={errors.focus_keyword?.message} {...register('focus_keyword')} />
          <Input label="SEO Title (Max 70 chars)" error={errors.seo_title?.message} {...register('seo_title')} />
          <Textarea label="SEO Description (Max 160 chars)" error={errors.seo_description?.message} {...register('seo_description')} />
          <Input label="Canonical URL (Optional)" placeholder="https://..." error={errors.canonical_url?.message} {...register('canonical_url')} />
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 mt-4">
            <div>
              <p className="font-medium text-slate-900">Hide from Search Engines (Noindex)</p>
              <p className="text-sm text-slate-500">Prevent Google from indexing this post</p>
            </div>
            <Toggle 
              checked={watch('noindex')} 
              onChange={(e) => setValue('noindex', e.target.checked, { shouldDirty: true })} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pt-4 pb-12">
        <Button 
          type="button" 
          variant="outline" 
          isLoading={isPending} 
          size="lg"
          onClick={() => {
            setValue('status', 'draft');
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
            setValue('status', 'published');
            handleSubmit(onSubmit)();
          }}
        >
          {initialData.status === 'published' ? 'Update Published Post' : 'Publish'}
        </Button>
      </div>
    </form>
  );
}
