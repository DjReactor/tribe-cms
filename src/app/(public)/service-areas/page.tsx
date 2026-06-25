import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { buildResolvedCopy } from "@/lib/template";
import type { ServiceArea, MediaItem } from "@/types";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';
  return {
    title: 'Service Areas',
    description: `Areas served by ${businessInfo.business_name}.`,
    alternates: { canonical: `${siteUrl}/service-areas` },
  };
}

export default async function ServiceAreasIndexPageWrapper() {
  const settings = await getSettings();
  if (!settings.service_areas_index_enabled) return notFound();

  const template = await loadTemplate(settings.active_template);
  if (!template.ServiceAreasIndexPage) return notFound();

  const businessInfo = await getBusinessInfo();
  const pb = await getPocketBaseClient();
  let serviceAreas: ServiceArea[] = [];
  let media: MediaItem[] = [];

  try {
    serviceAreas = await pb.collection('service_areas').getFullList<ServiceArea>({
      filter: 'is_active = true',
      sort: 'sort_order',
    });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  const locations = await getLocations();

  const ServiceAreasIndexPageComponent = template.ServiceAreasIndexPage;

  return (
    <ServiceAreasIndexPageComponent
      serviceAreas={serviceAreas}
      businessInfo={businessInfo}
      locations={locations}
      resolvedCopy={resolvedCopy}
      media={media}
      config={settings.template_config || {}}
    />
  );
}
