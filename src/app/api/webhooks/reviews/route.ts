import { NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { authenticateWebhook } from '@/lib/webhook-auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const payload = await req.text();

  if (!(await authenticateWebhook(req, payload, secret))) {
    return NextResponse.json({ error: 'Unauthorized: Invalid signature or missing API key' }, { status: 401 });
  }

  try {
    const data = JSON.parse(payload);
    
    if (!data.author_name || !data.content || !data.rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Admin client, not the cookie client. A webhook carries no `pb_auth`
    // cookie, and `testimonials.createRule` is `@request.auth.id != ''`, so the
    // cookie client was creating anonymously and every call was rejected. The
    // blog webhook authenticates as superuser inline for the same reason; this
    // one simply never did. See the write-path rule in AGENTS.md.
    const pb = await getAdminPocketBase();

    const testimonial = await pb.collection('testimonials').create({
      author_name: data.author_name,
      author_photo_url: data.author_photo_url || '',
      title: data.title || '',
      author_location: data.author_location || '',
      rating: data.rating,
      content: data.content,
      source: data.source || 'google',
      is_visible: data.rating >= 4, // Auto-approve 4+ star reviews
      sort_order: 0
    });

    // Testimonials render on the homepage, /testimonials, and in the
    // LocalBusiness JSON-LD built in the public layout. Public pages are cached
    // (ISR), so without this the review would not appear until the layout's
    // revalidate backstop expired — matching what dashboard/testimonials does.
    revalidatePath('/');
    revalidatePath('/testimonials');

    return NextResponse.json({ success: true, testimonial: { id: testimonial.id } });
  } catch (error: any) {
    console.error('Reviews Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
