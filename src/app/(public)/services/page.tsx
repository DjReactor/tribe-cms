import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { getCatalog } from "@/lib/catalog";
import { getServices, getServiceList, buildServiceTree, resolveDisplayMode } from "@/lib/services";
import { buildResolvedCopy } from "@/lib/template";
import type { Service, MediaItem } from "@/types";
import { ServicesIndexFallback } from '@/components/shared/TemplateFallbacks';

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';

  return {
    title: 'Services',
    description: `${businessInfo.business_type || 'Professional'} services${businessInfo.city ? ` in ${businessInfo.city}` : ''} from ${businessInfo.business_name}.`,
    alternates: { canonical: `${siteUrl}/services` },
  };
}

export default async function ServicesIndexPageWrapper() {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const pb = await getPocketBaseClient();

  // Flat list stays the full set across every tier; the tree is the same data
  // nested. Templates get both so a flat layout needs no hierarchy awareness.
  const flat = await getServices();
  const services = await getServiceList();          // depth-first, each with `path`
  const serviceTree = buildServiceTree(flat);       // the same set, nested
  const servicesDisplayMode = resolveDisplayMode(settings.services_display_mode, flat);

  let media: MediaItem[] = [];
  try {
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  const locations = await getLocations();
  const projects = await getProjects();
  const { brands, certifications, awards } = await getCatalog();

  const template = await loadTemplate(settings.active_template);

  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  const ServicesIndexPageComponent = template.ServicesIndexPage;
  // The sitemap lists /services and every service under it, so this must render.
  if (!ServicesIndexPageComponent) {
    return <ServicesIndexFallback services={services} heading={resolvedCopy.services_heading} />;
  }

  return (
    <ServicesIndexPageComponent
      services={services}
      serviceTree={serviceTree}
      servicesDisplayMode={servicesDisplayMode}
      businessInfo={businessInfo}
      locations={locations}
      projects={projects}
      brands={brands}
      certifications={certifications}
      awards={awards}
      media={media}
      resolvedCopy={resolvedCopy}
      config={settings.template_config || {}}
    />
  );
}