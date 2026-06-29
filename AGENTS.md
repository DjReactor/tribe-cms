# tribe-cms

Parent: `../AGENTS.md`

## Purpose

The per-client product: a public marketing website plus a Business-Owner (BO) dashboard. This is the artifact deployed once per client instance. Next.js 16 (App Router, Turbopack) / React 19 / PocketBase backend / Tailwind 4, with BlockNote rich-text, Mantine, framer-motion, and react-hook-form + zod. Version 0.4.0.

## Ownership

Owns the public site, the BO dashboard, the PocketBase schema/migrations/seed, the template engine, and the on-VPS deploy pipeline. This is a **git submodule** — edits here commit to the `tribe-cms` repo, not the parent.

## Local Contracts

- App Router under `src/app/`:
  - `(public)/` — public site: home, about, services, service-areas, `[area-slug]`, projects, locations, `locations/[slug]`, blog, testimonials, contact, privacy-policy, terms-of-service.
  - `dashboard/` — BO admin: blog, business-info, call-logs, content, crm (incl. contact-detail `crm/[id]`: unified activity timeline + per-contact deal management + manual compose), deals, analytics, design, locations, media, projects, security, seo, service-areas, services, settings (incl. `settings/agency`, `settings/lead-sources`), testimonials (server logic in `dashboard/actions.ts`).
  - `api/` — `auth`, `contact`, `internal`, `tribe`, `webhooks`.
  - `login/`, plus `sitemap.ts`, `robots.ts`, `sitemap-images.xml/`.
- `src/lib/` — data + infra access: PocketBase via `pocketbase.ts` (user) and `pocketbase-admin.ts` (admin); auth in `auth.ts` / `webhook-auth.ts`; `seo.ts`, `settings.ts`, `lead-sources.ts` (source-attribution picklist resolver), `automation.ts` (outbound event dispatch → durable outbox → n8n), `crm-writes.ts` (shared CRM mutation + activity/event side-effects, used by dashboard actions and the inbound API), `crm-api.ts` (inbound CRM auth + enum/alias resolution), `projects.ts`, `images.ts`; color system in `color-palette.ts` (+ `src/data/default-palettes.json`); template resolution in `template-registry.ts` / `template-loader.ts` / `template.ts`.
- PocketBase backend: schema/migrations are timestamp-prefixed JS files in `pb_migrations/` (applied in order); seed data in `pb_seed/`. Schema is identical across architecture versions. The CRM/automation layer (Automation & CRM plan) added the `lead_sources`, `deals`, `activities`, `messages`, and `event_outbox` collections, converted `contacts.source` to a `lead_sources` relation (legacy text kept as `source_text_legacy`), enriched `ai_call_logs` with the Retell Get-Call schema (+ unique `call_id`), added `automation_*` fields to `settings`, a `source_spend` collection, and analytics **view collections** (read-only `SELECT … GROUP BY`) — migrations `1870000000`–`1940000000`. JSVM migration gotchas: a live field's `type` is a method (`f.type()`); field renames don't persist in place — drop+re-add and backfill.
- Automation/outbox (Automation & CRM plan, Phase 1): outbound events to n8n flow through `src/lib/automation.ts` — `dispatchEvent()` enqueues an HMAC-signed envelope (plan §5.1) into the durable `event_outbox` collection (migration `1870000000`, admin-only) and delivers best-effort; failures retry with backoff. SSRF-guarded by `settings.automation_allowed_host` (falls back to legacy `lead_webhook_*` for one release). A per-instance PM2 worker `scripts/drain-worker.js` (process `tribe-${SLUG}-drain`) polls `api/internal/outbox/drain` (Bearer `INTERNAL_SECRET`) to drain the backlog; `dashboard/outbox` (agency-admin) surfaces status counts + failed/dead rows with a retry-all action. Emitters: `api/contact` emits `lead.created` directly; `deal.created`/`deal.stage_changed`/`deal.won`/`deal.lost` and `contact.lifecycle_changed` are emitted from the shared `src/lib/crm-writes.ts` helpers (called by both `dashboard/{deals,crm}/actions.ts` and the inbound CRM API), so the dashboard and n8n produce identical activity + event side-effects. The Retell webhook (`api/webhooks/retell`) emits `call.completed` once a call is analyzed. The contact-detail compose box (`crm/[id]` → `requestMessageSend`) emits `message.send_requested`; n8n sends and logs the outbound back via `api/internal/crm/messages`.
- Inbound CRM write-back API (Automation & CRM plan, Phases 2–3): `api/internal/crm/*` lets n8n write into the CRM — `contacts` (POST upsert by email/phone; `[id]` PATCH), `deals` (POST create; `[id]` PATCH stage/value), `activities` (POST), `messages` (POST, deduped on unique `external_id`; `messages/status` POST). Unmatched inbound messages/calls auto-resolve a contact by phone/email (`findOrCreateContact`). All guarded by `guardCrm` (`crm-api.ts`) — `authenticateWebhook` auth (HMAC, Bearer `INTERNAL_SECRET`, or any `api_keys` row; n8n mints a key in the Security UI) + a per-IP rate limit (429; `CRM_RATE_LIMIT_MAX`/min) — use `getAdminPocketBase`, and canonicalize `select` enums through `crm-api.ts` (400 + allowed list on a miss); `source` resolves via `lead-sources.ts`. Stage/lifecycle changes run the `crm-writes.ts` side-effects. Responses are JSON (`{id,created}` / `{ok:true}` / `{id}`); errors 400/401/404/500.
- Analytics (Automation & CRM plan, Phase 5): `dashboard/analytics` reads PocketBase **view collections** (`analytics_*` — funnel, summary scalars, revenue-by-source, top-referrers, cost-per-job/ROAS by close-month + lead-cohort, call-outcomes, speed-to-lead; migration `1940000000`) for the ROI tiles, plus a `source_spend` Ad-Spend panel (manual monthly spend per source). View SQL must expose a unique `id` (`ROW_NUMBER() OVER ()` or a constant) and `CAST` numeric aggregates (else PB infers `json`); `strftime`/`julianday` work directly on PB date TEXT; views are dropped+recreated for idempotency.
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
