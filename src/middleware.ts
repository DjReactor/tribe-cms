import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

type RedirectRule = { id: string; from_path: string; to_path: string; type: string }

// Middleware can't query SQLite PocketBase, so redirect rules come from the
// internal API (admin PB behind INTERNAL_SECRET) and are cached in module
// memory. Self-hosted `next start` keeps this process-local cache warm, so
// the per-request cost is a plain array lookup.
const REDIRECT_CACHE_TTL_MS = 30_000
let redirectCache: { rules: RedirectRule[]; fetchedAt: number } = { rules: [], fetchedAt: 0 }

function internalBase(request: NextRequest): string {
  const port = process.env.PORT
  return port ? `http://127.0.0.1:${port}` : request.nextUrl.origin
}

async function getRedirectRules(request: NextRequest): Promise<RedirectRule[]> {
  const secret = process.env.INTERNAL_SECRET
  if (!secret) return []

  const now = Date.now()
  if (now - redirectCache.fetchedAt < REDIRECT_CACHE_TTL_MS) {
    return redirectCache.rules
  }
  // Stamp first so a failing upstream doesn't get hammered on every request.
  redirectCache.fetchedAt = now
  try {
    const res = await fetch(`${internalBase(request)}/api/internal/redirects`, {
      headers: { authorization: `Bearer ${secret}` },
    })
    if (res.ok) {
      const data = await res.json()
      redirectCache.rules = Array.isArray(data.rules) ? data.rules : []
    }
  } catch {
    // Keep serving the previous rule set.
  }
  return redirectCache.rules
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // 1. Dashboard Auth Guard
  if (pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('pb_auth');
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. PocketBase Image Proxy
  if (pathname.startsWith('/api/files/')) {
    const pbUrl = process.env.PB_URL || 'http://127.0.0.1:8090';
    const destinationUrl = `${pbUrl}${pathname}${url.search}`;
    return NextResponse.rewrite(new URL(destinationUrl));
  }

  // 3. Redirect Manager — BO-managed 301/302s, applied before routing so
  // they work for any public URL (and take precedence over live pages).
  if (
    request.method === 'GET' &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next')
  ) {
    const rules = await getRedirectRules(request);
    if (rules.length > 0) {
      const normalized = pathname.length > 1 && pathname.endsWith('/')
        ? pathname.slice(0, -1)
        : pathname;
      const rule = rules.find((r) => r.from_path === normalized);
      if (rule && rule.to_path !== normalized) {
        event.waitUntil(
          fetch(`${internalBase(request)}/api/internal/redirects`, {
            method: 'POST',
            headers: {
              authorization: `Bearer ${process.env.INTERNAL_SECRET}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({ id: rule.id }),
          }).catch(() => {})
        );
        const destination = rule.to_path.startsWith('http')
          ? rule.to_path
          : new URL(rule.to_path, request.url);
        return NextResponse.redirect(destination, rule.type === '302' ? 302 : 301);
      }
    }
  }

  // 4. Template Preview Mode
  // If `tribe_preview_template` cookie is present, pass it as a header
  // so the layout/template-loader can pick it up.
  const previewTemplate = request.cookies.get('tribe_preview_template');
  if (previewTemplate && !pathname.startsWith('/dashboard') && !pathname.startsWith('/api')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-preview-template', previewTemplate.value);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
