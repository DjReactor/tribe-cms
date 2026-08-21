'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * The dashboard used to write `client_name` / `company` / `review_text` /
 * `is_approved`. The collection has never had any of those: it stores
 * `author_name` / `title` / `content` / `is_visible`. PocketBase drops unknown
 * keys without complaining, so "Add Testimonial" saved a row containing only
 * the rating and a sort order — no name, no quote, and `is_visible` unset,
 * which every public query filters on. The testimonial could not appear
 * anywhere, and the dashboard list read the same wrong names back, so
 * webhook-imported reviews showed as blank rows too.
 *
 * The collection is the side that was right: the reviews webhook, all six
 * public read paths and the templates already agree on these names. So the
 * form moved, not the schema.
 *
 * `company` is gone rather than renamed — `title` is the review's headline
 * (templates render it as a heading above the quote), not the reviewer's
 * employer, so there was nothing to map it onto. Nothing is lost: the field
 * never persisted a value.
 *
 * `author_location` is new to the form and is the reason this matters beyond
 * tidiness: it is what `localTestimonials` matches on to pull a nearby review
 * onto a landing page, and what the pair-readiness check counts as "a review
 * from this area". Both features were unreachable for anything authored in the
 * dashboard, because the dashboard had no way to set it.
 */
const testimonialSchema = z.object({
  author_name: z.string().min(1, 'Name is required'),
  title: z.string().optional().or(z.literal('')),
  author_location: z.string().optional().or(z.literal('')),
  rating: z.coerce.number().min(1).max(5),
  content: z.string().min(1, 'Review text is required'),
  is_visible: z.boolean().default(true),
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
      // Distinguishes a hand-entered testimonial from one the reviews webhook
      // imported, which sets its own source.
      source: 'manual',
      sort_order: 999,
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
    // Validated like create: this used to forward the caller's object straight
    // through, so a stale field name failed silently here too.
    const parsedData = testimonialSchema.parse(data);
    const pb = await getPocketBaseClient();
    await pb.collection('testimonials').update(id, parsedData);
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

export async function toggleTestimonialVisible(id: string, is_visible: boolean) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    await pb.collection('testimonials').update(id, { is_visible });
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
