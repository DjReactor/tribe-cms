import PocketBase from 'pocketbase';

let adminPbInstance: PocketBase | null = null;

export async function getAdminPocketBase() {
  // Check if we have a valid auth token that hasn't expired
  if (adminPbInstance && adminPbInstance.authStore.isValid) {
    return adminPbInstance;
  }

  const url = process.env['PB_URL'] || 'http://127.0.0.1:8090';
  const pb = new PocketBase(url);
  pb.autoCancellation(false);

  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (email && password) {
    try {
      await pb.admins.authWithPassword(email, password);
      adminPbInstance = pb;
    } catch (e) {
      console.error('Failed to auth as PocketBase admin', e);
    }
  }

  return pb;
}
