import type { Metadata } from "next";
import { loadTemplate } from "@/lib/template-loader";
import { getSettings, getBusinessInfo, getSeoSettings } from "@/lib/settings";
import { getPocketBaseClient } from "@/lib/pocketbase";
import { getLocations } from "@/lib/locations";
import { getProjects } from "@/lib/projects";
import { getCatalog } from "@/lib/catalog";
import { buildResolvedCopy, resolveTemplateTokens } from "@/lib/template";
import { getServiceRoots, getServicePath } from "@/lib/services";
import { getAreaList, getAreaPath } from "@/lib/service-areas";
import {
  resolveLivePair,
  getPairIndex,
  servicesWithLanding,
  localProof,
} from "@/lib/pairs";
import { getPairPath } from "@/lib/pair-readiness";
import { buildServiceSchema, buildBreadcrumbSchema } from "@/lib/seo";
import { PairFallback } from "@/components/shared/TemplateFallbacks";
import type { ServiceArea, StateItem, ServiceWithLanding, Testimonial, MediaItem } from "@/types";
import { notFound } from "next/navigation";

/**
 * A landing page: exactly one service in exactly one area, at
 * `/{area.slug}/{pair.slug}`.
 *
 * TWO PLAIN DYNAMIC SEGMENTS, never a catch-all. Area paths are flat at every
 * tier precisely so this address is always two segments — a nested area path
 * would make it `/new-york/new-york-city/manhattan/kitchen-remodeling`, and the
 * router could not tell where the area ends and the service begins.
 *
 * Pairs are OPT-IN RECORDS, not a computed route: an unpaired combination has
 * no record and 404s here, so the page count equals what somebody actually
 * wrote. That is the whole design — Google's doorway policy names city-targeted
 * page families, and thin-content actions have landed on sites whose per-page
 * copy was uniquely human-written, on volume alone.
 *
 * Root-namespace note: this sits under `[area-slug]`, so it competes with every
 * static route on the site. Next resolves static segments first — `/blog/foo`
 * stays the blog — and that is exactly why area slugs are validated against
 * `RESERVED_ROOT_SLUGS` on save.
 */

/** The area with its state expanded — see the note on the area route. */
async function expandArea(area: ServiceArea): Promise<ServiceArea> {
  try {
    const pb = await getPocketBaseClient();
    const record = await pb.collection('service_areas').getOne<ServiceArea>(area.id, { expand: 'state' });
    const expand = (record as ServiceArea & { expand?: { state?: StateItem } }).expand;
    return { ...record, stateRecord: expand?.state };
  } catch {
    return area;
  }
}

type RouteParams = { params: Promise<{ 'area-slug': string; 'pair-slug': string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const businessInfo = await getBusinessInfo();
  const siteUrl = process.env.SITE_URL || '';

  const { 'area-slug': areaSlug, 'pair-slug': pairSlug } = await params;
  const resolved = await resolveLivePair(areaSlug, pairSlug);
  if (!resolved) return {};

  const { pair, area, service } = resolved;
  const title = pair.seo_title || pair.h1 || `${service.name} in ${area.name}`;
  const description = pair.seo_description
    || pair.intro
    || `${service.name} in ${area.name} from ${businessInfo.business_name}.`;

  return {
    title,
    description,
    // Its own URL, always. A pair is a page in its own right, not a variant of
    // the service page or the area page.
    alternates: { canonical: `${siteUrl}${getPairPath(area.slug, pair.slug)}` },
    ...(pair.noindex && { robots: { index: false, follow: true } }),
    openGraph: { title, description, type: 'website' },
  };
}

export default async function PairPageWrapper({ params }: RouteParams) {
  const settings = await getSettings();
  const businessInfo = await getBusinessInfo();
  const seoSettings = await getSeoSettings();
  const siteUrl = process.env.SITE_URL || '';

  const { 'area-slug': areaSlug, 'pair-slug': pairSlug } = await params;

  // No record, unpublished, or a service/area that has since been hidden — all
  // of them 404. Nothing here invents a page for a combination nobody wrote.
  const resolved = await resolveLivePair(areaSlug, pairSlug);
  if (!resolved) return notFound();

  const { pair, service } = resolved;
  const area = await expandArea(resolved.area);

  const template = await loadTemplate(settings.active_template);

  const pairPath = getPairPath(area.slug, pair.slug);
  const servicePath = getServicePath(service);

  const pb = await getPocketBaseClient();
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
  const serviceAreas = await getAreaList();
  const { brands, certifications, awards } = await getCatalog();

  // ── Auto-pull ────────────────────────────────────────────────────────────
  // Work matching BOTH this service and this area, and reviews naming the area.
  // The review test is the same one the dashboard readiness checklist counts
  // with, so the agency is never told this page has proof it does not show.
  const { projects: localProjects, testimonials: localTestimonials } =
    localProof({ projects, testimonials }, area, service.id);

  // Every service with its landing page IN THIS AREA resolved — the sibling
  // pages a visitor on this page might actually want.
  const services: ServiceWithLanding[] = servicesWithLanding(
    await getServiceRoots(), area.id, await getPairIndex(),
  );

  // ── Copy ─────────────────────────────────────────────────────────────────
  // `{{service_name}}` and `{{area_name}}` are landing-page-only tokens, so
  // they survive buildResolvedCopy untouched and are resolved here, scoped to
  // this route. Other pages are unaffected.
  const copyOverrides = settings.template_config?.copyOverrides || {};
  const resolvedCopy = buildResolvedCopy(template.manifest?.supportedCopyKeys, copyOverrides, businessInfo);
  const fillLocal = (text: string) => text
    .replace(/\{\{service_name\}\}/g, service.name)
    .replace(/\{\{area_name\}\}/g, area.name);

  for (const key of Object.keys(resolvedCopy)) {
    resolvedCopy[key] = fillLocal(resolvedCopy[key]);
  }

  // Priority 1 — the pair's own copy. Priority 2 — the template's pair slots.
  // Priority 3 — a last-resort CMS fallback for templates that omit the keys.
  // The readiness checklist nags about an empty h1/intro precisely because
  // every pair falling through to the same generated heading is the shape this
  // whole feature exists to avoid.
  resolvedCopy.h1 = fillLocal(resolveTemplateTokens(
    pair.h1 || resolvedCopy.pair_h1 || `{{service_name}} in {{area_name}}`,
    businessInfo,
  ));
  resolvedCopy.intro = fillLocal(resolveTemplateTokens(
    pair.intro || resolvedCopy.pair_intro || `{{service_name}} from {{business_name}}, serving {{area_name}}.`,
    businessInfo,
  ));

  // ── Structured data ──────────────────────────────────────────────────────
  // A Service, served in this area. `areaServed` is what makes this page's
  // markup differ from the service page's rather than duplicate it.
  const serviceSchema: Record<string, unknown> = {
    ...buildServiceSchema(service, businessInfo, siteUrl, pairPath),
    // The rendered H1, not a second guess at it — schema describes the page.
    name: resolvedCopy.h1,
    areaServed: {
      '@type': 'City',
      name: area.name,
      ...(area.stateRecord?.name && {
        containedInPlace: { '@type': 'State', name: area.stateRecord.name },
      }),
      ...(area.geo_latitude && area.geo_longitude && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: area.geo_latitude,
          longitude: area.geo_longitude,
        },
      }),
    },
  };

  // Home › Area › this page. The area is the first URL segment, so it is the
  // one real ancestor a landing page has. The last crumb is the service name
  // rather than the H1 — a breadcrumb wants a label, not a headline.
  const trail = [
    { name: area.name, path: getAreaPath(area) },
    { name: service.name, path: pairPath },
  ];
  const breadcrumbSchema = seoSettings?.enable_breadcrumbs !== false
    ? buildBreadcrumbSchema([
        { name: 'Home', item: siteUrl || '/' },
        ...trail.map((crumb) => ({ name: crumb.name, item: `${siteUrl}${crumb.path}` })),
      ])
    : null;

  const PairPageComponent = template.PairPage;

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
      {PairPageComponent ? (
        <PairPageComponent
          pair={pair}
          service={service}
          area={area}
          pairPath={pairPath}
          servicePath={servicePath}
          trail={trail}
          resolvedCopy={resolvedCopy}
          localProjects={localProjects}
          localTestimonials={localTestimonials}
          services={services}
          businessInfo={businessInfo}
          serviceAreas={serviceAreas}
          locations={locations}
          projects={projects}
          brands={brands}
          certifications={certifications}
          awards={awards}
          media={media}
          config={settings.template_config || {}}
        />
      ) : (
        <PairFallback
          pair={pair}
          service={service}
          area={area}
          servicePath={servicePath}
          trail={trail}
          h1={resolvedCopy.h1}
          intro={resolvedCopy.intro}
        />
      )}
    </>
  );
}
