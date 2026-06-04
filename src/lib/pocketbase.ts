import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

export async function getPocketBaseClient() {
  const url = process.env['PB_URL'] || 'http://127.0.0.1:8090';
  const pb = new PocketBase(url);
  
  try {
    const cookieStore = await cookies();
    const pbAuth = cookieStore.get('pb_auth');
    if (pbAuth) {
      // In PocketBase, loadFromCookie typically takes the entire cookie string
      // but if we saved just the auth string, we might need to recreate it.
      // Assuming we saved the export to the cookie directly:
      pb.authStore.loadFromCookie(`pb_auth=${pbAuth.value}`);
    }
  } catch (error) {
    // silently ignore if cookies aren't available (e.g. in some server contexts)
  }
  
  return pb;
}
