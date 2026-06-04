const fs = require('fs');
const path = require('path');

const baseDir = 'src/app/api';

const routes = {
  'auth/login/route.ts': `import { NextResponse } from 'next/server';
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
}`,

  'auth/logout/route.ts': `import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('pb_auth');
  return response;
}`,

  'webhooks/blog/route.ts': `import { NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import crypto from 'crypto';

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  const pb = await getAdminPocketBase();
  const settingsList = await pb.collection('settings').getFullList(1).catch(() => []);
  const secret = settingsList[0]?.blog_webhook_secret;

  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  if (signature !== digest) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const data = JSON.parse(payload);
    // Stub: create blog post in PB
    await pb.collection('blog_posts').create({
      title: data.title,
      slug: data.slug,
      content: data.content,
      status: 'draft',
      author_type: 'auto'
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}`,

  'webhooks/retell/route.ts': `import { NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';

export async function POST(request: Request) {
  const payload = await request.json();
  const pb = await getAdminPocketBase();

  try {
    // Stub: create call log in PB
    if (payload.call) {
      await pb.collection('ai_call_logs').create({
        call_id: payload.call.call_id,
        caller_number: payload.call.from_number,
        transcript: payload.call.transcript,
        summary: payload.call.call_analysis?.call_summary,
        duration: payload.call.duration_ms,
        sentiment: payload.call.call_analysis?.user_sentiment
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}`
};

for (const [route, code] of Object.entries(routes)) {
  const fullPath = path.join(baseDir, route);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, code);
}
console.log('API routes generated.');
