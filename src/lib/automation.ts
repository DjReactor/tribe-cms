import crypto from 'crypto';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';

/**
 * Outbound automation events (CMS → n8n) — Automation & CRM plan §5.1 / §4.6.
 *
 * The CMS has no scheduler, so events are persisted to the durable `event_outbox`
 * and delivered best-effort immediately; a per-instance PM2 drain worker
 * (`scripts/drain-worker.js` → POST `/api/internal/outbox/drain`) retries
 * failures with exponential backoff. Delivery is at-least-once — consumers dedupe
 * on the envelope's idempotency_key (the outbox row id, also sent as the
 * `X-Tribe-Delivery` header).
 */

const MAX_ATTEMPTS = 8;
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000; // 6h cap on retry delay
const STALE_DELIVERING_MS = 2 * 60 * 1000; // reclaim rows stuck mid-delivery (e.g. process restart)

type DeliveryOutcome = 'delivered' | 'failed' | 'dead' | 'skipped';

type AutomationConfig = {
  url: string;
  secret: string;
  allowedHost: string;
  enabled: boolean;
  events: Record<string, boolean>;
};

type Pb = Awaited<ReturnType<typeof getAdminPocketBase>>;

/**
 * Resolve the effective delivery config from the `settings` row via the ADMIN
 * client. The drain worker has no BO cookie, so getSettings() (cookie-scoped) is
 * unusable here. Falls back to the legacy `lead_webhook_*` fields for one release
 * (§4.7) so existing consumers keep receiving `lead.created`.
 */
async function getAutomationConfig(pb: Pb): Promise<AutomationConfig | null> {
  try {
    const s: any = await pb.collection('settings').getFirstListItem('');
    const newUrl = (s.automation_webhook_url || '').trim();
    const url = (newUrl || s.lead_webhook_url || '').trim();
    const secret = s.automation_webhook_secret || s.lead_webhook_secret || '';
    const allowedHost = (s.automation_allowed_host || '').trim();
    // The enabled toggle governs the new automation config only; a legacy-only
    // lead_webhook_url stays implicitly enabled so we never silently break it.
    const enabled = newUrl ? !!s.automation_enabled : !!url;
    const events =
      s.automation_events && typeof s.automation_events === 'object' ? s.automation_events : {};
    return { url, secret, allowedHost, enabled, events };
  } catch {
    return null;
  }
}

/** True when this event should be delivered given the current config. */
function shouldDeliver(cfg: AutomationConfig | null, event: string): cfg is AutomationConfig {
  if (!cfg || !cfg.url || !cfg.enabled) return false;
  return cfg.events[event] !== false; // per-event toggle, default on
}

/**
 * SSRF guard — mirrors the contact route: require https + a non-private host,
 * unless the host is the explicitly configured `automation_allowed_host` (e.g. a
 * self-hosted n8n on an otherwise-blocked network).
 */
function isUrlAllowed(url: string, allowedHost: string): boolean {
  try {
    const parsed = new URL(url);
    const isAllowlisted = !!allowedHost && parsed.hostname === allowedHost;
    if (
      !isAllowlisted &&
      (parsed.protocol !== 'https:' ||
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname === '169.254.169.254')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Enqueue an event for delivery to n8n and attempt immediate best-effort
 * delivery. Never throws — automation must not break the primary write. Skips
 * enqueue entirely when there is no enabled target (events are point-in-time;
 * there is nothing to retry later, so we avoid piling up undeliverable rows).
 */
export async function dispatchEvent(event: string, data: unknown): Promise<void> {
  try {
    const pb = await getAdminPocketBase();
    const cfg = await getAutomationConfig(pb);
    if (!shouldDeliver(cfg, event)) return;

    const envelope = {
      event,
      instance_id: process.env.INSTANCE_SLUG || 'unknown',
      ts: new Date().toISOString(),
      data,
    };
    const row = await pb.collection('event_outbox').create({
      event,
      payload: envelope,
      status: 'pending',
      attempts: 0,
      next_attempt_at: new Date().toISOString(),
    });

    // Best-effort immediate delivery; the drain worker handles any failure.
    deliverOne(row.id, cfg).catch(() => {});
  } catch (err) {
    console.error('[automation] dispatchEvent failed:', err);
  }
}

/**
 * Deliver a single outbox row: claim it ('delivering'), POST the signed envelope
 * (§5.1), and record the outcome — 'delivered', or 'failed' with backoff, or
 * 'dead' past the attempt cap / on a permanent config problem.
 */
export async function deliverOne(
  rowId: string,
  cfgIn?: AutomationConfig | null,
): Promise<DeliveryOutcome> {
  const pb = await getAdminPocketBase();

  let row: any;
  try {
    row = await pb.collection('event_outbox').getOne(rowId);
  } catch {
    return 'skipped';
  }
  if (row.status === 'delivered' || row.status === 'dead') return 'skipped';

  const cfg = cfgIn ?? (await getAutomationConfig(pb));

  // Terminal no-op when there is nothing/nowhere to deliver to.
  if (!shouldDeliver(cfg, row.event)) {
    await pb
      .collection('event_outbox')
      .update(rowId, { status: 'dead', last_error: 'no automation target configured' })
      .catch(() => {});
    return 'dead';
  }
  if (!isUrlAllowed(cfg.url, cfg.allowedHost)) {
    await pb
      .collection('event_outbox')
      .update(rowId, { status: 'dead', last_error: 'webhook URL rejected by SSRF policy' })
      .catch(() => {});
    return 'dead';
  }

  // Claim (soft lock — the drain filter ignores fresh 'delivering' rows).
  try {
    await pb.collection('event_outbox').update(rowId, { status: 'delivering' });
  } catch {
    return 'skipped';
  }

  // §5.1 envelope: inject the idempotency_key (the outbox row id) into the body
  // at send time — it mirrors the X-Tribe-Delivery header and is what consumers
  // dedupe on. Stored separately as the row id, so it isn't kept in the payload.
  const rawBody = JSON.stringify({ ...row.payload, idempotency_key: rowId });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tribe-Event': row.event,
    'X-Tribe-Instance': process.env.INSTANCE_SLUG || 'unknown',
    'X-Tribe-Delivery': rowId,
  };
  if (cfg.secret) {
    const sig = crypto.createHmac('sha256', cfg.secret).update(rawBody).digest('hex');
    headers['X-Tribe-Signature'] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(cfg.url, { method: 'POST', headers, body: rawBody });
    if (res.ok) {
      await pb
        .collection('event_outbox')
        .update(rowId, { status: 'delivered', delivered_at: new Date().toISOString(), last_error: '' })
        .catch(() => {});
      return 'delivered';
    }
    return backoff(pb, row, `HTTP ${res.status}`);
  } catch (err: any) {
    return backoff(pb, row, err?.message || 'fetch failed');
  }
}

async function backoff(pb: Pb, row: any, error: string): Promise<DeliveryOutcome> {
  const attempts = (row.attempts || 0) + 1;
  if (attempts >= MAX_ATTEMPTS) {
    await pb
      .collection('event_outbox')
      .update(row.id, { status: 'dead', attempts, last_error: error })
      .catch(() => {});
    return 'dead';
  }
  const delayMs = Math.min(60_000 * 2 ** (attempts - 1), MAX_BACKOFF_MS);
  await pb
    .collection('event_outbox')
    .update(row.id, {
      status: 'failed',
      attempts,
      last_error: error,
      next_attempt_at: new Date(Date.now() + delayMs).toISOString(),
    })
    .catch(() => {});
  return 'failed';
}

/**
 * Drain due outbox rows — called by the PM2 worker via the internal route. Picks
 * pending/failed rows whose next_attempt_at has passed, plus any rows stuck
 * 'delivering' beyond the stale window (a process died mid-flight), and delivers
 * each. Bounded to 50 per tick.
 */
export async function drainOutbox(): Promise<{ processed: number; delivered: number; failed: number }> {
  const pb = await getAdminPocketBase();
  const cfg = await getAutomationConfig(pb);
  const now = new Date().toISOString();
  const staleBefore = new Date(Date.now() - STALE_DELIVERING_MS).toISOString();

  let rows: any;
  try {
    rows = await pb.collection('event_outbox').getList(1, 50, {
      filter:
        `next_attempt_at <= "${now}" && ` +
        `(status = "pending" || status = "failed" || (status = "delivering" && updated < "${staleBefore}"))`,
      sort: 'next_attempt_at',
    });
  } catch {
    return { processed: 0, delivered: 0, failed: 0 };
  }

  let delivered = 0;
  let failed = 0;
  for (const row of rows.items) {
    const outcome = await deliverOne(row.id, cfg);
    if (outcome === 'delivered') delivered += 1;
    else if (outcome === 'failed' || outcome === 'dead') failed += 1;
  }
  return { processed: rows.items.length, delivered, failed };
}
