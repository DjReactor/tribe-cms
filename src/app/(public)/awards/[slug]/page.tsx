import type { Metadata } from 'next';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo } from '@/lib/settings';
import { getCatalog, getAwards } from '@/lib/catalog';
import { getLocations } from '@/lib/locations';
import { getProjects } from '@/lib/projects';
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const siteUrl = process.env.SITE_URL || '';
  const { slug } = await params;
  const item = (await getAwards()).find((a) => a.slug === slug);
  if (!item) return {};

  return {
    title: item.seo_title || item.name,
    description: item.seo_description || item.description || '',
    alternates: { canonical: `${siteUrl}/awards/${item.slug}` },
    ...(item.noindex && { robots: { index: false, follow: true } }),
  };
}

export default async function AwardDetailPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const settings = await getSettings();
  if (!settings.awards_enabled) return notFound();

  const businessInfo = await getBusinessInfo();
  const { brands, certifications, awards } = await getCatalog();
  const { slug } = await params;

  const award = awards.find((a) => a.slug === slug);
  if (!award) return notFound();
  const relatedAwards = awards.filter((a) => a.id !== award.id).slice(0, 3);

  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);

  return template.AwardDetailPage ? (
    <template.AwardDetailPage
      award={award}
      businessInfo={businessInfo}
      relatedAwards={relatedAwards}
      locations={locations}
      projects={projects}
      brands={brands}
      certifications={certifications}
      awards={awards}
      config={settings.template_config || {}}
    />
  ) : (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
      <h1 className="text-4xl font-bold">{award.name}</h1>
      {award.image_url && <img src={award.image_url} alt={award.name} className="w-full rounded-xl" />}
      {award.description && <p className="text-lg text-slate-600">{award.description}</p>}
      {Array.isArray(award.details) && award.details.length > 0 && (
        <BlockNoteRenderer content={award.details} />
      )}
    </div>
  );
}

/**
 * ISR for a dynamic route.
 *
 * An empty list means nothing is prerendered at build time — the build has no
 * PocketBase to query, and enumerating every slug would make build time scale
 * with client content. What this export DOES do is opt the route into caching:
 * the first request for a slug renders and caches it, and later requests are
 * served from cache until `revalidatePath` or the layout `revalidate` backstop
 * invalidates it.
 *
 * Without this export the route is plain dynamic and is never cached at all,
 * however many `revalidate` values sit above it. Verified by build output.
 */
export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;
