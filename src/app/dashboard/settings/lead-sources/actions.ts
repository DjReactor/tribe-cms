'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAgencyAdmin } from '@/lib/auth';
import { normalizeSourceSlug } from '@/lib/lead-sources';
import { revalidatePath } from 'next/cache';

export async function getLeadSources() {
  const pb = await getPocketBaseClient();
  return pb
    .collection('lead_sources')
    .getFullList({ sort: 'sort_order,slug' })
    .catch(() => []);
}

export async function createLeadSource(input: { label: string; slug?: string }) {
  try {
    await requireAgencyAdmin();
    const label = (input.label || '').trim();
    if (!label) return { success: false, error: 'A label is required.' };
    const slug = normalizeSourceSlug(input.slug || input.label);
    if (!slug) return { success: false, error: 'Could not derive a slug from that label.' };

    const pb = await getPocketBaseClient();
    await pb.collection('lead_sources').create({
      slug,
      label,
      is_active: true,
      needs_review: false, // manually added = already reviewed
      sort_order: 99,
    });
    revalidatePath('/dashboard/settings/lead-sources');
    return { success: true };
  } catch (error: any) {
    const msg = String(error?.message || '');
    if (msg.toLowerCase().includes('unique') || error?.status === 400) {
      return { success: false, error: 'A source with that slug already exists.' };
    }
    return { success: false, error: msg || 'Failed to create source.' };
  }
}

export async function updateLeadSource(
  id: string,
  data: { label?: string; is_active?: boolean; needs_review?: boolean; sort_order?: number },
) {
  try {
    await requireAgencyAdmin();
    const pb = await getPocketBaseClient();
    await pb.collection('lead_sources').update(id, data);
    revalidatePath('/dashboard/settings/lead-sources');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update source.' };
  }
}

/**
 * "Delete" = archive (is_active=false). Archived sources drop out of new
 * dropdowns but still resolve for historical contacts/deals, so attribution is
 * never orphaned (§4.0.1).
 */
export async function archiveLeadSource(id: string) {
  return updateLeadSource(id, { is_active: false });
}

export async function restoreLeadSource(id: string) {
  return updateLeadSource(id, { is_active: true });
}

export async function markLeadSourceReviewed(id: string) {
  return updateLeadSource(id, { needs_review: false });
}
