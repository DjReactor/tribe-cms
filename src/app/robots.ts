import { MetadataRoute } from 'next';
import { getSeoSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
  const seoSettings = await getSeoSettings();

  const disallowPaths = ['/dashboard/', '/login', '/api/', '/_next/'];

  // Respect noindex_blog flag — disallow crawling the entire blog directory
  if (seoSettings?.noindex_blog) {
    disallowPaths.push('/blog/');
  }

  // Note: noindex_service_areas is enforced via per-page robots metadata, not here,
  // because service areas use dynamic root-level slugs with no common path prefix.

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: disallowPaths,
    },
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-images.xml`,
    ],
  };
}
