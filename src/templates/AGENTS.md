# tribe-cms / templates

Parent: `../../AGENTS.md`

## Purpose

The template engine: visual skins ("TemplatePacks") that render the public site from CMS data.

## Ownership

Owns the template component contract, runtime discovery/loading, and per-template assets.

## Local Contracts

- A TemplatePack is a folder `src/templates/<id>/` exporting the required component set: `Layout`, `Header`, `Footer`, `HomePage`, `AboutPage`, `ServicesIndexPage`, `ServiceDetailPage`, `ServiceAreaPage`, `BlogIndexPage`, `BlogPostPage`, `ContactPage`, `PrivacyPage`, `TermsPage` — plus `index.ts` (barrel), `manifest.json`, and `theme.ts`. Optional pages a pack may also export: `ProjectsIndexPage`, `ProjectDetailPage`, `LocationsIndexPage`, `LocationDetailPage`, `BrandsIndexPage`, `BrandDetailPage`, `CertificationsIndexPage`, `CertificationDetailPage`, `AwardsIndexPage`, `AwardDetailPage`, `TestimonialsPage`, `ServiceAreasIndexPage`, `PairPage`, `Custom404Page` — when omitted, the matching public route renders a built-in fallback from `components/shared/TemplateFallbacks.tsx` — because the sitemap advertises those URLs unconditionally and a 404 there means losing content the client wrote. The four exceptions still 404 on omission, and they are exactly the four the sitemap does not list: `ServiceAreasIndexPage` (also behind `service_areas_index_enabled`), `TestimonialsPage`, `PrivacyPage`, `TermsPage`. `PairPage` is the landing page at `/{area}/{service}` and has no feature flag at all — a page exists wherever the agency published a `pairs` record, and omitting the component gets the minimal built-in view rather than a 404, because that content is already in the sitemap and linked from the dashboard. Components are pure visual functions of props: no data fetching, no infrastructure coupling.
- Global data props: `serviceAreas` (a `ServiceAreaNode[]` — every area carries `depth`, `children` and a precomputed flat `path`, so no template builds an area URL from a slug), `locations`, `projects`, and the three catalog arrays `brands` / `certifications` / `awards` (active records; shared `CatalogItem` shape — image + name + description + BlockNote `details` + slug/SEO) are passed to every page component, so a template can render any of these as a section on any page. Templates are pure — they never query; the page wrapper fetches (via `getLocations()` / `getProjects()` / `getCatalog()` / inline) and passes the prop. Gate optional sections on `<array>.length > 0`. Each array is empty everywhere whenever its master switch (`locations_enabled`, `projects_enabled`, `brands_enabled`, `certifications_enabled`, `awards_enabled`) is off, so count-based visibility doubles as the feature gate.
- Discovery is fully dynamic: `../lib/template-registry.ts` reads `src/templates/*` via `fs.readdirSync` (directories only); `../lib/template-loader.ts` does `import(@/templates/<id>/index)` with fallback to `modern`. Never hardcode a template list. The trailing `/index` is required: it scopes the bundler's dynamic-import context to `*/index` so non-template files living in this folder (e.g. this `AGENTS.md`) are not pulled into the module graph. Without it Turbopack fails with "Unknown module type" on the `.md` and every route 500s.
- **The link-or-text rule.** Where a service and an area meet, each side arrives with the other's landing page resolved as `landingPath` — the URL, or `null` when nobody wrote that page. A path is a link; a null is text. Templates never test whether a page exists and never assemble `/{area}/{service}`. Never substitute the area hub for a null on a service page, and never link `area.also_serving` entries — those are named to prove coverage and deliberately have no pages. Full contract: `../../AGENTS.md` and `Planning Files/template_creator_guide.md` §7.1.
- `modern` is the always-present fallback shipped with every instance. It deliberately does NOT follow the asset convention (empty image fallbacks, Google fonts via `next/font/google`, no `public/assets/modern/` folder).
- Asset convention (every template except `modern`): default images in `public/assets/<template-id>/` with semantic names (`default-hero.webp`, …); custom fonts via `next/font/local`.

## Work Guidance

- `modern` is the only template on disk and doubles as the loader's fallback. It is a demo fixture, not a production pack: it exists so a fresh install has something to render.
- To add a template: drop in a folder with the full component set + `manifest.json`; it appears automatically. Do not edit the loader/registry.
- Authoring details: `Planning Files/template_creator_guide.md`, `Planning Files/template-workflow-guide.md`, `Planning Files/Tribe-Template-Developer-Guide.md`.

## Verification

`pnpm build` — a malformed pack fails to import; the loader falls back to `modern` at runtime.
