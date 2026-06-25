import { MetadataRoute } from 'next';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { getSeoSettings } from '@/lib/settings';
import type { Service, ServiceArea, BlogPost } from '@/types';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pb = await getPocketBaseClient();
  const seoSettings = await getSeoSettings();
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000';

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services`, changeFrequency: 'weekly', priority: 0.9 },
  ];

  try {
    const services = await pb.collection('services').getFullList<Service>({ filter: 'is_active = true' });
    services.forEach(service => {
      if (!service.noindex) {
        routes.push({
          url: `${baseUrl}/services/${service.slug}`,
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      }
    });

    // Only include service areas if not globally noindexed
    if (!seoSettings?.noindex_service_areas) {
      const areas = await pb.collection('service_areas').getFullList<ServiceArea>({ filter: 'is_active = true' });
      areas.forEach(area => {
        if (!area.noindex) {
          routes.push({
            url: `${baseUrl}/${area.slug}`,
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      });
    }

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

  return routes;
}
