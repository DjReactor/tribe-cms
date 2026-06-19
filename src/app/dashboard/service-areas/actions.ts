'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const serviceAreaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  custom_h1: z.string().optional().or(z.literal('')),
  custom_intro: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  page_content: z.any().optional(),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  focus_keyword: z.string().optional().or(z.literal('')),
  noindex: z.boolean().default(false),
  geo_latitude: z.string().optional().or(z.literal('')),
  geo_longitude: z.string().optional().or(z.literal('')),
});

export async function getServiceAreas() {
  const pb = await getPocketBaseClient();
  return pb.collection('service_areas').getFullList({
    sort: 'sort_order',
  }).catch(() => []);
}

export async function getServiceArea(id: string) {
  const pb = await getPocketBaseClient();
  return pb.collection('service_areas').getOne(id).catch(() => null);
}

export async function createServiceArea() {
  await requireAuth();
  const pb = await getPocketBaseClient();
  
  const record = await pb.collection('service_areas').create({
    name: 'New Service Area',
    slug: `new-area-${Date.now()}`,
    is_active: false,
    sort_order: 999
  });
  
  revalidatePath('/dashboard/service-areas');
  return record.id;
}

export async function updateServiceArea(id: string, data: any) {
  try {
    await requireAuth();
    const parsedData = serviceAreaSchema.parse(data);
    const pb = await getPocketBaseClient();
    
    await pb.collection('service_areas').update(id, parsedData);
    
    revalidatePath('/dashboard/service-areas');
    revalidatePath(`/${parsedData.slug}`);
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
    
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateServiceAreasOrder(items: { id: string; sort_order: number }[]) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    
    for (const item of items) {
      await pb.collection('service_areas').update(item.id, { sort_order: item.sort_order });
    }
    
    revalidatePath('/dashboard/service-areas');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleServiceAreaActive(id: string, is_active: boolean) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('service_areas').update(id, { is_active });
    revalidatePath('/dashboard/service-areas');
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteServiceArea(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('service_areas').delete(id);
    revalidatePath('/dashboard/service-areas');
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
