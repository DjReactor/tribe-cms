import type { Metadata } from 'next';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo } from '@/lib/settings';
import { getCatalog, getBrands } from '@/lib/catalog';
import { getLocations } from '@/lib/locations';
import { getProjects } from '@/lib/projects';
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const siteUrl = process.env.SITE_URL || '';
  const { slug } = await params;
  const item = (await getBrands()).find((b) => b.slug === slug);
  if (!item) return {};

  return {
    title: item.seo_title || item.name,
    description: item.seo_description || item.description || '',
    alternates: { canonical: `${siteUrl}/brands/${item.slug}` },
    ...(item.noindex && { robots: { index: false, follow: true } }),
  };
}

export default async function BrandDetailPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const settings = await getSettings();
  if (!settings.brands_enabled) return notFound();

  const businessInfo = await getBusinessInfo();
  const { brands, certifications, awards } = await getCatalog();
  const { slug } = await params;

  const brand = brands.find((b) => b.slug === slug);
  if (!brand) return notFound();
  const relatedBrands = brands.filter((b) => b.id !== brand.id).slice(0, 3);

  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);

  return template.BrandDetailPage ? (
    <template.BrandDetailPage
      brand={brand}
      businessInfo={businessInfo}
      relatedBrands={relatedBrands}
      locations={locations}
      projects={projects}
      brands={brands}
      certifications={certifications}
      awards={awards}
      config={settings.template_config || {}}
    />
  ) : (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
      <h1 className="text-4xl font-bold">{brand.name}</h1>
      {brand.image_url && <img src={brand.image_url} alt={brand.name} className="w-full rounded-xl" />}
      {brand.description && <p className="text-lg text-slate-600">{brand.description}</p>}
      {Array.isArray(brand.details) && brand.details.length > 0 && (
        <BlockNoteRenderer content={brand.details} />
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
