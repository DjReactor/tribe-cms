'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  short_description: z.string().max(160, 'Max 160 characters').optional().or(z.literal('')),
  icon: z.string().optional(),
  is_active: z.boolean().default(true),
  page_content: z.any().optional(), 
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  focus_keyword: z.string().optional().or(z.literal('')),
  noindex: z.boolean().default(false),
});

export async function getServices() {
  const pb = await getPocketBaseClient();
  return pb.collection('services').getFullList({
    sort: 'sort_order',
  }).catch(() => []);
}

export async function getService(id: string) {
  const pb = await getPocketBaseClient();
  return pb.collection('services').getOne(id).catch(() => null);
}

export async function createService() {
  await requireAuth();
  const pb = await getPocketBaseClient();
  
  const record = await pb.collection('services').create({
    name: 'New Service',
    slug: `new-service-${Date.now()}`,
    is_active: false,
    sort_order: 999
  });
  
  revalidatePath('/dashboard/services');
  return record.id;
}

export async function updateService(id: string, data: any) {
  try {
    await requireAuth();
    const parsedData = serviceSchema.parse(data);
    const pb = await getPocketBaseClient();
    
    await pb.collection('services').update(id, parsedData);
    
    revalidatePath('/dashboard/services');
    revalidatePath(`/services/${parsedData.slug}`);
    revalidatePath('/services');
    revalidatePath('/sitemap.xml');
    
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateServicesOrder(items: { id: string; sort_order: number }[]) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    
    for (const item of items) {
      await pb.collection('services').update(item.id, { sort_order: item.sort_order });
    }
    
    revalidatePath('/dashboard/services');
    revalidatePath('/services');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleServiceActive(id: string, is_active: boolean) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('services').update(id, { is_active });
    revalidatePath('/dashboard/services');
    revalidatePath('/services');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteService(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('services').delete(id);
    revalidatePath('/dashboard/services');
    revalidatePath('/services');
    revalidatePath('/sitemap.xml');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
