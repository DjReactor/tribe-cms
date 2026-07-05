'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
  const pb = await getPocketBaseClient();
  return pb.collection('settings').getFirstListItem('').catch(async () => {
    // settings has createRule null (superuser-only) — seed normally creates the
    // singleton, so this fallback needs the admin client.
    const admin = await getAdminPocketBase();
    return admin.collection('settings').create({});
  });
}

export async function updateSettings(id: string, data: any) {
  try {
    const user = await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('settings').update(id, data);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
