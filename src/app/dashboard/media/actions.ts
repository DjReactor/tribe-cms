'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

export async function getMedia() {
  noStore();
  const pb = await getPocketBaseClient();
  try {
    const records = await pb.collection('media').getFullList({
      sort: '-sort_order',
      requestKey: null,
      fetch: (url, config) => fetch(url, { ...config, cache: 'no-store' })
    });
    return JSON.parse(JSON.stringify(records));
  } catch (error) {
    console.error('getMedia Error:', error);
    return [];
  }
}

export async function uploadMedia(formData: FormData) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    
    await pb.collection('media').create(formData);
    revalidatePath('/dashboard', 'layout');
    // Media renders in the public homepage gallery and on service pages, so a
    // dashboard-only invalidation left the live site serving stale HTML under ISR.
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMedia(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('media').delete(id);
    revalidatePath('/dashboard', 'layout');
    // Media renders in the public homepage gallery and on service pages, so a
    // dashboard-only invalidation left the live site serving stale HTML under ISR.
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMedia(id: string, data: any) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('media').update(id, data);
    revalidatePath('/dashboard', 'layout');
    // Media renders in the public homepage gallery and on service pages, so a
    // dashboard-only invalidation left the live site serving stale HTML under ISR.
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
