'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const testimonialSchema = z.object({
  client_name: z.string().min(1, 'Name is required'),
  company: z.string().optional().or(z.literal('')),
  rating: z.coerce.number().min(1).max(5),
  review_text: z.string().min(1, 'Review text is required'),
  is_approved: z.boolean().default(true),
});

export async function getTestimonials() {
  const pb = await getPocketBaseClient();
  return pb.collection('testimonials').getFullList({
    sort: 'sort_order',
  }).catch(() => []);
}

export async function createTestimonial(data: any) {
  try {
    await requireAuth();
    const parsedData = testimonialSchema.parse(data);
    const pb = await getPocketBaseClient();
    
    await pb.collection('testimonials').create({
      ...parsedData,
      sort_order: 999
    });
    
    revalidatePath('/dashboard/testimonials');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message };
  }
}

export async function updateTestimonial(id: string, data: any) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('testimonials').update(id, data);
    revalidatePath('/dashboard/testimonials');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTestimonialsOrder(items: { id: string; sort_order: number }[]) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    
    for (const item of items) {
      await pb.collection('testimonials').update(item.id, { sort_order: item.sort_order });
    }
    
    revalidatePath('/dashboard/testimonials');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleTestimonialApproved(id: string, is_approved: boolean) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('testimonials').update(id, { is_approved });
    revalidatePath('/dashboard/testimonials');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTestimonial(id: string) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('testimonials').delete(id);
    revalidatePath('/dashboard/testimonials');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
