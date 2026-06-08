'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const businessInfoSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  business_type: z.string().min(1, 'Business type is required'),
  tagline: z.string().optional(),
  short_description: z.string().max(300, 'Description max 300 chars').optional(),
  social_facebook: z.string().url('Invalid URL').optional().or(z.literal('')),
  social_instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
  social_google: z.string().url('Invalid URL').optional().or(z.literal('')),
  niche_attributes: z.record(z.string()).optional(),
});

export async function updateBusinessInfo(data: any) {
  try {
    // SECURITY: Ensure user is authenticated before allowing mutation
    await requireAuth();

    // SECURITY: Validate payload
    const parsedData = businessInfoSchema.parse(data);

    const pb = await getPocketBaseClient();
    let recordId = null;
    try {
      const record = await pb.collection('business_info').getFirstListItem('');
      recordId = record.id;
    } catch (e) {
      // Not found
    }
    
    if (recordId) {
      await pb.collection('business_info').update(recordId, parsedData);
    } else {
      await pb.collection('business_info').create(parsedData);
    }
    
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateSeoSettings(data: any) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    let recordId = null;
    try {
      const record = await pb.collection('seo_settings').getFirstListItem('');
      recordId = record.id;
    } catch (e) {
      // Not found
    }

    if (recordId) {
      await pb.collection('seo_settings').update(recordId, data);
    } else {
      await pb.collection('seo_settings').create(data);
    }
    
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSiteContent(page: string, copyData: any) {
  try {
    await requireAuth();
    const pb = await getPocketBaseClient();
    const records = await pb.collection('site_content').getFullList({ filter: `page = "${page}"` }).catch(() => []);
    
    if (records.length > 0) {
      await pb.collection('site_content').update(records[0].id, { copy_data: copyData });
    } else {
      await pb.collection('site_content').create({ page, copy_data: copyData });
    }
    
    revalidatePath(`/${page === 'home' ? '' : page}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
