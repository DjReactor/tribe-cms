import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { notFound } from "next/navigation";
import type { Testimonial, MediaItem } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';
  return {
    title: 'Reviews',
    description: `See what customers are saying about ${businessInfo.business_name}.`,
    alternates: { canonical: `${siteUrl}/testimonials` },
  };
}

export default async function TestimonialsPageWrapper() {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const template = await loadTemplate(settings.active_template);

  if (!template.TestimonialsPage) return notFound();

  const pb = await getPocketBaseClient();
  let testimonials: Testimonial[] = [];
  let media: MediaItem[] = [];

  try {
    testimonials = await pb.collection('testimonials').getFullList<Testimonial>({
      filter: 'is_visible = true', sort: 'sort_order'
    });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch(e) {}

  const locations = await getLocations();

  const TestimonialsPageComponent = template.TestimonialsPage;
  const config = settings.template_config || {};

  return (
    <TestimonialsPageComponent
      testimonials={testimonials}
      businessInfo={businessInfo}
      locations={locations}
      media={media}
      config={config}
    />
  );
}
