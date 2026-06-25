import type { Metadata } from 'next';
import { loadTemplate } from '@/lib/template-loader';
import { getSettings, getBusinessInfo } from '@/lib/settings';
import { getPocketBaseClient } from '@/lib/pocketbase';
import { notFound } from 'next/navigation';
import type { Location } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const siteUrl = process.env.SITE_URL || '';
  let location: Location | null = null;
  try {
    const pb = await getPocketBaseClient();
    const { slug } = await params;
    location = await pb.collection('locations').getFirstListItem<Location>(pb.filter('slug={:slug} && is_active=true', { slug }));
  } catch {}

  if (!location) return {};

  const title = location.seo_title || location.area_name;
  const description = location.seo_description
    || `Visit ${location.area_name}${location.address ? ` at ${location.address}` : ''}.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/locations/${location.slug}` },
    ...(location.noindex && { robots: { index: false, follow: true } }),
  };
}

export default async function LocationDetailPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const settings = await getSettings();
  if (!settings.locations_enabled) return notFound();

  const [businessInfo, pb] = await Promise.all([getBusinessInfo(), getPocketBaseClient()]);
  const siteUrl = process.env.SITE_URL || '';
  const { slug } = await params;

  let location: Location;
  let relatedLocations: Location[] = [];

  try {
    location = await pb.collection('locations').getFirstListItem<Location>(pb.filter('slug={:slug} && is_active=true', { slug }));

    const relatedRaw = await pb.collection('locations').getList<Location>(1, 3, {
      filter: `is_active=true && id!="${location.id}"`,
      sort: 'sort_order',
    }).catch(() => ({ items: [] as Location[] }));
    relatedLocations = relatedRaw.items;
  } catch {
    return notFound();
  }

  // LocalBusiness JSON-LD for this specific location.
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${businessInfo.business_name}${location.area_name ? ` — ${location.area_name}` : ''}`,
    ...(location.address && { address: location.address }),
    ...(location.phone && { telephone: location.phone }),
    ...(businessInfo.email && { email: businessInfo.email }),
    url: `${siteUrl}/locations/${location.slug}`,
  };

  const template = await loadTemplate(settings.active_template);

  const content = template.LocationDetailPage ? (
    <template.LocationDetailPage
      location={location}
      businessInfo={businessInfo}
      relatedLocations={relatedLocations}
      config={settings.template_config || {}}
    />
  ) : (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
      <h1 className="text-4xl font-bold">{location.area_name}</h1>
      {location.address && <p className="text-lg text-slate-600">{location.address}</p>}
      {location.phone && (
        <p className="text-lg">
          <a href={`tel:${location.phone}`} className="underline">{location.phone}</a>
        </p>
      )}
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      {content}
    </>
  );
}
