'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getMedia() {
  const pb = await getPocketBaseClient();
  try {
    const records = await pb.collection('media').getFullList({
      sort: '-created',
    });
    return JSON.parse(JSON.stringify(records));
  } catch (error) {
    return [];
  }
}

export async function uploadMedia(formData: FormData) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    
    await pb.collection('media').create(formData);
    revalidatePath('/dashboard/media');
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
    revalidatePath('/dashboard/media');
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
    revalidatePath('/dashboard/media');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
