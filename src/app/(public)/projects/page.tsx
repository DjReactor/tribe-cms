import type { Metadata } from 'next';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo, getSeoSettings } from '@/lib/settings';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { notFound } from 'next/navigation';
import type { Project, Service } from '@/types';
import { mapProject } from '@/lib/projects';

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
