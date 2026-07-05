import { getSeoSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/**
 * robots.txt is served from a route handler (not the robots.ts metadata file)
 * so the BO-editable `custom_robots_rules` free-text block from SEO settings
 * can be appended verbatim — the typed MetadataRoute.Robots API can't express
 * arbitrary rules.
 */
export async function GET() {
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
  const seoSettings = await getSeoSettings();

  const disallowPaths = ['/dashboard/', '/login', '/api/', '/_next/'];

  // Respect noindex_blog flag — disallow crawling the entire blog directory.
  // (noindex_service_areas is enforced via per-page robots metadata instead,
  // because service areas use dynamic root-level slugs with no path prefix.)
  if (seoSettings?.noindex_blog) {
    disallowPaths.push('/blog/');
  }

  const lines = [
    'User-agent: *',
    'Allow: /',
    ...disallowPaths.map((p) => `Disallow: ${p}`),
  ];

  const customRules = seoSettings?.custom_robots_rules?.trim();
  if (customRules) {
    lines.push('', customRules);
  }

  lines.push(
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Sitemap: ${baseUrl}/sitemap-images.xml`,
    ''
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain' },
  });
}
