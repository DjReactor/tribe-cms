'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getSeoSettings() {
  const pb = await getPocketBaseClient();
  // Assume singleton for SEO settings
  return pb.collection('seo_settings').getFirstListItem('').catch(async () => {
    // If not exists, create empty one (should be handled by seed, but safe fallback)
    const admin = await getAdminPocketBase();
    return admin.collection('seo_settings').create({});
  });
}

export async function updateSeoSettings(id: string, data: any) {
  try {
    await requireAuth();
    // Write via the admin client: these collections have superuser-only write
    // rules, and the BO dashboard session is a regular `users` record.
    const pb = await getAdminPocketBase();
    await pb.collection('seo_settings').update(id, data);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRedirects() {
  const pb = await getPocketBaseClient();
  return pb.collection('redirects').getFullList({ sort: '-id' }).catch(() => []);
}

export async function createRedirect(data: any) {
  try {
    await requireAuth();
    const pb = await getAdminPocketBase();
    await pb.collection('redirects').create({ ...data, hit_count: 0 });
    revalidatePath('/dashboard/seo/redirects');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRedirect(id: string) {
  try {
    await requireAuth();
    const pb = await getAdminPocketBase();
    await pb.collection('redirects').delete(id);
    revalidatePath('/dashboard/seo/redirects');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function get404Logs() {
  const pb = await getPocketBaseClient();
  return pb.collection('seo_404_log').getFullList({ sort: '-last_seen' }).catch(() => []);
}

export async function resolve404Log(id: string) {
  try {
    await requireAuth();
    const pb = await getAdminPocketBase();
    await pb.collection('seo_404_log').update(id, { resolved: true });
    revalidatePath('/dashboard/seo/404s');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
