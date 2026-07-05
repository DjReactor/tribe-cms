import { NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';

export const dynamic = 'force-dynamic';

// Asset-like and probe-like paths are noise, not broken links a BO can fix.
const IGNORED_PATH_RE = /\.(ico|png|jpe?g|gif|svg|webp|avif|css|js|map|json|txt|xml|ya?ml|ini|conf|bak|sql|log|gz|zip|woff2?|ttf|eot|php|asp|aspx|cgi|env)$/i;

function isTrackablePath(pathname: string): boolean {
  return (
    typeof pathname === 'string' &&
    pathname.startsWith('/') &&
    pathname.length <= 400 &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !IGNORED_PATH_RE.test(pathname)
  );
}

// Light per-IP rate limit — the beacon fires once per rendered 404 page.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (ip !== 'unknown' && !checkRateLimit(ip)) {
    return new NextResponse(null, { status: 429 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const path = payload?.path;
  if (!isTrackablePath(path)) {
    return new NextResponse(null, { status: 204 });
  }
  const referrer = typeof payload?.referrer === 'string' ? payload.referrer.slice(0, 500) : '';

  try {
    const pb = await getAdminPocketBase();
    const now = new Date().toISOString();

    const existing = await pb
      .collection('seo_404_log')
      .getFirstListItem(pb.filter('path = {:p}', { p: path }))
      .catch(() => null);

    if (existing) {
      await pb.collection('seo_404_log').update(existing.id, {
        hit_count: (existing.hit_count || 0) + 1,
        last_seen: now,
        referrer: referrer || existing.referrer || '',
        resolved: false,
      });
    } else {
      await pb
        .collection('seo_404_log')
        .create({ path, referrer, hit_count: 1, last_seen: now, resolved: false })
        .catch(async () => {
          // Lost a create race against the unique path index — fold into the winner.
          const winner = await pb
            .collection('seo_404_log')
            .getFirstListItem(pb.filter('path = {:p}', { p: path }));
          await pb.collection('seo_404_log').update(winner.id, {
            hit_count: (winner.hit_count || 0) + 1,
            last_seen: now,
            resolved: false,
          });
        });
    }
  } catch {
    // Never bubble tracking failures to the client.
  }

  return new NextResponse(null, { status: 204 });
}
