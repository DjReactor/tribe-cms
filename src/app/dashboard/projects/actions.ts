'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  summary: z.string().min(1, 'Summary is required').max(300),
  status: z.enum(['planned', 'in_progress', 'completed']),
  featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
  service_ids: z.array(z.string()).default([]),
  location_city: z.string().optional().or(z.literal('')),
  location_state: z.string().optional().or(z.literal('')),
  completed_at: z.string().optional().or(z.literal('')),
  cover_image_url: z.string().optional().or(z.literal('')),
  gallery_media_ids: z.array(z.string()).default([]),
  content_problem: z.string().optional().or(z.literal('')),
  content_solution: z.string().optional().or(z.literal('')),
  content_process: z.string().optional().or(z.literal('')),
  content_outcome: z.string().optional().or(z.literal('')),
  testimonial_enabled: z.boolean().default(false),
  testimonial_quote: z.string().optional().or(z.literal('')),
  testimonial_client: z.string().optional().or(z.literal('')),
  testimonial_client_info: z.string().optional().or(z.literal('')),
  testimonial_rating: z.coerce.number().min(1).max(5).optional(),
  testimonial_client_image_url: z.string().optional().or(z.literal('')),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  canonical_url: z.string().url().optional().or(z.literal('')),
  og_image_url: z.string().optional().or(z.literal('')),
  noindex: z.boolean().default(false),
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

export async function getProjects() {
  try {
    const pb = await getPocketBaseClient();
    const records = await pb.collection('projects').getFullList({
      sort: 'sort_order',
      expand: 'services,gallery_media',
    });
    return JSON.parse(JSON.stringify(records));
  } catch {
    return [];
  }
}

export async function getProject(id: string) {
  if (id === 'new') {
    return {
      id: 'new',
      title: '',
      slug: '',
      summary: '',
      status: 'planned',
      featured: false,
      is_active: true,
      sort_order: 0,
      service_ids: [],
      location_city: '',
      location_state: '',
      completed_at: '',
      cover_image_url: '',
      gallery_media_ids: [],
      content_problem: '',
      content_solution: '',
      content_process: '',
      content_outcome: '',
      testimonial_enabled: false,
      testimonial_quote: '',
      testimonial_client: '',
      testimonial_client_info: '',
      testimonial_rating: undefined,
      testimonial_client_image_url: '',
      seo_title: '',
      seo_description: '',
      canonical_url: '',
      og_image_url: '',
      noindex: false,
    };
  }
  try {
    const pb = await getPocketBaseClient();
    const record = await pb.collection('projects').getOne(id, {
      expand: 'services,gallery_media',
    });
    return JSON.parse(JSON.stringify(record));
  } catch {
    return null;
  }
}

export async function createProject(data: any) {
  try {
    await requireAuth();
    const parsed = projectSchema.parse(data);
    const { service_ids, gallery_media_ids, testimonial_enabled, ...rest } = parsed;
    const flatData = {
      ...rest,
      services: service_ids,
      gallery_media: gallery_media_ids,
      // When the testimonial is disabled, clear stale text so it can't render as an empty/orphaned blockquote.
      ...(testimonial_enabled ? {} : {
        testimonial_quote: '',
        testimonial_client: '',
        testimonial_client_info: '',
        testimonial_client_image_url: '',
      }),
    };
    const pb = await getPocketBaseClient();
    const record = await pb.collection('projects').create(flatData);
    revalidatePath('/dashboard/projects');
    revalidatePath('/projects');
    revalidatePath('/sitemap.xml');
    return { success: true, id: record.id };
  } catch (error: any) {
    if (error?.constructor?.name === 'ZodError') {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateProject(id: string, data: any) {
  try {
    await requireAuth();
    const parsed = projectSchema.parse(data);
    const { service_ids, gallery_media_ids, testimonial_enabled, ...rest } = parsed;
    const flatData = {
      ...rest,
      services: service_ids,
      gallery_media: gallery_media_ids,
      // When the testimonial is disabled, clear stale text so it can't render as an empty/orphaned blockquote.
      ...(testimonial_enabled ? {} : {
        testimonial_quote: '',
        testimonial_client: '',
        testimonial_client_info: '',
        testimonial_client_image_url: '',
      }),
    };
    const pb = await getPocketBaseClient();
    await pb.collection('projects').update(id, flatData);
    revalidatePath('/dashboard/projects');
    revalidatePath('/projects');
    revalidatePath(`/projects/${rest.slug}`);
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error: any) {
    if (error?.constructor?.name === 'ZodError') {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function deleteProject(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('projects').delete(id);
    revalidatePath('/dashboard/projects');
    revalidatePath('/projects');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProjectsOrder(items: { id: string; sort_order: number }[]) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await Promise.all(
      items.map((item) => pb.collection('projects').update(item.id, { sort_order: item.sort_order }))
    );
    revalidatePath('/dashboard/projects');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleProjectActive(id: string, is_active: boolean) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('projects').update(id, { is_active });
    revalidatePath('/dashboard/projects');
    revalidatePath('/projects');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
