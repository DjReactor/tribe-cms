import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { buildResolvedCopy } from "@/lib/template";
import type { Service, MediaItem } from "@/types";

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
  
  let services: Service[] = [];
  let media: MediaItem[] = [];
  try {
    services = await pb.collection('services').getFullList<Service>({ filter: 'is_active = true', sort: 'sort_order' });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  const template = await loadTemplate(settings.active_template);
  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  const ServicesIndexPageComponent = template.ServicesIndexPage;

  return (
    <ServicesIndexPageComponent
      services={services}
      businessInfo={businessInfo}
      media={media}
      resolvedCopy={resolvedCopy}
      config={settings.template_config || {}}
    />
  );
}