import type { Metadata } from 'next';
import Link from 'next/link';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo } from '@/lib/settings';
import { getCatalog } from '@/lib/catalog';
import { buildResolvedCopy } from '@/lib/template';
import { getLocations } from '@/lib/locations';
import { getProjects } from '@/lib/projects';
import { notFound } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';
  return {
    title: 'Certifications',
    description: `Certifications, partnerships, and affiliations held by ${businessInfo.business_name}.`,
    alternates: { canonical: `${siteUrl}/certifications` },
  };
}

export default async function CertificationsIndexPageWrapper() {
  const settings = await getSettings();
  if (!settings.certifications_enabled) return notFound();

  const businessInfo = await getBusinessInfo();
  const { brands, certifications, awards } = await getCatalog();
  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);
  const resolvedCopy = buildResolvedCopy(
    template.manifest?.supportedCopyKeys,
    settings.template_config?.copyOverrides || {},
    businessInfo,
  );

  return template.CertificationsIndexPage ? (
    <template.CertificationsIndexPage
      certifications={certifications}
      businessInfo={businessInfo}
      resolvedCopy={resolvedCopy}
      locations={locations}
      projects={projects}
      brands={brands}
      awards={awards}
      config={settings.template_config || {}}
    />
  ) : (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Certifications</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {certifications.map((item) => (
          <Link key={item.id} href={`/certifications/${item.slug}`} className="block rounded-xl border p-5 hover:shadow-md transition-shadow">
            {item.image_url && <img src={item.image_url} alt={item.name} className="h-32 w-full object-contain rounded-lg mb-4" />}
            <h2 className="font-semibold text-lg">{item.name}</h2>
            {item.description && <p className="text-sm text-slate-500 mt-1">{item.description}</p>}
          </Link>
        ))}
        {certifications.length === 0 && <p className="text-slate-500 col-span-3">Nothing here yet.</p>}
      </div>
    </div>
  );
}
