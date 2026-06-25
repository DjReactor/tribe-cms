import type { Metadata } from 'next';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo } from '@/lib/settings';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { notFound } from 'next/navigation';
import type { Location } from '@/types';

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';
  return {
    title: 'Locations',
    description: `Find ${businessInfo.business_name} near you — addresses and phone numbers for all of our locations.`,
    alternates: { canonical: `${siteUrl}/locations` },
  };
}

export default async function LocationsIndexPageWrapper() {
  const settings = await getSettings();
  if (!settings.locations_enabled) return notFound();

  const [businessInfo, pb] = await Promise.all([getBusinessInfo(), getPocketBaseClient()]);
  const siteUrl = process.env.SITE_URL || '';

  let locations: Location[] = [];
  try {
    locations = await pb.collection('locations').getFullList<Location>({
      filter: 'is_active = true',
      sort: 'sort_order',
    });
  } catch {}

  // ItemList of LocalBusiness entries for richer local SEO.
  const itemListSchema = locations.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: locations.map((loc, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'LocalBusiness',
            name: `${businessInfo.business_name}${loc.area_name ? ` — ${loc.area_name}` : ''}`,
            ...(loc.address && { address: loc.address }),
            ...(loc.phone && { telephone: loc.phone }),
            url: `${siteUrl}/locations/${loc.slug}`,
          },
        })),
      }
    : null;

  const template = await loadTemplate(settings.active_template);

  const content = template.LocationsIndexPage ? (
    <template.LocationsIndexPage
      locations={locations}
      businessInfo={businessInfo}
      config={settings.template_config || {}}
    />
  ) : (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Our Locations</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((loc) => (
          <a key={loc.id} href={`/locations/${loc.slug}`} className="block rounded-xl border p-5 hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-lg">{loc.area_name}</h2>
            {loc.address && <p className="text-sm text-slate-500 mt-1">{loc.address}</p>}
            {loc.phone && <p className="text-sm text-slate-500 mt-1">{loc.phone}</p>}
          </a>
        ))}
        {locations.length === 0 && <p className="text-slate-500 col-span-3">No locations yet.</p>}
      </div>
    </div>
  );

  return (
    <>
      {itemListSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      )}
      {content}
    </>
  );
}
