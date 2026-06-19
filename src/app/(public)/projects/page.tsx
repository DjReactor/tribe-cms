import type { Metadata } from 'next';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo, getSeoSettings } from '@/lib/settings';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { notFound } from 'next/navigation';
import type { Project, Service } from '@/types';

const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

function mapProject(raw: any): Project {
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

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';
  return {
    title: 'Projects',
    description: `Completed projects by ${businessInfo.business_name}.`,
    alternates: { canonical: `${siteUrl}/projects` },
  };
}

export default async function ProjectsIndexPageWrapper() {
  const settings = await getSettings();
  if (!settings.projects_enabled) return notFound();

  const [businessInfo, pb] = await Promise.all([getBusinessInfo(), getPocketBaseClient()]);

  let projects: Project[] = [];
  let services: Service[] = [];

  try {
    const rawProjects = await pb.collection('projects').getFullList({
      filter: 'is_active = true',
      sort: 'sort_order',
      expand: 'services,gallery_media',
    });
    projects = rawProjects.map(mapProject);
    services = await pb.collection('services').getFullList<Service>({ filter: 'is_active = true', sort: 'sort_order' });
  } catch {}

  const template = await loadTemplate(settings.active_template);

  if (!template.ProjectsIndexPage) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Our Projects</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <a key={project.id} href={`/projects/${project.slug}`} className="block rounded-xl overflow-hidden border hover:shadow-md transition-shadow">
              {project.cover_image_url && (
                <img src={project.cover_image_url} alt={project.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg">{project.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{project.summary}</p>
              </div>
            </a>
          ))}
          {projects.length === 0 && <p className="text-slate-500 col-span-3">No projects yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <template.ProjectsIndexPage
      projects={projects}
      businessInfo={businessInfo}
      resolvedCopy={{}}
      services={services}
      config={settings.template_config || {}}
    />
  );
}
