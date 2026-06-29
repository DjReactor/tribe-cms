/**
 * Tribe CMS — outbox drain worker (Automation & CRM plan, Phase 1 / §3.6).
 *
 * The CMS has no scheduler, so this tiny PM2-managed process polls the internal
 * drain endpoint on a fixed interval; the endpoint retries due `event_outbox`
 * rows (CMS → n8n). One per instance — pm2 name `tribe-${SLUG}-drain`, with
 * cwd = the instance BASE so it can read BASE/.env. Plain Node, no dependencies.
 *
 * Lives under scripts/ (not the repo root) because publish-release.sh ships the
 * whole scripts/ dir in source.tar.gz; a root-level file would survive fresh
 * deploys but vanish on update.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Prefer the env PM2 already injected (step-13 sources .env; update uses
// --update-env). Fall back to parsing BASE/.env so the worker also runs under a
// bare `pm2 start scripts/drain-worker.js --cwd BASE`.
function loadEnv() {
  if (process.env.PORT && process.env.INTERNAL_SECRET) return;
  try {
    const text = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (process.env[m[1]] === undefined) process.env[m[1]] = val;
    }
  } catch {
    /* .env not readable — rely on whatever process.env already has */
  }
}

loadEnv();

const PORT = process.env.PORT;
const SECRET = process.env.INTERNAL_SECRET;
const INTERVAL_MS = Number(process.env.DRAIN_INTERVAL_MS) || 30_000;

if (!PORT || !SECRET) {
  console.error('[drain-worker] missing PORT or INTERNAL_SECRET; exiting');
  process.exit(1);
}

const url = `http://127.0.0.1:${PORT}/api/internal/outbox/drain`;

async function tick() {
  try {
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${SECRET}` } });
    if (!res.ok) console.warn(`[drain-worker] drain returned ${res.status}`);
  } catch (err) {
    console.warn('[drain-worker] drain request failed:', err && err.message);
  }
}

setInterval(tick, INTERVAL_MS);
tick();
console.log(`[drain-worker] started — draining ${url} every ${INTERVAL_MS}ms`);
