import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { getCatalog } from "@/lib/catalog";
import { buildResolvedCopy } from "@/lib/template";
import { getServiceList } from "@/lib/services";
import { getAreaList } from "@/lib/service-areas";
import { notFound } from "next/navigation";
import type { ServiceAreaNode, ServiceNode, Testimonial, MediaItem } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';

  return {
    title: 'About',
    description: businessInfo.short_description || `Learn more about ${businessInfo.business_name}.`,
    alternates: { canonical: `${siteUrl}/about` },
  };
}

export default async function AboutPageWrapper() {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const pb = await getPocketBaseClient();
  
  let serviceAreas: ServiceAreaNode[] = [];
  let services: ServiceNode[] = [];
  let testimonials: Testimonial[] = [];
  let media: MediaItem[] = [];
  try {
    serviceAreas = await getAreaList();
    services = await getServiceList();
    testimonials = await pb.collection('testimonials').getFullList<Testimonial>({ filter: 'is_visible = true', sort: 'sort_order' });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  const locations = await getLocations();
  const projects = await getProjects();
  const { brands, certifications, awards } = await getCatalog();

  const template = await loadTemplate(settings.active_template);
  if (!template.AboutPage) return notFound();

  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  const AboutPageComponent = template.AboutPage;

  return (
    <AboutPageComponent
      businessInfo={businessInfo}
      serviceAreas={serviceAreas}
      locations={locations}
      projects={projects}
      brands={brands}
      certifications={certifications}
      awards={awards}
      services={services}
      testimonials={testimonials}
      media={media}
      resolvedCopy={resolvedCopy}
      config={settings.template_config || {}}
    />
  );
}
