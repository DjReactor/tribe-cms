# tribe-cms / templates

Parent: `../../AGENTS.md`

## Purpose

The template engine: visual skins ("TemplatePacks") that render the public site from CMS data.

## Ownership

Owns the template component contract, runtime discovery/loading, and per-template assets.

## Local Contracts

- A TemplatePack is a folder `src/templates/<id>/` exporting the required component set: `Layout`, `Header`, `Footer`, `HomePage`, `AboutPage`, `ServicesIndexPage`, `ServiceDetailPage`, `ServiceAreaPage`, `BlogIndexPage`, `BlogPostPage`, `ContactPage`, `PrivacyPage`, `TermsPage` — plus `index.ts` (barrel), `manifest.json`, and `theme.ts`. Optional pages a pack may also export: `ProjectsIndexPage`, `ProjectDetailPage`, `LocationsIndexPage`, `LocationDetailPage`, `BrandsIndexPage`, `BrandDetailPage`, `CertificationsIndexPage`, `CertificationDetailPage`, `AwardsIndexPage`, `AwardDetailPage`, `TestimonialsPage`, `ServiceAreasIndexPage`, `Custom404Page` — when omitted, the matching public route renders a built-in fallback (or 404s if its feature flag is off). Components are pure visual functions of props: no data fetching, no infrastructure coupling.
- Global data props: `serviceAreas`, `locations`, `projects`, and the three catalog arrays `brands` / `certifications` / `awards` (active records; shared `CatalogItem` shape — image + name + description + BlockNote `details` + slug/SEO) are passed to every page component, so a template can render any of these as a section on any page. Templates are pure — they never query; the page wrapper fetches (via `getLocations()` / `getProjects()` / `getCatalog()` / inline) and passes the prop. Gate optional sections on `<array>.length > 0`. Each array is empty everywhere whenever its master switch (`locations_enabled`, `projects_enabled`, `brands_enabled`, `certifications_enabled`, `awards_enabled`) is off, so count-based visibility doubles as the feature gate.
- Discovery is fully dynamic: `../lib/template-registry.ts` reads `src/templates/*` via `fs.readdirSync` (directories only); `../lib/template-loader.ts` does `import(@/templates/<id>/index)` with fallback to `modern`. Never hardcode a template list. The trailing `/index` is required: it scopes the bundler's dynamic-import context to `*/index` so non-template files living in this folder (e.g. this `AGENTS.md`) are not pulled into the module graph. Without it Turbopack fails with "Unknown module type" on the `.md` and every route 500s.
- `modern` is the always-present fallback shipped with every instance. It deliberately does NOT follow the asset convention (empty image fallbacks, Google fonts via `next/font/google`, no `public/assets/modern/` folder).
- Asset convention (every template except `modern`): default images in `public/assets/<template-id>/` with semantic names (`default-hero.webp`, …); custom fonts via `next/font/local`.

## Work Guidance

- `modern` is the only template on disk and doubles as the loader's fallback. It is a demo fixture, not a production pack: it exists so a fresh install has something to render.
- To add a template: drop in a folder with the full component set + `manifest.json`; it appears automatically. Do not edit the loader/registry.
- Authoring details: `Planning Files/template_creator_guide.md`, `Planning Files/template-workflow-guide.md`, `Planning Files/Tribe-Template-Developer-Guide.md`.

## Verification

`pnpm build` — a malformed pack fails to import; the loader falls back to `modern` at runtime.
