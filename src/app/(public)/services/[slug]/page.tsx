import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { getCatalog } from "@/lib/catalog";
import {
  getServices,
  indexServices,
  getAncestors,
  getServicePath,
  getServiceTrail,
  buildServiceTree,
  findServiceNode,
} from "@/lib/services";
import { buildServiceSchema, buildBreadcrumbSchema } from "@/lib/seo";
import type { Service, ServiceArea, BeforeAfterPair, MediaItem } from "@/types";
import { notFound } from "next/navigation";

/**
 * One dynamic segment, matched exactly against a globally unique slug
 * (migration 2010000000). Service URLs are flat at every tier, so this route
 * sees the whole address and there is nothing to reconcile: `/services/<slug>`
 * or nothing.
 *
 * A NESTED path like `/services/remodeling/kitchen` 404s, deliberately. The
 * site never emits one — the hierarchy lives in navigation and breadcrumbs, not
 * in the address — so the only source of one is an inbound link, typically from
 * a site a client migrated off. Those get a rule in the redirects UI, aimed at
 * the handful of URLs that actually have history, rather than a catch-all that
 * resolves anything ending in a valid slug.
 */
async function resolve(slug: string) {
  const services = await getServices();
  const service = services.find((s) => s.slug === slug);
  if (!service) return null;
  return { service, services, byId: indexServices(services) };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) return {};

  const { service } = resolved;
  const title = service.seo_title || service.name;
  const description = service.seo_description || service.short_description || '';

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}${getServicePath(service)}` },
    ...(service.noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      type: 'website',
      ...(service.cover_image_url && {
        images: [{ url: service.cover_image_url }],
      }),
    },
  };
}

export default async function ServiceDetailPageWrapper(
  { params }: { params: Promise<{ slug: string }> },
) {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const siteUrl = process.env.SITE_URL || '';

  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) return notFound();

  const { service, services, byId } = resolved;
  const servicePath = getServicePath(service);

  const pb = await getPocketBaseClient();
  let serviceAreas: ServiceArea[] = [];
  let beforeAfterPairs: BeforeAfterPair[] = [];
  let media: MediaItem[] = [];
  try {
    serviceAreas = await pb.collection('service_areas').getFullList<ServiceArea>({ filter: 'is_active = true', sort: 'sort_order' });
    beforeAfterPairs = await pb.collection('before_after_pairs').getFullList<BeforeAfterPair>({ filter: 'is_active = true', sort: 'sort_order' });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch (e) {
    // Optional sections — the page still renders without them.
  }

  const locations = await getLocations();
  const projects = await getProjects();
  const { brands, certifications, awards } = await getCatalog();

  const template = await loadTemplate(settings.active_template);
  if (!template.ServiceDetailPage) return notFound();
  const ServiceDetailPageComponent = template.ServiceDetailPage;

  const parentChain: Service[] = getAncestors(service, byId);
  // Straight off the tree so each child arrives with its canonical path.
  const childServices = findServiceNode(buildServiceTree(services), service.id)?.children ?? [];
  const serviceTrail = getServiceTrail(service, byId);

  const serviceSchema = buildServiceSchema(service, businessInfo, siteUrl, servicePath);
  // The full ancestor trail feeds the breadcrumb, so a 3-tier service emits a
  // 4-crumb list (Services › … › this) instead of the old fixed two.
  const breadcrumbSchema = seoSettings?.enable_breadcrumbs !== false
    ? buildBreadcrumbSchema([
        { name: 'Services', item: `${siteUrl}/services` },
        ...serviceTrail.map((crumb) => ({ name: crumb.name, item: `${siteUrl}${crumb.path}` })),
      ])
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ServiceDetailPageComponent
        service={service}
        parentChain={parentChain}
        childServices={childServices}
        serviceTrail={serviceTrail}
        servicePath={servicePath}
        businessInfo={businessInfo}
        serviceAreas={serviceAreas}
        locations={locations}
        projects={projects}
        brands={brands}
        certifications={certifications}
        awards={awards}
        beforeAfterPairs={beforeAfterPairs}
        media={media}
        config={settings.template_config || {}}
      />
    </>
  );
}
