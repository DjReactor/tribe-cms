import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { buildResolvedCopy } from "@/lib/template";
import type { ServiceArea, Service, Testimonial, MediaItem } from "@/types";

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
  
  let serviceAreas: ServiceArea[] = [];
  let services: Service[] = [];
  let testimonials: Testimonial[] = [];
  let media: MediaItem[] = [];
  try {
    serviceAreas = await pb.collection('service_areas').getFullList<ServiceArea>({ filter: 'is_active = true', sort: 'sort_order' });
    services = await pb.collection('services').getFullList<Service>({ filter: 'is_active = true', sort: 'sort_order' });
    testimonials = await pb.collection('testimonials').getFullList<Testimonial>({ filter: 'is_visible = true', sort: 'sort_order' });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  const template = await loadTemplate(settings.active_template);
  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  const AboutPageComponent = template.AboutPage;

  return (
    <AboutPageComponent
      businessInfo={businessInfo}
      serviceAreas={serviceAreas}
      services={services}
      testimonials={testimonials}
      media={media}
      resolvedCopy={resolvedCopy}
      config={settings.template_config || {}}
    />
  );
}
