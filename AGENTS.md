# tribe-cms

Parent: `../AGENTS.md`

## Purpose

The per-client product: a public marketing website plus a Business-Owner (BO) dashboard. This is the artifact deployed once per client instance. Next.js 16 (App Router, Turbopack) / React 19 / PocketBase backend / Tailwind 4, with BlockNote rich-text, Mantine, framer-motion, and react-hook-form + zod. Version 0.3.7.

## Ownership

Owns the public site, the BO dashboard, the PocketBase schema/migrations/seed, the template engine, and the on-VPS deploy pipeline. This is a **git submodule** — edits here commit to the `tribe-cms` repo, not the parent.

## Local Contracts

- App Router under `src/app/`:
  - `(public)/` — public site: home, about, services, service-areas, `[area-slug]`, projects, locations, `locations/[slug]`, blog, testimonials, contact, privacy-policy, terms-of-service.
  - `dashboard/` — BO admin: blog, business-info, call-logs, content, crm, design, locations, media, projects, security, seo, service-areas, services, settings, testimonials (server logic in `dashboard/actions.ts`).
  - `api/` — `auth`, `contact`, `internal`, `tribe`, `webhooks`.
  - `login/`, plus `sitemap.ts`, `robots.ts`, `sitemap-images.xml/`.
- `src/lib/` — data + infra access: PocketBase via `pocketbase.ts` (user) and `pocketbase-admin.ts` (admin); auth in `auth.ts` / `webhook-auth.ts`; `seo.ts`, `settings.ts`, `projects.ts`, `images.ts`; color system in `color-palette.ts` (+ `src/data/default-palettes.json`); template resolution in `template-registry.ts` / `template-loader.ts` / `template.ts`.
- PocketBase backend: schema/migrations are timestamp-prefixed JS files in `pb_migrations/` (applied in order); seed data in `pb_seed/`. Schema is identical across architecture versions.
- Templates live in `src/templates/<id>/` — see child doc.
- Deploy / build / release scripts live in `scripts/` — see child doc.
- A dual-palette color system is active (see `pb_migrations/*dual_palette*` and `color-palette.ts`).

## Work Guidance

- Confirm the architecture version (V1 is current) before structural backend changes; do not import V3/V4 assumptions into V1 PocketBase code.
- Prefer Tribe naming (`tribe`, `--tribe-*`) over legacy `sf` / `--sf-*` in new code.

## Verification

`pnpm install`, then `pnpm lint` and `pnpm build` (Next.js 16 + Turbopack).

## Child DOX Index

- `src/templates/AGENTS.md` — template engine: TemplatePack component contract, dynamic discovery, per-template asset convention.
- `scripts/AGENTS.md` — on-VPS 18-step deploy pipeline, release publishing, seed/migrate helpers.
