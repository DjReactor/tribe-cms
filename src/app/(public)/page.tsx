import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPublicPocketBase } from '@/lib/pocketbase-public';
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { getCatalog } from "@/lib/catalog";
import { buildResolvedCopy } from "@/lib/template";
import { getServiceList } from "@/lib/services";
import { getAreaList } from "@/lib/service-areas";
import type { ServiceNode, ServiceAreaNode, Testimonial, MediaItem, BeforeAfterPair } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const siteUrl = process.env.SITE_URL || '';

  const siteName = seoSettings?.site_name || businessInfo.business_name;
  const description = businessInfo.short_description || businessInfo.tagline || '';

  return {
    title: { absolute: siteName },
    description,
    alternates: { canonical: siteUrl || '/' },
    openGraph: {
      title: siteName,
      description,
      type: 'website',
      ...(seoSettings?.default_og_image && {
        images: [{ url: seoSettings.default_og_image }],
      }),
    },
  };
}

export default async function HomePageWrapper() {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const pb = await getPublicPocketBase();
  
  let services: ServiceNode[] = [];
  let serviceAreas: ServiceAreaNode[] = [];
  let testimonials: Testimonial[] = [];
  let media: MediaItem[] = [];
  let beforeAfterPairs: BeforeAfterPair[] = [];
  
  try {
    services = await getServiceList();
    serviceAreas = await getAreaList();
    testimonials = await pb.collection('testimonials').getFullList<Testimonial>({ filter: 'is_visible = true', sort: 'sort_order' });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
    beforeAfterPairs = await pb.collection('before_after_pairs').getFullList<BeforeAfterPair>({ filter: 'is_active = true', sort: 'sort_order' });
  } catch(e) {}

  const locations = await getLocations();
  const projects = await getProjects();
  const { brands, certifications, awards } = await getCatalog();

  const template = await loadTemplate(settings.active_template);
  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  const HomePageComponent = template.HomePage;

  return (
    <HomePageComponent
      businessInfo={businessInfo}
      resolvedCopy={resolvedCopy}
      services={services}
      serviceAreas={serviceAreas}
      locations={locations}
      projects={projects}
      brands={brands}
      certifications={certifications}
      awards={awards}
      testimonials={testimonials}
      media={media}
      beforeAfterPairs={beforeAfterPairs}
      config={settings.template_config || {}}
    />
  );
}

