import { NextResponse } from 'next/server';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { authenticateWebhook } from '@/lib/webhook-auth';
import { revalidatePath } from 'next/cache';
export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET || '';

  const payload = await req.text();

  if (!(await authenticateWebhook(req, payload, secret))) {
    return NextResponse.json({ error: 'Unauthorized: Invalid signature or missing API key' }, { status: 401 });
  }

  try {
    const data = JSON.parse(payload);
    
    if (!data.title || !data.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pb = await getPocketBaseClient();
    
    // Auth as superuser for webhook operations
    const email = process.env.PB_ADMIN_EMAIL;
    const password = process.env.PB_ADMIN_PASSWORD;
    if (email && password) {
      try {
        await pb.collection('_superusers').authWithPassword(email, password);
      } catch (e) {
        // Ignore fallback
      }
    }
    
    // Create blog post
    const post = await pb.collection('blog_posts').create({
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      content: data.content,
      excerpt: data.excerpt || '',
      status: data.status || 'published',
      author_type: 'manual',
      published_at: new Date().toISOString(),
      seo_title: data.seo_title || data.title,
      seo_description: data.seo_description || data.excerpt || '',
    });

    revalidatePath('/dashboard/blog');
    revalidatePath('/blog');
    revalidatePath('/'); // Just in case it appears on the home page later

    return NextResponse.json({ success: true, post: { id: post.id } });
  } catch (error: any) {
    console.error('Blog Webhook Error:', error);
    return NextResponse.json({ error: error.response || error.message }, { status: 500 });
  }
}