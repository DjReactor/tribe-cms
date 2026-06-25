import type { Metadata } from 'next';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo } from '@/lib/settings';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { notFound } from 'next/navigation';
import type { Project } from '@/types';
import { mapProject } from '@/lib/projects';
import { getLocations } from '@/lib/locations';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const siteUrl = process.env.SITE_URL || '';
  let project: Project | null = null;
  try {
    const pb = await getPocketBaseClient();
    const { slug } = await params;
    const raw = await pb.collection('projects').getFirstListItem(pb.filter('slug={:slug} && is_active=true', { slug }), { expand: 'services,gallery_media' });
    project = mapProject(raw);
  } catch {}

  if (!project) return {};

  const title = project.seo_title || project.title;
  const description = project.seo_description || project.summary;
  const canonicalUrl = project.canonical_url || `${siteUrl}/projects/${project.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    ...(project.noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      images: [(project.og_image_url || project.cover_image_url)].filter(Boolean) as string[],
    },
  };
}

export default async function ProjectDetailPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const settings = await getSettings();
  if (!settings.projects_enabled) return notFound();

  const [businessInfo, pb] = await Promise.all([getBusinessInfo(), getPocketBaseClient()]);
  const siteUrl = process.env.SITE_URL || '';
  const { slug } = await params;

  let project: Project;
  let relatedProjects: Project[] = [];

  try {
    const raw = await pb.collection('projects').getFirstListItem(pb.filter('slug={:slug} && is_active=true', { slug }), {
      expand: 'services,gallery_media',
    });
    project = mapProject(raw);

    const relatedServiceIds = project.services.map((s) => s.id);
    const filter = relatedServiceIds.length > 0
      ? `is_active=true && id!="${raw.id}" && (${relatedServiceIds.map(id => `services~"${id}"`).join(' || ')})`
      : `is_active=true && id!="${raw.id}"`;

    const relatedRaw = await pb.collection('projects').getList(1, 3, {
      filter,
      sort: 'sort_order',
      expand: 'services,gallery_media',
    }).catch(() => ({ items: [] }));
    relatedProjects = relatedRaw.items.map(mapProject);
  } catch {
    return notFound();
  }

  // Build JSON-LD
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: project.seo_title || project.title,
    description: project.seo_description || project.summary,
    url: `${siteUrl}/projects/${project.slug}`,
    image: project.og_image_url || project.cover_image_url,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Projects', item: `${siteUrl}/projects` },
        { '@type': 'ListItem', position: 3, name: project.title },
      ],
    },
  };

  const reviewSchema = project.testimonial?.rating
    ? {
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: { '@type': 'LocalBusiness', name: businessInfo.business_name },
        reviewRating: { '@type': 'Rating', ratingValue: String(project.testimonial.rating), bestRating: '5' },
        author: { '@type': 'Person', name: project.testimonial.client },
        reviewBody: project.testimonial.quote,
      }
    : null;

  const locations = await getLocations();

  const template = await loadTemplate(settings.active_template);

  const content = template.ProjectDetailPage ? (
    <template.ProjectDetailPage
      project={project}
      businessInfo={businessInfo}
      locations={locations}
      relatedProjects={relatedProjects}
      config={settings.template_config || {}}
    />
  ) : (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      {project.cover_image_url && (
        <img src={project.cover_image_url} alt={project.title} className="w-full h-72 object-cover rounded-2xl" />
      )}
      <h1 className="text-4xl font-bold">{project.title}</h1>
      <p className="text-lg text-slate-600">{project.summary}</p>
      {project.content?.problem && <section><h2 className="text-xl font-semibold mb-2">The Challenge</h2><p>{project.content.problem}</p></section>}
      {project.content?.solution && <section><h2 className="text-xl font-semibold mb-2">Our Solution</h2><p>{project.content.solution}</p></section>}
      {project.content?.process && <section><h2 className="text-xl font-semibold mb-2">The Process</h2><p>{project.content.process}</p></section>}
      {project.content?.outcome && <section><h2 className="text-xl font-semibold mb-2">The Result</h2><p>{project.content.outcome}</p></section>}
      {project.testimonial && (
        <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-700">
          <p>"{project.testimonial.quote}"</p>
          <footer className="mt-2 text-sm text-slate-500">— {project.testimonial.client}{project.testimonial.client_info ? `, ${project.testimonial.client_info}` : ''}</footer>
        </blockquote>
      )}
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      {reviewSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />}
      {content}
    </>
  );
}
