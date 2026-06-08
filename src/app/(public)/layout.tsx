import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import type { ServiceArea, Testimonial, Service } from "@/types";
import { buildLocalBusinessSchema } from "@/lib/seo";
import { getActivePalette, generatePaletteCss } from "@/lib/color-palette";

export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const palette = await getActivePalette();
  
  const pb = await getPocketBaseClient();
  let serviceAreas: ServiceArea[] = [];
  let testimonials: Testimonial[] = [];
  let services: Service[] = [];
  let seoSettings = null;
  
  try {
    seoSettings = await pb.collection('seo_settings').getFirstListItem('');
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
  const jsonLd = buildLocalBusinessSchema(businessInfo, seoSettings, testimonials, services, serviceAreas);
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
        settings={settings}
        config={settings.template_config || {}}
      >
        {children}
      </LayoutComponent>
    </>
  );
}
