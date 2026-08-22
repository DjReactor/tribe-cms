'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { isCatalogKind, type CatalogKind } from '@/lib/catalog-kinds';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { normalizeSlug, SLUG_UNUSABLE_MESSAGE } from '@/lib/slug';

// Shared server actions for the four catalog datatypes (types / brands /
// certifications / awards). `kind` is validated against the whitelist before
// it is ever used as a collection name.

const catalogItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().or(z.literal('')),
  image_url: z.string().optional().or(z.literal('')),
  details: z.any().optional(),
  is_active: z.boolean(),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  noindex: z.boolean(),
});

function assertKind(kind: string): asserts kind is CatalogKind {
  if (!isCatalogKind(kind)) throw new Error(`Unknown catalog kind: ${kind}`);
}

function revalidateCatalog(kind: CatalogKind, slug?: string) {
  // Every one of these records is passed to the shared (public) layout
  // (nav, JSON-LD, global props), so a change affects every public page,
  // not just this section's routes. Public pages are cached, so scope the
  // invalidation to the layout rather than enumerating routes that drift.
  revalidatePath('/', 'layout');
  revalidatePath(`/dashboard/${kind}`);
  revalidatePath(`/${kind}`);
  if (slug) revalidatePath(`/${kind}/${slug}`);
  revalidatePath('/sitemap.xml');
}

export async function getCatalogItems(kind: string) {
  assertKind(kind);
  const pb = await getPocketBaseClient();
  return pb.collection(kind).getFullList({ sort: 'sort_order' }).catch(() => []);
}

export async function getCatalogItem(kind: string, id: string) {
  assertKind(kind);
  const pb = await getPocketBaseClient();
  return pb.collection(kind).getOne(id).catch(() => null);
}

export async function createCatalogItem(kind: string, data: any) {
  try {
    assertKind(kind);
    await requireAuth();
    const parsed = catalogItemSchema.parse(data);
    const pb = await getPocketBaseClient();
    // A slug is a URL segment; normalise it server-side however it was typed.
    // See src/lib/slug.ts for why storing the raw string breaks the page.
    const slug = normalizeSlug(parsed.slug);
    if (!slug) return { success: false, error: SLUG_UNUSABLE_MESSAGE };

    const record = await pb.collection(kind).create({ ...parsed, slug, sort_order: 999 });
    revalidateCatalog(kind, parsed.slug);
    return { success: true, id: record.id };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateCatalogItem(kind: string, id: string, data: any) {
  try {
    assertKind(kind);
    await requireAuth();
    const parsed = catalogItemSchema.parse(data);
    const pb = await getPocketBaseClient();
    // A slug is a URL segment; normalise it server-side however it was typed.
    // See src/lib/slug.ts for why storing the raw string breaks the page.
    const slug = normalizeSlug(parsed.slug);
    if (!slug) return { success: false, error: SLUG_UNUSABLE_MESSAGE };

    await pb.collection(kind).update(id, { ...parsed, slug });
    revalidateCatalog(kind, parsed.slug);
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateCatalogOrder(kind: string, items: { id: string; sort_order: number }[]) {
  try {
    assertKind(kind);
    await requireAuth();
    const pb = await getPocketBaseClient();
    for (const item of items) {
      await pb.collection(kind).update(item.id, { sort_order: item.sort_order });
    }
    revalidateCatalog(kind);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleCatalogItemActive(kind: string, id: string, is_active: boolean) {
  try {
    assertKind(kind);
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection(kind).update(id, { is_active });
    revalidateCatalog(kind);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCatalogItem(kind: string, id: string) {
  try {
    assertKind(kind);
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection(kind).delete(id);
    revalidateCatalog(kind);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
