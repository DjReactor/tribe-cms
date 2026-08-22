import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPublicPocketBase } from '@/lib/pocketbase-public';
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { getCatalog } from "@/lib/catalog";
import type { ServiceAreaNode, Testimonial, ServiceNode } from "@/types";
import { buildLocalBusinessSchema } from "@/lib/seo";
import { getActivePalette, generatePaletteCss } from "@/lib/color-palette";
import { getServiceList } from "@/lib/services";
import { getAreaList } from "@/lib/service-areas";

/**
 * ISR. Public pages are prerendered and cached; the dashboard invalidates the
 * affected paths on save (see the `revalidatePath` calls in the dashboard
 * action files), so an edit is live on the next request.
 *
 * `revalidate` is the backstop for the case that invalidation is *missed* — a
 * write path that forgets to call `revalidatePath` would otherwise serve stale
 * HTML forever, silently. One hour caps that at an hour.
 *
 * Everything under here must stay free of request APIs (`cookies()`,
 * `headers()`, `searchParams`) or the route silently drops back to
 * per-request rendering. That is what `lib/pocketbase-public.ts` is for.
 */
export const revalidate = 3600;

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
  const siteUrl = process.env.SITE_URL || '';

  const pb = await getPublicPocketBase();
  let serviceAreas: ServiceAreaNode[] = [];
  let testimonials: Testimonial[] = [];
  let services: ServiceNode[] = [];

  try {
    serviceAreas = await getAreaList();
    testimonials = await pb.collection('testimonials').getFullList<Testimonial>({ filter: 'is_visible = true' });
    services = await getServiceList();
  } catch(e) {
    console.error('Failed to load data for layout', e);
  }

  const locations = await getLocations();
  const projects = await getProjects();
  const { brands, certifications, awards } = await getCatalog();

  const template = await loadTemplate(settings.active_template);
  const palette = await getActivePalette(template.manifest?.defaultPalette);
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
        locations={locations}
        projects={projects}
        brands={brands}
        certifications={certifications}
        awards={awards}
        settings={settings}
        config={settings.template_config || {}}
      >
        {children}
      </LayoutComponent>
    </>
  );
}
