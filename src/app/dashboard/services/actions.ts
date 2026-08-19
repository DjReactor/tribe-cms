'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Service } from '@/types/index';
import { indexServices, getServicePath, validateServiceParent } from '@/lib/services';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  parent: z.string().optional().or(z.literal('')),
  short_description: z.string().max(160, 'Max 160 characters').optional().or(z.literal('')),
  icon: z.string().optional(),
  cover_image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  page_content: z.any().optional(), 
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
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


/** Every service, active or not - hierarchy validation must see hidden ones. */
async function allServices(): Promise<Service[]> {
  const pb = await getPocketBaseClient();
  return pb.collection('services').getFullList<Service>({ sort: 'sort_order' }).catch(() => []);
}

/**
 * Public URLs resolve on the last path segment, so re-parenting and ancestor
 * renames self-heal (the route 301s to the recomputed canonical path). The one
 * case that genuinely strands a URL is a service changing its OWN slug - that
 * gets a redirect row.
 *
 * `redirects` is superuser-only per the write-path rule, hence the admin client.
 */
async function syncSlugRedirect(oldPath: string, newPath: string) {
  if (!oldPath || oldPath === newPath) return;
  try {
    const admin = await getAdminPocketBase();
    const existing = await admin.collection('redirects')
      .getFirstListItem(`from_path="${oldPath}"`).catch(() => null);
    if (existing) {
      await admin.collection('redirects').update(existing.id, { to_path: newPath, type: '301' });
    } else {
      await admin.collection('redirects').create({
        from_path: oldPath,
        to_path: newPath,
        type: '301',
        note: 'Auto-created when a service slug changed',
      });
    }
  } catch {
    // A missing redirect is a broken old link, not a failed save.
  }
}

/**
 * Redirect rules are applied in middleware *before* routing, so a stale rule
 * aimed at a path a service now occupies would shadow the real page. Clear any
 * rule pointing at this service's own path whenever it takes that path.
 */
async function clearRedirectShadowing(path: string) {
  try {
    const admin = await getAdminPocketBase();
    const shadow = await admin.collection('redirects')
      .getFirstListItem(`from_path="${path}"`).catch(() => null);
    if (shadow) await admin.collection('redirects').delete(shadow.id);
  } catch {
    // Non-fatal.
  }
}

/** Service pages are dynamic under one catch-all segment - blow the lot away. */
function revalidateServices() {
  revalidatePath('/dashboard/services');
  revalidatePath('/services');
  revalidatePath('/services/[...slug]', 'page');
  revalidatePath('/sitemap.xml');
}

export async function createService(data: any) {
  try {
    await requireAuth();
    const parsedData = serviceSchema.parse(data);
    const pb = await getPocketBaseClient();

    const services = await allServices();
    const parentError = validateServiceParent(parsedData.parent || '', null, services);
    if (parentError) return { success: false, error: parentError };

    const record = await pb.collection('services').create({ ...parsedData, sort_order: 999 });

    const created = record as unknown as Service;
    await clearRedirectShadowing(getServicePath(created, indexServices([...services, created])));

    revalidateServices();
    return { success: true, id: record.id };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateService(id: string, data: any) {
  try {
    await requireAuth();
    const parsedData = serviceSchema.parse(data);
    const pb = await getPocketBaseClient();

    const services = await allServices();
    const parentError = validateServiceParent(parsedData.parent || '', id, services);
    if (parentError) return { success: false, error: parentError };

    const before = services.find((svc) => svc.id === id);
    const oldPath = before ? getServicePath(before, indexServices(services)) : '';

    await pb.collection('services').update(id, parsedData);

    const after = services.map((svc) => (svc.id === id ? ({ ...svc, ...parsedData } as Service) : svc));
    const newPath = getServicePath(after.find((svc) => svc.id === id)!, indexServices(after));

    // Only an own-slug change strands a URL; a parent change is self-healing.
    if (before && before.slug !== parsedData.slug) await syncSlugRedirect(oldPath, newPath);
    await clearRedirectShadowing(newPath);

    revalidateServices();
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
    
    revalidateServices();
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
    revalidateServices();
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
    revalidateServices();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
