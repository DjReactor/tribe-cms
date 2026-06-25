import { cache } from 'react';
import { getPocketBaseClient } from './pocketbase';
import { getSettings } from './settings';
import type { Project } from '@/types';

const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

/**
 * Maps a raw PocketBase `projects` record (with `services` / `gallery_media`
 * relations expanded) into the `Project` shape consumed by templates and pages.
 */
export function mapProject(raw: any): Project {
  const galleryMedia = raw.expand?.gallery_media ?? [];
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    summary: raw.summary,
    status: raw.status,
    featured: raw.featured,
    is_active: raw.is_active,
    sort_order: raw.sort_order,
    services: raw.expand?.services ?? [],
    location: raw.location_city ? { city: raw.location_city, state: raw.location_state || undefined } : undefined,
    completed_at: raw.completed_at || undefined,
    cover_image_url: raw.cover_image_url || '',
    gallery_image_urls: galleryMedia.map((m: any) => `${pbUrl}/api/files/media/${m.id}/${m.file}`),
    content: {
      problem: raw.content_problem || undefined,
      solution: raw.content_solution || undefined,
      process: raw.content_process || undefined,
      outcome: raw.content_outcome || undefined,
    },
    testimonial: raw.testimonial_quote ? {
      quote: raw.testimonial_quote,
      client: raw.testimonial_client,
      client_info: raw.testimonial_client_info || undefined,
      client_image_url: raw.testimonial_client_image_url || (raw.testimonial_client_image ? `${pbUrl}/api/files/projects/${raw.id}/${raw.testimonial_client_image}` : undefined),
      rating: raw.testimonial_rating || undefined,
    } : undefined,
    seo_title: raw.seo_title || '',
    seo_description: raw.seo_description || '',
    canonical_url: raw.canonical_url || undefined,
    og_image_url: raw.og_image_url || undefined,
    noindex: raw.noindex ?? false,
    updated: raw.updated,
  };
}

/**
 * Active projects for public display — available to every page.
 *
 * Honours the `projects_enabled` master switch (Option A): when the feature is
 * off this returns `[]` everywhere, so any template "Projects" section hides
 * itself via its `projects.length > 0` condition, and the dedicated routes /
 * sitemap stay empty. Wrapped in React `cache()` so calling it from both the
 * layout and the page in one request is a single query. Unlike locations,
 * `projects` records are nested, so we expand relations and `mapProject` each.
 */
export const getProjects = cache(async (): Promise<Project[]> => {
  const settings = await getSettings();
  if (!settings.projects_enabled) return [];
  try {
    const pb = await getPocketBaseClient();
    const raw = await pb.collection('projects').getFullList({
      filter: 'is_active = true',
      sort: 'sort_order',
      expand: 'services,gallery_media',
    });
    return raw.map(mapProject);
  } catch {
    return [];
  }
});
