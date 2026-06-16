import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple mock for the redirect manager
// In production, this might be fetched from PocketBase on startup and cached,
// or we just query PB for the specific path on each request.
// For performance, Next.js middleware is edge runtime, meaning it can't use node-fetch or full PB client easily.
// A better approach for edge middleware is querying an edge API or passing it through.

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // 1. Dashboard Auth Guard
  if (pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('pb_auth');
    if (!authCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Public Route 301/302 Redirect Manager
  // Note: To truly intercept DB redirects on edge, we should make a lightweight fetch to our own API
  // or use Next.js next.config.js redirects. Since we can't reliably query SQLite PB from Edge Middleware,
  // we let the layouts/pages handle 404s, OR we could fetch a fast KV store if available.
  // We'll skip complex DB fetching in middleware to ensure fast response times.

  // 3. Template Preview Mode
  // If `tribe_preview_template` cookie is present, we could append it as a query param or header
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

  // 4. PocketBase Image Proxy
  if (pathname.startsWith('/api/files/')) {
    const pbUrl = process.env.PB_URL || 'http://127.0.0.1:8090';
    const destinationUrl = `${pbUrl}${pathname}${url.search}`;
    return NextResponse.rewrite(new URL(destinationUrl));
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
