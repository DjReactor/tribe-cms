import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPublicPocketBase } from '@/lib/pocketbase-public';
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { getCatalog } from "@/lib/catalog";
import { buildResolvedCopy } from "@/lib/template";
import { getAreaList } from "@/lib/service-areas";
import type { ServiceAreaNode, MediaItem } from "@/types";
import { ContactFallback } from '@/components/shared/TemplateFallbacks';

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
  const pb = await getPublicPocketBase();

  let serviceAreas: ServiceAreaNode[] = [];
  let media: MediaItem[] = [];
  try {
    serviceAreas = await getAreaList();
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  const locations = await getLocations();
  const projects = await getProjects();
  const { brands, certifications, awards } = await getCatalog();

  const template = await loadTemplate(settings.active_template);

  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  const ContactPageComponent = template.ContactPage;
  // The sitemap lists /contact unconditionally, so it has to render something —
  // and a contact page with no way to make contact is not a page.
  if (!ContactPageComponent) {
    return <ContactFallback businessInfo={businessInfo} heading={resolvedCopy.contact_heading} />;
  }

  return (
    <ContactPageComponent
      businessInfo={businessInfo}
      serviceAreas={serviceAreas}
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