import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import type { ServiceArea, Testimonial, Service } from "@/types";
import { buildLocalBusinessSchema } from "@/lib/seo";
import { getActivePalette, generatePaletteCss } from "@/lib/color-palette";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();

  const siteName = seoSettings?.site_name || businessInfo.business_name;
  const separator = seoSettings?.title_separator || '|';
  const description = businessInfo.short_description || businessInfo.tagline || '';

  return {
    title: {
      default: siteName,
      template: `%s ${separator} ${siteName}`,
    },
    description,
    openGraph: {
      siteName,
      locale: 'en_US',
      type: 'website',
      ...(seoSettings?.default_og_image && {
        images: [{ url: seoSettings.default_og_image }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      ...(seoSettings?.twitter_handle && {
        site: `@${seoSettings.twitter_handle}`,
      }),
    },
    ...(seoSettings?.google_verification && {
      verification: {
        google: seoSettings.google_verification,
        ...(seoSettings.bing_verification && {
          other: { 'msvalidate.01': [seoSettings.bing_verification] },
        }),
      },
    }),
  };
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const palette = await getActivePalette();
  const siteUrl = process.env.SITE_URL || '';

  const pb = await getPocketBaseClient();
  let serviceAreas: ServiceArea[] = [];
  let testimonials: Testimonial[] = [];
  let services: Service[] = [];

  try {
    serviceAreas = await pb.collection('service_areas').getFullList<ServiceArea>({
      filter: 'is_active = true',
      sort: 'sort_order'
    });
    testimonials = await pb.collection('testimonials').getFullList<Testimonial>({ filter: 'is_visible = true' });
    services = await pb.collection('services').getFullList<Service>({ filter: 'is_active = true' });
  } catch(e) {
    console.error('Failed to load data for layout', e);
  }

  const template = await loadTemplate(settings.active_template);
  const LayoutComponent = template.Layout;
  const jsonLd = buildLocalBusinessSchema(businessInfo, seoSettings, testimonials, services, serviceAreas, siteUrl);
  const paletteCss = generatePaletteCss(palette.colors);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: paletteCss }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LayoutComponent
        businessInfo={businessInfo}
        serviceAreas={serviceAreas}
        services={services}
        settings={settings}
        config={settings.template_config || {}}
      >
        {children}
      </LayoutComponent>
    </>
  );
}
