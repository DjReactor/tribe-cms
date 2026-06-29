import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { buildResolvedCopy } from "@/lib/template";
import { notFound } from "next/navigation";
import type { ServiceArea, MediaItem } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';

  return {
    title: 'Contact',
    description: `Contact ${businessInfo.business_name}${businessInfo.city ? ` in ${businessInfo.city}` : ''}. Call us at ${businessInfo.phone}.`,
    alternates: { canonical: `${siteUrl}/contact` },
  };
}

export default async function ContactPageWrapper() {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const pb = await getPocketBaseClient();

  let serviceAreas: ServiceArea[] = [];
  let media: MediaItem[] = [];
  try {
    serviceAreas = await pb.collection('service_areas').getFullList<ServiceArea>({ filter: 'is_active = true', sort: 'sort_order' });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  const locations = await getLocations();
  const projects = await getProjects();

  const template = await loadTemplate(settings.active_template);
  if (!template.ContactPage) return notFound();

  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  const ContactPageComponent = template.ContactPage;

  return (
    <ContactPageComponent
      businessInfo={businessInfo}
      serviceAreas={serviceAreas}
      locations={locations}
      projects={projects}
      media={media}
      resolvedCopy={resolvedCopy}
      config={settings.template_config || {}}
    />
  );
}