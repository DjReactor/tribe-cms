import type { Metadata } from 'next';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo } from '@/lib/settings';
import { getCatalog, getTypes } from '@/lib/catalog';
import { getLocations } from '@/lib/locations';
import { getProjects } from '@/lib/projects';
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const siteUrl = process.env.SITE_URL || '';
  const { slug } = await params;
  const item = (await getTypes()).find((t) => t.slug === slug);
  if (!item) return {};

  return {
    title: item.seo_title || item.name,
    description: item.seo_description || item.description || '',
    alternates: { canonical: `${siteUrl}/types/${item.slug}` },
    ...(item.noindex && { robots: { index: false, follow: true } }),
  };
}

export default async function TypeDetailPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const settings = await getSettings();
  if (!settings.types_enabled) return notFound();

  const businessInfo = await getBusinessInfo();
  const { types, brands, certifications, awards } = await getCatalog();
  const { slug } = await params;

  const typeItem = types.find((t) => t.slug === slug);
  if (!typeItem) return notFound();
  const relatedTypes = types.filter((t) => t.id !== typeItem.id).slice(0, 3);

  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);

  return template.TypeDetailPage ? (
    <template.TypeDetailPage
      typeItem={typeItem}
      businessInfo={businessInfo}
      relatedTypes={relatedTypes}
      locations={locations}
      projects={projects}
      types={types}
      brands={brands}
      certifications={certifications}
      awards={awards}
      config={settings.template_config || {}}
    />
  ) : (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
      <h1 className="text-4xl font-bold">{typeItem.name}</h1>
      {typeItem.image_url && <img src={typeItem.image_url} alt={typeItem.name} className="w-full rounded-xl" />}
      {typeItem.description && <p className="text-lg text-slate-600">{typeItem.description}</p>}
      {Array.isArray(typeItem.details) && typeItem.details.length > 0 && (
        <BlockNoteRenderer content={typeItem.details} />
      )}
    </div>
  );
}
