import { MetadataRoute } from 'next';
import { getPublicPocketBase } from '@/lib/pocketbase-public';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { getSeoSettings } from '@/lib/settings';
import { getServices, indexServices, getServicePath } from '@/lib/services';
import { getServiceAreas, getAreaPath } from '@/lib/service-areas';
import { getLivePairs } from '@/lib/pairs';
import type { BlogPost } from '@/types';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pb = await getPublicPocketBase();
  const seoSettings = await getSeoSettings();
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000';

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services`, changeFrequency: 'weekly', priority: 0.9 },
  ];

  try {
    // `getServicePath` is the one place a service URL is built, and it is flat
    // at every tier — so each service appears once, at the same address the
    // page sets as its canonical.
    const services = await getServices();
    const servicesById = indexServices(services);
    services.forEach(service => {
      if (!service.noindex) {
        routes.push({
          url: `${baseUrl}${getServicePath(service, servicesById)}`,
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      }
    });

    // The whole area tree, at flat paths — `getAreaPath` is the one place an
    // area URL is built, so a nested area appears once, at the same address its
    // page sets as canonical.
    if (!seoSettings?.noindex_service_areas) {
      const areas = await getServiceAreas();
      areas.forEach(area => {
        if (!area.noindex) {
          routes.push({
            url: `${baseUrl}${getAreaPath(area)}`,
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      });
    }

    // Landing pages. `getLivePairs` has already dropped anything whose service
    // or area is no longer active, so what lands here is exactly what the route
    // will serve. A pair's own `noindex` is independent of its area's: the two
    // are separate pages at separate URLs.
    const livePairs = await getLivePairs();
    livePairs.forEach(({ pair, path }) => {
      if (!pair.noindex) {
        routes.push({
          url: `${baseUrl}${path}`,
          lastModified: pair.updated ? new Date(pair.updated) : undefined,
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      }
    });

    const settings = await pb.collection('settings').getFirstListItem('');

    if (settings.projects_enabled) {
      const activeProjects = await pb.collection('projects').getFullList({
        filter: 'is_active = true',
        fields: 'slug,noindex,updated',
      }).catch(() => []);

      if (activeProjects.length > 0) {
        routes.push({
          url: `${baseUrl}/projects`,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
        activeProjects.forEach((project: any) => {
          if (!project.noindex) {
            routes.push({
              url: `${baseUrl}/projects/${project.slug}`,
              lastModified: new Date(project.updated),
              changeFrequency: 'monthly',
              priority: 0.75,
            });
          }
        });
      }
    }

    if (settings.locations_enabled) {
      const activeLocations = await pb.collection('locations').getFullList({
        filter: 'is_active = true',
        fields: 'slug,noindex,updated',
      }).catch(() => []);

      if (activeLocations.length > 0) {
        routes.push({
          url: `${baseUrl}/locations`,
          changeFrequency: 'monthly',
          priority: 0.7,
        });
        activeLocations.forEach((location: any) => {
          if (!location.noindex) {
            routes.push({
              url: `${baseUrl}/locations/${location.slug}`,
              lastModified: new Date(location.updated),
              changeFrequency: 'monthly',
              priority: 0.7,
            });
          }
        });
      }
    }

    // Catalog datatypes — Brands / Certifications / Awards & Nominations.
    // Same gating as projects/locations: master switch + active records.
    const catalogSections = [
      { collection: 'brands', flag: settings.brands_enabled },
      { collection: 'certifications', flag: settings.certifications_enabled },
      { collection: 'awards', flag: settings.awards_enabled },
    ];
    for (const { collection, flag } of catalogSections) {
      if (!flag) continue;
      const activeItems = await pb.collection(collection).getFullList({
        filter: 'is_active = true',
        fields: 'slug,noindex,updated',
      }).catch(() => []);

      if (activeItems.length > 0) {
        routes.push({
          url: `${baseUrl}/${collection}`,
          changeFrequency: 'monthly',
          priority: 0.6,
        });
        activeItems.forEach((item: any) => {
          if (!item.noindex) {
            routes.push({
              url: `${baseUrl}/${collection}/${item.slug}`,
              lastModified: new Date(item.updated),
              changeFrequency: 'monthly',
              priority: 0.6,
            });
          }
        });
      }
    }

    if (settings.blog_enabled && !seoSettings?.noindex_blog) {
      routes.push({
        url: `${baseUrl}/blog`,
        changeFrequency: 'daily',
        priority: 0.8,
      });

      const posts = await pb.collection('blog_posts').getFullList<BlogPost>({ filter: 'status = "published"' });
      posts.forEach(post => {
        if (!post.noindex) {
          routes.push({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: new Date(post.updated || post.published_at),
            changeFrequency: 'monthly',
            priority: 0.7,
          });
        }
      });
    }

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // Never emit a path a redirect rule owns. Middleware applies redirects BEFORE
  // routing, so a URL that is some rule's `from_path` answers 301 rather than
  // serving the page — listing it advertises a redirect as content, and listing
  // both it and its target advertises the same page twice. Slug saves already
  // call `clearRedirectShadowing`; this is the backstop for rules typed by hand
  // in the redirects UI.
  // Read through the admin client: `redirects` is superuser-only since
  // `2090000000`, and /sitemap.xml is a public route with no session, so the
  // ordinary client reads nothing here. The `catch` would swallow that and
  // silently stop filtering, which is the exact duplicate-advertisement the
  // block exists to prevent.
  const pathOf = (url: string) => (url.startsWith(baseUrl) ? url.slice(baseUrl.length) || '/' : url);
  let redirected = new Set<string>();
  try {
    const admin = await getAdminPocketBase();
    const rules = await admin.collection('redirects').getFullList({ fields: 'from_path' });
    redirected = new Set(rules.map((rule: any) => rule.from_path).filter(Boolean));
  } catch {
    // No rules readable — emit the routes as built.
  }

  return redirected.size === 0
    ? routes
    : routes.filter((route) => !redirected.has(pathOf(route.url)));
}
