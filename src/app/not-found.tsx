import type { Metadata } from "next";
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect, permanentRedirect } from 'next/navigation';
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getAdminPocketBase } from "@/lib/pocketbase-admin";

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

// Asset-like requests (probes, stale image links) are noise — don't log them.
const IGNORED_PATH_RE = /\.(ico|png|jpe?g|gif|svg|webp|avif|css|js|map|json|txt|xml|woff2?|ttf|eot|php|asp|aspx|env)$/i;

function isTrackablePath(pathname: string): boolean {
  return (
    pathname.startsWith('/') &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !IGNORED_PATH_RE.test(pathname)
  );
}

/**
 * DB-driven redirects + 404 logging. Every unmatched public URL lands here,
 * which makes this the one place with both the request path (via the
 * middleware's x-pathname header) and PocketBase access. Returns the redirect
 * destination if the path matches a managed redirect, otherwise records the
 * miss in seo_404_log (upsert by path, bumping hit_count/last_seen).
 */
async function checkRedirectAndLog404(
  pathname: string,
  referrer: string
): Promise<{ to: string; permanent: boolean } | null> {
  if (!isTrackablePath(pathname)) return null;
  try {
    const pb = await getAdminPocketBase();

    const rule = await pb
      .collection('redirects')
      .getFirstListItem(pb.filter('from_path = {:p}', { p: pathname }))
      .catch(() => null);

    if (rule && rule.to_path) {
      pb.collection('redirects')
        .update(rule.id, { hit_count: (rule.hit_count || 0) + 1 })
        .catch(() => {});
      return { to: rule.to_path, permanent: rule.type !== '302' };
    }

    const existing = await pb
      .collection('seo_404_log')
      .getFirstListItem(pb.filter('path = {:p}', { p: pathname }))
      .catch(() => null);

    if (existing) {
      await pb.collection('seo_404_log').update(existing.id, {
        hit_count: (existing.hit_count || 0) + 1,
        last_seen: new Date().toISOString(),
        referrer: referrer || existing.referrer || '',
        resolved: false,
      });
    } else {
      await pb.collection('seo_404_log').create({
        path: pathname,
        referrer,
        hit_count: 1,
        last_seen: new Date().toISOString(),
        resolved: false,
      });
    }
  } catch {
    // Tracking must never break the 404 page itself.
  }
  return null;
}

export default async function NotFound() {
  // headers() is called outside any try/catch: during build it throws Next's
  // bailout sentinel, which must propagate for the route to go dynamic.
  const headerList = await headers();
  const redirectRule = await checkRedirectAndLog404(
    headerList.get('x-pathname') || '',
    headerList.get('referer') || ''
  );
  if (redirectRule) {
    if (redirectRule.permanent) permanentRedirect(redirectRule.to);
    redirect(redirectRule.to);
  }

  try {
    const settings = await getSettings();
    const template = await loadTemplate(settings.active_template);

    if (template.Custom404Page) {
      const businessInfo = await getBusinessInfo();
      const Custom404PageComponent = template.Custom404Page;
      return (
        <Custom404PageComponent
          businessInfo={businessInfo}
          config={settings.template_config || {}}
        />
      );
    }
  } catch {}

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h2 className="text-4xl font-bold mb-4">404 - Not Found</h2>
      <p className="mb-8 text-gray-600">The page you are looking for does not exist.</p>
      <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded">
        Return Home
      </Link>
    </div>
  );
}
