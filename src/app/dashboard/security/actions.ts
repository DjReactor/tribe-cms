'use server';

import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { requireAuth, requireAgencyAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// api_keys is fully locked (all rules null — keys are secrets) and users has a
// self-only update rule, so everything here goes through the admin client after
// the role gate; the cookie session is only used for authorization.

export async function getApiKeys() {
  await requireAgencyAdmin();
  const pb = await getAdminPocketBase();
  
  try {
    const keys = await pb.collection('api_keys').getFullList({
      sort: '-id'
    });
    return keys;
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return [];
  }
}

export async function generateApiKey(title: string) {
  try {
    await requireAgencyAdmin();
    const pb = await getAdminPocketBase();

    const key = crypto.randomBytes(32).toString('hex');
    
    await pb.collection('api_keys').create({
      title,
      key
    });
    
    revalidatePath('/dashboard/security');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteApiKey(id: string) {
  try {
    await requireAgencyAdmin();
    const pb = await getAdminPocketBase();

    await pb.collection('api_keys').delete(id);
    
    revalidatePath('/dashboard/security');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCredentials(email?: string, password?: string) {
  try {
    const user = await requireAuth();
    // Admin client also lets the BO change their own password without PB's
    // oldPassword requirement (the form doesn't collect it).
    const pb = await getAdminPocketBase();

    let targetUserId = user.id;

    // If agency_admin, find the first user in the 'users' collection to update their credentials
    if (user.role === 'agency_admin') {
      try {
        const bo = await pb.collection('users').getFirstListItem('');
        targetUserId = bo.id;
      } catch (err) {
        throw new Error('Business owner user not found.');
      }
    }

    const data: any = {};
    if (email) data.email = email;
    if (password) {
      data.password = password;
      data.passwordConfirm = password;
    }

    if (Object.keys(data).length === 0) {
      return { success: true };
    }

    await pb.collection('users').update(targetUserId, data);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
