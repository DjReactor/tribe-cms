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

  // 2. PocketBase Image Proxy
  if (pathname.startsWith('/api/files/')) {
    const pbUrl = process.env.PB_URL || 'http://127.0.0.1:8090';
    const destinationUrl = `${pbUrl}${pathname}${url.search}`;
    return NextResponse.rewrite(new URL(destinationUrl));
  }

  // Edge middleware can't query SQLite PocketBase, so DB-driven redirects and
  // 404 logging happen in not-found.tsx (server runtime). It has no access to
  // the request URL on its own, so we forward the pathname as a header.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // 3. Template Preview Mode
  // If `tribe_preview_template` cookie is present, pass it as a header
  // so the layout/template-loader can pick it up.
  const previewTemplate = request.cookies.get('tribe_preview_template');
  if (previewTemplate && !pathname.startsWith('/dashboard') && !pathname.startsWith('/api')) {
    requestHeaders.set('x-preview-template', previewTemplate.value);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
