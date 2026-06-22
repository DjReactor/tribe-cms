# tribe-cms / templates

Parent: `../../AGENTS.md`

## Purpose

The template engine: visual skins ("TemplatePacks") that render the public site from CMS data.

## Ownership

Owns the template component contract, runtime discovery/loading, and per-template assets.

## Local Contracts

- A TemplatePack is a folder `src/templates/<id>/` exporting the required component set: `Layout`, `Header`, `Footer`, `HomePage`, `AboutPage`, `ServicesIndexPage`, `ServiceDetailPage`, `ServiceAreaPage`, `ProjectsIndexPage`, `ProjectDetailPage`, `BlogIndexPage`, `BlogPostPage`, `ContactPage`, `PrivacyPage`, `TermsPage` — plus `index.ts` (barrel), `manifest.json`, and `theme.ts`. Components are pure visual functions of props: no data fetching, no infrastructure coupling.
- Discovery is fully dynamic: `../lib/template-registry.ts` reads `src/templates/*` via `fs.readdirSync` (directories only); `../lib/template-loader.ts` does `import(@/templates/<id>/index)` with fallback to `modern`. Never hardcode a template list. The trailing `/index` is required: it scopes the bundler's dynamic-import context to `*/index` so non-template files living in this folder (e.g. this `AGENTS.md`) are not pulled into the module graph. Without it Turbopack fails with "Unknown module type" on the `.md` and every route 500s.
- `modern` is the always-present fallback shipped with every instance. It deliberately does NOT follow the asset convention (empty image fallbacks, Google fonts via `next/font/google`, no `public/assets/modern/` folder).
- Asset convention (every template except `modern`): default images in `public/assets/<template-id>/` with semantic names (`default-hero.webp`, …); custom fonts via `next/font/local`.

## Work Guidance

- Only two templates going forward: `modern` (fallback) and `green-yard` (the real reference, developed in the separate Templating Env workspace; it imports its own `public/assets/green-yard/` when added).
- To add a template: drop in a folder with the full component set + `manifest.json`; it appears automatically. Do not edit the loader/registry.
- Authoring details: `Planning Files/template_creator_guide.md`, `Planning Files/template-workflow-guide.md`, `Planning Files/Tribe-Template-Developer-Guide.md`.

## Verification

`pnpm build` — a malformed pack fails to import; the loader falls back to `modern` at runtime.
