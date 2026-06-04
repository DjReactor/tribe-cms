import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const pb = new PocketBase(process.env['PB_URL'] || 'http://127.0.0.1:8090');
    
    await pb.collection('users').authWithPassword(email, password);
    
    const response = NextResponse.json({ success: true, user: pb.authStore.model });
    
    // Export standard pocketbase auth cookie format
    response.cookies.set('pb_auth', pb.authStore.exportToCookie({ httpOnly: true, secure: process.env.NODE_ENV === 'production' }).split('pb_auth=')[1] || '');
    
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}