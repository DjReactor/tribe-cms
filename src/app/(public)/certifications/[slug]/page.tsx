import type { Metadata } from 'next';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo } from '@/lib/settings';
import { getCatalog, getCertifications } from '@/lib/catalog';
import { getLocations } from '@/lib/locations';
import { getProjects } from '@/lib/projects';
import { BlockNoteRenderer } from '@/components/shared/BlockNoteRenderer';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const siteUrl = process.env.SITE_URL || '';
  const { slug } = await params;
  const item = (await getCertifications()).find((c) => c.slug === slug);
  if (!item) return {};

  return {
    title: item.seo_title || item.name,
    description: item.seo_description || item.description || '',
    alternates: { canonical: `${siteUrl}/certifications/${item.slug}` },
    ...(item.noindex && { robots: { index: false, follow: true } }),
  };
}

export default async function CertificationDetailPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const settings = await getSettings();
  if (!settings.certifications_enabled) return notFound();

  const businessInfo = await getBusinessInfo();
  const { types, brands, certifications, awards } = await getCatalog();
  const { slug } = await params;

  const certification = certifications.find((c) => c.slug === slug);
  if (!certification) return notFound();
  const relatedCertifications = certifications.filter((c) => c.id !== certification.id).slice(0, 3);

  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);

  return template.CertificationDetailPage ? (
    <template.CertificationDetailPage
      certification={certification}
      businessInfo={businessInfo}
      relatedCertifications={relatedCertifications}
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
      <h1 className="text-4xl font-bold">{certification.name}</h1>
      {certification.image_url && <img src={certification.image_url} alt={certification.name} className="w-full rounded-xl" />}
      {certification.description && <p className="text-lg text-slate-600">{certification.description}</p>}
      {Array.isArray(certification.details) && certification.details.length > 0 && (
        <BlockNoteRenderer content={certification.details} />
      )}
    </div>
  );
}
