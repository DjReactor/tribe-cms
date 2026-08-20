import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { cache } from "react";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { getCatalog } from "@/lib/catalog";
import { buildResolvedCopy, resolveTemplateTokens } from "@/lib/template";
import { getServiceRoots } from "@/lib/services";
import {
  getServiceAreas,
  getAreaRoots,
  indexAreas,
  getAreaPath,
  getAreaTrail,
  findAreaNode,
} from "@/lib/service-areas";
import { getPairIndex, servicesWithLanding, localProof } from "@/lib/pairs";
import { buildBreadcrumbSchema } from "@/lib/seo";
import type { ServiceArea, StateItem, ServiceWithLanding, Testimonial, MediaItem } from "@/types";
import { notFound } from "next/navigation";

/**
 * Service-area pages live at the SITE ROOT — `/santa-rosa`, not
 * `/service-areas/santa-rosa` — and the path is flat at every tier of the area
 * hierarchy. That is what keeps a landing page at exactly two segments
 * (`/{area}/{service}`) however deep the geography goes; see `lib/area-tree`.
 *
 * Because this route sits at the root it competes with every static route on
 * the site. Next resolves static segments first, so `/blog` stays the blog —
 * which is precisely why area slugs are validated against
 * `RESERVED_ROOT_SLUGS` on save: an area slugged `blog` would not error, it
 * would silently sit behind the real one.
 */

/**
 * The area record with its state expanded.
 *
 * `ServiceArea.state` is the relation ID; the resolved record rides on
 * `stateRecord`, which is normally undefined because no other route expands it.
 * This route does, deliberately — "Santa Rosa, CA" and region schema need it.
 *
 * Cached per request: `generateMetadata` and the page body both need the record,
 * and without this that is two identical queries on every area page view.
 */
const findArea = cache(async (slug: string): Promise<ServiceArea | null> => {
  try {
    const pb = await getPocketBaseClient();
    const record = await pb.collection('service_areas').getFirstListItem<ServiceArea>(
      `slug="${slug}" && is_active=true`,
      { expand: 'state' },
    );
    const expand = (record as ServiceArea & { expand?: { state?: StateItem } }).expand;
    return { ...record, stateRecord: expand?.state };
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ 'area-slug': string }> }): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const siteUrl = process.env.SITE_URL || '';

  const { 'area-slug': areaSlug } = await params;
  const area = await findArea(areaSlug);
  if (!area) return {};

  const title = area.seo_title || area.name;
  const description = area.seo_description || `${businessInfo.business_type || 'Professional services'} in ${area.name}.`;
  const shouldNoindex = area.noindex || seoSettings?.noindex_service_areas;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}${getAreaPath(area)}` },
    ...(shouldNoindex && { robots: { index: false, follow: true } }),
    openGraph: { title, description, type: 'website' },
  };
}

export default async function ServiceAreaPageWrapper({ params }: { params: Promise<{ 'area-slug': string }> }) {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const siteUrl = process.env.SITE_URL || '';
  const pb = await getPocketBaseClient();

  const resolvedParams = await params;
  const area = await findArea(resolvedParams['area-slug']);
  if (!area) return notFound();

  const template = await loadTemplate(settings.active_template);
  if (!template.ServiceAreaPage) return notFound();

  // ── Hierarchy ────────────────────────────────────────────────────────────
  // The trail and the children are how the area hierarchy reaches users and
  // Google, since the URLs deliberately do not carry it.
  const areaPath = getAreaPath(area);
  const areaTrail = getAreaTrail(area, indexAreas(await getServiceAreas()));
  const childAreas = findAreaNode(await getAreaRoots(), area.id)?.children ?? [];

  // ── The services half of the mutual link ─────────────────────────────────
  // Every service arrives carrying ITS landing page in THIS area as
  // `landingPath`, or null where no pair exists. The template links a path and
  // renders a null as text — it never asks whether a page exists, and creating
  // the pair later turns that text into a link with no template edit.
  const services: ServiceWithLanding[] = servicesWithLanding(
    await getServiceRoots(), area.id, await getPairIndex(),
  );

  let testimonials: Testimonial[] = [];
  let media: MediaItem[] = [];
  try {
    testimonials = await pb.collection('testimonials').getFullList<Testimonial>({ filter: 'is_visible = true', sort: 'sort_order' });
    media = await pb.collection('media').getFullList<MediaItem>({ sort: 'sort_order' });
  } catch (e) {
    // Optional sections — the page still renders without them.
  }

  const locations = await getLocations();
  const projects = await getProjects();
  const { brands, certifications, awards } = await getCatalog();

  // ── Auto-pull ────────────────────────────────────────────────────────────
  // Work done here and reviews from here, matched on the area alone because no
  // single service is in scope. Area pages need this as much as pair pages do:
  // a single-service business publishes no pairs at all, so `/santa-rosa` IS
  // their "Kitchen Remodeling in Santa Rosa" page.
  const { projects: localProjects, testimonials: localTestimonials } =
    localProof({ projects, testimonials }, area);

  const copyOverrides = settings.template_config?.copyOverrides || {};

  // Build template-wide resolvedCopy from manifest + user overrides
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);

  // {{area_name}} is an area-only token. buildResolvedCopy / resolveTemplateTokens
  // only handle the four business tokens, so {{area_name}} survives untouched and is
  // resolved here — scoped to this Service Area route, so other pages are unaffected.
  // Every copy slot on this page (headings, intro, CTA, etc.) gets the live area name.
  for (const key of Object.keys(resolvedCopy)) {
    resolvedCopy[key] = resolvedCopy[key].replace(/\{\{area_name\}\}/g, area.name);
  }

  // Area-specific h1/intro:
  // Priority 1 — per-area DB override (custom_h1 / custom_intro)
  // Priority 2 — template manifest default for service_area_h1 / service_area_intro
  // Priority 3 — last-resort CMS fallback (guards against templates that omit the keys)
  // Business tokens are resolved by resolveTemplateTokens; {{area_name}} by the
  // trailing replace, so whichever branch wins gets both kinds of token resolved.
  const fallbackH1    = `{{business_type}} in {{area_name}}`;
  const fallbackIntro = `Professional {{business_type}} services serving {{area_name}} and surrounding areas.`;

  resolvedCopy.h1 = resolveTemplateTokens(
    area.custom_h1 || resolvedCopy.service_area_h1 || fallbackH1,
    businessInfo
  ).replace(/\{\{area_name\}\}/g, area.name);

  resolvedCopy.intro = resolveTemplateTokens(
    area.custom_intro || resolvedCopy.service_area_intro || fallbackIntro,
    businessInfo
  ).replace(/\{\{area_name\}\}/g, area.name);

  // The full ancestor trail feeds the breadcrumb, so a 4-tier area emits a
  // 5-crumb list (Service Areas › … › this) rather than a fixed two. The index
  // crumb is only offered when that page is actually switched on.
  const breadcrumbSchema = seoSettings?.enable_breadcrumbs !== false
    ? buildBreadcrumbSchema([
        ...(settings.service_areas_index_enabled
          ? [{ name: 'Service Areas', item: `${siteUrl}/service-areas` }]
          : []),
        ...areaTrail.map((crumb) => ({ name: crumb.name, item: `${siteUrl}${crumb.path}` })),
      ])
    : null;

  const ServiceAreaPageComponent = template.ServiceAreaPage;

  return (
    <>
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ServiceAreaPageComponent
        area={area}
        areaPath={areaPath}
        areaTrail={areaTrail}
        childAreas={childAreas}
        businessInfo={businessInfo}
        locations={locations}
        projects={projects}
        brands={brands}
        certifications={certifications}
        awards={awards}
        services={services}
        localProjects={localProjects}
        localTestimonials={localTestimonials}
        media={media}
        resolvedCopy={resolvedCopy}
        config={settings.template_config || {}}
      />
    </>
  );
}
