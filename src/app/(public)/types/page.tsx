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
    title: 'Types',
    description: `Explore the types of work ${businessInfo.business_name} handles.`,
    alternates: { canonical: `${siteUrl}/types` },
  };
}

export default async function TypesIndexPageWrapper() {
  const settings = await getSettings();
  if (!settings.types_enabled) return notFound();

  const businessInfo = await getBusinessInfo();
  const { types, brands, certifications, awards } = await getCatalog();
  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);
  const resolvedCopy = buildResolvedCopy(
    template.manifest?.supportedCopyKeys,
    settings.template_config?.copyOverrides || {},
    businessInfo,
  );

  return template.TypesIndexPage ? (
    <template.TypesIndexPage
      types={types}
      businessInfo={businessInfo}
      resolvedCopy={resolvedCopy}
      locations={locations}
      projects={projects}
      brands={brands}
      certifications={certifications}
      awards={awards}
      config={settings.template_config || {}}
    />
  ) : (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Types</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {types.map((item) => (
          <Link key={item.id} href={`/types/${item.slug}`} className="block rounded-xl border p-5 hover:shadow-md transition-shadow">
            {item.image_url && <img src={item.image_url} alt={item.name} className="h-32 w-full object-cover rounded-lg mb-4" />}
            <h2 className="font-semibold text-lg">{item.name}</h2>
            {item.description && <p className="text-sm text-slate-500 mt-1">{item.description}</p>}
          </Link>
        ))}
        {types.length === 0 && <p className="text-slate-500 col-span-3">Nothing here yet.</p>}
      </div>
    </div>
  );
}
