'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * States are a picklist, not a place with a page — they exist so a service area
 * can render "Santa Rosa, CA" and so a project can say which state it was in.
 * There are no public routes here.
 *
 * `states` carries `@request.auth.id != ''` write rules (migration 2030000000),
 * so the cookie client is the correct write path, and the section sits in
 * Business Info: the BO owns it.
 */

const stateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(10, 'Max 10 characters'),
  is_active: z.boolean(),
});

/** The relations that point at a state are optional, so nothing here cascades. */
function revalidateStates() {
  revalidatePath('/dashboard/states');
  revalidatePath('/dashboard/service-areas');
  revalidatePath('/', 'layout');
}

export async function getStates() {
  const pb = await getPocketBaseClient();
  return pb.collection('states').getFullList({ sort: 'sort_order,name' }).catch(() => []);
}

export async function createState(data: unknown) {
  try {
    await requireAuth();
    const parsed = stateSchema.parse(data);
    const pb = await getPocketBaseClient();
    const record = await pb.collection('states').create({
      ...parsed,
      code: parsed.code.toUpperCase(),
      sort_order: 999,
    });
    revalidateStates();
    return { success: true, id: record.id };
  } catch (error: any) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateState(id: string, data: unknown) {
  try {
    await requireAuth();
    const parsed = stateSchema.parse(data);
    const pb = await getPocketBaseClient();
    await pb.collection('states').update(id, { ...parsed, code: parsed.code.toUpperCase() });
    revalidateStates();
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateStatesOrder(items: { id: string; sort_order: number }[]) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    for (const item of items) {
      await pb.collection('states').update(item.id, { sort_order: item.sort_order });
    }
    revalidateStates();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleStateActive(id: string, is_active: boolean) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('states').update(id, { is_active });
    revalidateStates();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteState(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('states').delete(id);
    revalidateStates();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
