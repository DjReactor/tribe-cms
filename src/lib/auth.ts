import { cookies } from 'next/headers';
import { getPocketBaseClient } from './pocketbase';

export async function verifySession() {
  const pb = await getPocketBaseClient();
  if (pb.authStore.isValid && pb.authStore.model) {
    if (pb.authStore.isSuperuser || pb.authStore.isAdmin || !pb.authStore.model.collectionId) {
      // If it's a Superuser/Admin record, map it to agency_admin for the Next.js frontend
      return { ...pb.authStore.model, role: 'agency_admin', id: pb.authStore.model.id || 'admin' };
    }
    return pb.authStore.model;
  }
  return null;
}

export async function requireAuth() {
  const user = await verifySession();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAgencyAdmin() {
  const user = await verifySession();
  if (!user || user.role !== 'agency_admin') {
    throw new Error('Forbidden: Requires Agency Admin');
  }
  return user;
}
