import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { getCatalog } from "@/lib/catalog";
import { buildResolvedCopy } from "@/lib/template";
import { getAreaList, getAreaRoots } from "@/lib/service-areas";
import type { MediaItem } from "@/types";
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
  let media: MediaItem[] = [];

  try {
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  // Both shapes of the same forest, sharing their node objects: the flat
  // depth-first list for a template that ignores hierarchy, and the roots for
  // one that renders State › County › City. Area paths are flat at every tier,
  // so nesting here is presentation only.
  const serviceAreas = await getAreaList();
  const areaTree = await getAreaRoots();

  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  const locations = await getLocations();
  const projects = await getProjects();
  const { brands, certifications, awards } = await getCatalog();

  const ServiceAreasIndexPageComponent = template.ServiceAreasIndexPage;

  return (
    <ServiceAreasIndexPageComponent
      serviceAreas={serviceAreas}
      areaTree={areaTree}
      businessInfo={businessInfo}
      locations={locations}
      projects={projects}
      brands={brands}
      certifications={certifications}
      awards={awards}
      resolvedCopy={resolvedCopy}
      media={media}
      config={settings.template_config || {}}
    />
  );
}
