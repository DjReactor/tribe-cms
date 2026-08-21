'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { normalizeSlug, SLUG_UNUSABLE_MESSAGE } from '@/lib/slug';

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().max(200, 'Max 200 characters').optional().or(z.literal('')),
  content: z.any().optional(),
  status: z.enum(['draft', 'published']),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  focus_keyword: z.string().optional().or(z.literal('')),
  noindex: z.boolean().default(false),
  canonical_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export async function getBlogPosts() {
  const pb = await getPocketBaseClient();
  return pb.collection('blog_posts').getFullList({
    sort: '-published_at',
  }).catch(() => []);
}

export async function getBlogPost(id: string) {
  const pb = await getPocketBaseClient();
  return pb.collection('blog_posts').getOne(id).catch(() => null);
}

export async function createBlogPost(data: any) {
  try {
    await requireAuth();
    const parsedData = blogSchema.parse(data);
    
    if (parsedData.status === 'published') {
      (parsedData as any).published_at = new Date().toISOString();
    }
    (parsedData as any).author_type = 'manual';

    // A slug is a URL segment; normalise it server-side however it was typed.
    // See src/lib/slug.ts for why storing the raw string breaks the page.
    const slug = normalizeSlug(parsedData.slug);
    if (!slug) return { success: false, error: SLUG_UNUSABLE_MESSAGE };
    parsedData.slug = slug;
    
    const pb = await getPocketBaseClient();
    const record = await pb.collection('blog_posts').create(parsedData);
    
    revalidatePath('/dashboard/blog');
    revalidatePath('/blog');
    
    return { success: true, id: record.id };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateBlogPost(id: string, data: any) {
  try {
    await requireAuth();
    const parsedData = blogSchema.parse(data);

    // A slug is a URL segment; normalise it server-side however it was typed.
    // See src/lib/slug.ts for why storing the raw string breaks the page.
    const updateSlug = normalizeSlug(parsedData.slug);
    if (!updateSlug) return { success: false, error: SLUG_UNUSABLE_MESSAGE };
    parsedData.slug = updateSlug;
    
    // Auto-set published_at when first published
    if (parsedData.status === 'published') {
      (parsedData as any).published_at = new Date().toISOString();
    }
    
    const pb = await getPocketBaseClient();
    await pb.collection('blog_posts').update(id, parsedData);
    
    revalidatePath('/dashboard/blog');
    revalidatePath('/blog');
    revalidatePath(`/blog/${parsedData.slug}`);
    revalidatePath('/sitemap.xml');
    
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function deleteBlogPost(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('blog_posts').delete(id);
    revalidatePath('/dashboard/blog');
    revalidatePath('/blog');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
