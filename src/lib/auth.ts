import { cookies } from 'next/headers';
import { getPocketBaseClient } from './pocketbase';

export async function verifySession() {
  const pb = await getPocketBaseClient();
  if (pb.authStore.isValid && pb.authStore.record) {
    if (pb.authStore.isSuperuser || !pb.authStore.record.collectionId) {
      // If it's a Superuser/Admin record, map it to agency_admin for the Next.js frontend
      return { ...pb.authStore.record, role: 'agency_admin', id: pb.authStore.record.id || 'admin' };
    }
    return pb.authStore.record;
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
