import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { buildResolvedCopy, resolveTemplateTokens } from "@/lib/template";
import type { Service, ServiceArea, MediaItem } from "@/types";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ 'area-slug': string }> }): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const siteUrl = process.env.SITE_URL || '';

  let area: ServiceArea | null = null;
  try {
    const pb = await getPocketBaseClient();
    const { 'area-slug': areaSlug } = await params;
    area = await pb.collection('service_areas').getFirstListItem<ServiceArea>(`slug="${areaSlug}" && is_active=true`);
  } catch {}

  if (!area) return {};

  const title = area.seo_title || area.name;
  const description = area.seo_description || `${businessInfo.business_type || 'Professional services'} in ${area.name}.`;
  const shouldNoindex = area.noindex || seoSettings?.noindex_service_areas;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/${area.slug}` },
    ...(shouldNoindex && { robots: { index: false, follow: true } }),
    openGraph: { title, description, type: 'website' },
  };
}

export default async function ServiceAreaPageWrapper({ params }: { params: Promise<{ 'area-slug': string }> }) {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const pb = await getPocketBaseClient();
  // getSeoSettings already called in generateMetadata; cache() deduplicates within the request
  
  let area: ServiceArea;
  let services: Service[] = [];
  let media: MediaItem[] = [];
  
  try {
    const resolvedParams = await params;
    const record = await pb.collection('service_areas').getFirstListItem<ServiceArea>(`slug="${resolvedParams['area-slug']}" && is_active=true`);
    area = record;
    services = await pb.collection('services').getFullList<Service>({ filter: 'is_active = true', sort: 'sort_order' });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {
    return notFound();
  }

  const template = await loadTemplate(settings.active_template);
  const copyOverrides = settings.template_config?.copyOverrides || {};

  // Build template-wide resolvedCopy from manifest + user overrides
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  // {{area_name}} is an area-only token. buildResolvedCopy / resolveTemplateTokens
  // only handle the four business tokens, so {{area_name}} survives untouched and is
  // resolved here — scoped to this Service Area route, so other pages are unaffected.
  // Every copy slot on this page (headings, intro, CTA, etc.) gets the live area name.
  for (const key of Object.keys(resolvedCopy)) {
    resolvedCopy[key] = resolvedCopy[key].replace(/\{\{area_name\}\}/g, area.name);
  }

  // Area-specific h1/intro:
  // Priority 1 — per-area DB override (custom_h1 / custom_intro)
  // Priority 2 — template manifest default for service_area_h1 / service_area_intro
  // Priority 3 — last-resort CMS fallback (guards against templates that omit the keys)
  // Business tokens are resolved by resolveTemplateTokens; {{area_name}} by the
  // trailing replace, so whichever branch wins gets both kinds of token resolved.
  const fallbackH1    = `{{business_type}} in {{area_name}}`;
  const fallbackIntro = `Professional {{business_type}} services serving {{area_name}} and surrounding areas.`;

  resolvedCopy.h1 = resolveTemplateTokens(
    area.custom_h1 || resolvedCopy.service_area_h1 || fallbackH1,
    businessInfo
  ).replace(/\{\{area_name\}\}/g, area.name);

  resolvedCopy.intro = resolveTemplateTokens(
    area.custom_intro || resolvedCopy.service_area_intro || fallbackIntro,
    businessInfo
  ).replace(/\{\{area_name\}\}/g, area.name);

  const locations = await getLocations();
  const projects = await getProjects();

  const ServiceAreaPageComponent = template.ServiceAreaPage;

  return (
    <ServiceAreaPageComponent
      area={area}
      businessInfo={businessInfo}
      locations={locations}
      projects={projects}
      services={services}
      media={media}
      resolvedCopy={resolvedCopy}
      config={settings.template_config || {}}
    />
  );
}