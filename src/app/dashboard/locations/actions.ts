'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const locationSchema = z.object({
  area_name: z.string().min(1, 'Area name is required'),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  seo_title: z.string().optional().or(z.literal('')),
  seo_description: z.string().optional().or(z.literal('')),
});

function revalidateLocations(slug?: string) {
  revalidatePath('/dashboard/locations');
  revalidatePath('/locations');
  if (slug) revalidatePath(`/locations/${slug}`);
  revalidatePath('/sitemap.xml');
}

export async function getLocations() {
  const pb = await getPocketBaseClient();
  return pb.collection('locations').getFullList({ sort: 'sort_order' }).catch(() => []);
}

export async function createLocation(data: any) {
  try {
    await requireAuth();
    const parsed = locationSchema.parse(data);
    const pb = await getPocketBaseClient();
    // Slug is derived from the area name — there is no slug field in the UI.
    const slug = slugify(parsed.area_name);
    await pb.collection('locations').create({
      ...parsed,
      slug,
      is_active: true,
      sort_order: 999,
    });
    revalidateLocations(slug);
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message };
  }
}

export async function updateLocation(id: string, data: any) {
  try {
    await requireAuth();
    const parsed = locationSchema.parse(data);
    const pb = await getPocketBaseClient();
    const slug = slugify(parsed.area_name);
    await pb.collection('locations').update(id, { ...parsed, slug });
    revalidateLocations(slug);
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message };
  }
}

export async function updateLocationsOrder(items: { id: string; sort_order: number }[]) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    for (const item of items) {
      await pb.collection('locations').update(item.id, { sort_order: item.sort_order });
    }
    revalidateLocations();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleLocationActive(id: string, is_active: boolean) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('locations').update(id, { is_active });
    revalidateLocations();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLocation(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('locations').delete(id);
    revalidateLocations();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
