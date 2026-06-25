import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { buildServiceSchema, buildBreadcrumbSchema } from "@/lib/seo";
import type { Service, ServiceArea, BeforeAfterPair, MediaItem } from "@/types";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';

  let service: Service | null = null;
  try {
    const pb = await getPocketBaseClient();
    const { slug } = await params;
    service = await pb.collection('services').getFirstListItem<Service>(`slug="${slug}" && is_active=true`);
  } catch {}

  if (!service) return {};

  const title = service.seo_title || service.name;
  const description = service.seo_description || service.short_description || '';
  const canonicalUrl = `${siteUrl}/services/${service.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    ...(service.noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      type: 'website',
      ...(service.cover_image_url && {
        images: [{ url: service.cover_image_url }],
      }),
    },
  };
}

export default async function ServiceDetailPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const pb = await getPocketBaseClient();
  const siteUrl = process.env.SITE_URL || '';

  let service: Service;
  let serviceAreas: ServiceArea[] = [];
  let beforeAfterPairs: BeforeAfterPair[] = [];
  let media: MediaItem[] = [];

  try {
    const resolvedParams = await params;
    const record = await pb.collection('services').getFirstListItem<Service>(`slug="${resolvedParams.slug}" && is_active=true`);
    service = record;
    serviceAreas = await pb.collection('service_areas').getFullList<ServiceArea>({ filter: 'is_active = true', sort: 'sort_order' });
    beforeAfterPairs = await pb.collection('before_after_pairs').getFullList<BeforeAfterPair>({ filter: 'is_active = true', sort: 'sort_order' });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {
    return notFound();
  }

  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);
  const ServiceDetailPageComponent = template.ServiceDetailPage;

  const serviceSchema = buildServiceSchema(service, businessInfo, siteUrl);
  const breadcrumbSchema = seoSettings?.enable_breadcrumbs !== false
    ? buildBreadcrumbSchema([
        { name: 'Services', item: `${siteUrl}/services` },
        { name: service.name, item: `${siteUrl}/services/${service.slug}` },
      ])
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ServiceDetailPageComponent
        service={service}
        businessInfo={businessInfo}
        serviceAreas={serviceAreas}
        locations={locations}
        projects={projects}
        beforeAfterPairs={beforeAfterPairs}
        media={media}
        config={settings.template_config || {}}
      />
    </>
  );
}
