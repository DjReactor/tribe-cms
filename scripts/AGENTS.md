# tribe-cms / scripts

Parent: `../AGENTS.md`

## Purpose

Scripts that run on the VPS to deploy and build a tribe-cms instance, plus release publishing and data-seeding helpers.

## Ownership

Owns the per-instance deployment pipeline executed during install and update.

## Local Contracts

- `steps/` — the ordered deploy pipeline. Each stage is a pair: `step-NN-<name>.sh` (action) + `step-NN-<name>-verify.sh` (post-check). Steps 01–18: validate → ports → secrets → directories → copy-source → write-env → install-deps → build-artifact → init-pocketbase → run-migrations → seed-data → create-bo-user → start-pm2 → nginx → health-check → ssl → register → notify.
- `steps/shared.sh` — helpers sourced by every step. `steps/init-deploy.sh` — pipeline entry/orchestrator.
- `steps/niche-map.json` + `steps/niche-configs/` — per-niche configuration injected at deploy time.
- `publish-release.sh` — cuts/publishes a tribe-cms release consumed by the update mechanism.
- `seed-palettes.ts` / `migrate-colors.ts` — color-palette data seeding and migration (run via node/tsx).

## Work Guidance

- Preserve the `step-NN` ordering and the action/verify pairing — the superadmin orchestrator (`tribe-superadmin/src/lib/steps.ts`) and the host `scripts/` depend on it.
- Keep steps idempotent and safe to re-run; add a matching `-verify.sh` for every new step.

## Verification

Each step's `-verify.sh` is the per-stage check; the full pipeline is exercised by a real deploy.
