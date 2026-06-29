import { NextResponse } from 'next/server';
import { authenticateWebhook } from '@/lib/webhook-auth';

/**
 * Support utilities for the inbound CRM write-back API (n8n → CMS), §5.2:
 * auth, enum normalization/validation, and JSON response helpers.
 *
 * PocketBase `select` fields validate by EXACT membership (they reject unknown
 * values; no coercion), so external callers' loose casing/aliases are
 * canonicalized here before the write — or rejected with the allowed list.
 * (`source` is NOT here — it resolves against the `lead_sources` collection via
 * resolveLeadSourceId, which auto-creates on a miss.)
 */

export const ENUMS = {
  stage: ['new', 'estimate_scheduled', 'quoted', 'won', 'lost'],
  lifecycle: ['lead', 'customer', 'inactive'],
  activityType: ['lifecycle_changed', 'deal_stage_changed', 'note', 'enrolled', 'form_submitted', 'tag_added', 'system'],
  direction: ['inbound', 'outbound'],
  channel: ['sms', 'email'],
  messageStatus: ['queued', 'sent', 'delivered', 'failed', 'received', 'undelivered'],
  callType: ['phone_call', 'web_call'],
  callStatus: ['registered', 'ongoing', 'ended', 'error'],
};

export const ALIASES = {
  stage: {
    open: 'new', lead: 'new',
    estimate: 'estimate_scheduled', estimate_booked: 'estimate_scheduled', scheduled: 'estimate_scheduled',
    quote: 'quoted', proposal: 'quoted', bid: 'quoted',
    closed_won: 'won', win: 'won', closed: 'won',
    closed_lost: 'lost', lose: 'lost', dead: 'lost',
  } as Record<string, string>,
  lifecycle: {
    prospect: 'lead', new: 'lead', open: 'lead',
    client: 'customer', won: 'customer', active: 'customer',
    churned: 'inactive', archived: 'inactive', closed: 'inactive',
  } as Record<string, string>,
};

function normalizeEnum(v?: string | null): string {
  return (v || '').trim().toLowerCase().replace(/\s+/g, '_');
}

/** Resolve loose input to a canonical enum value, or null if unrecognized. */
export function resolveEnum(
  value: string | undefined | null, allowed: string[], aliases: Record<string, string> = {},
): string | null {
  const n = normalizeEnum(value);
  if (!n) return null;
  const mapped = aliases[n] || n;
  return allowed.includes(mapped) ? mapped : null;
}

/** Coerce to a finite number, or undefined for missing/blank/invalid input. */
export function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Authenticate an inbound CRM request: HMAC, Bearer==INTERNAL_SECRET, or any api_keys row (§3.4 #3). */
export async function authCrm(req: Request, rawBody: string): Promise<boolean> {
  return authenticateWebhook(req, rawBody, process.env.INTERNAL_SECRET || '');
}

// ── Rate limiting (per-IP fixed window; in-memory, per-instance) ──────────────
const RL_MAX = Number(process.env.CRM_RATE_LIMIT_MAX) || 120;
const RL_WINDOW_MS = 60_000;
const rlMap = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(req: Request): boolean {
  const ip = clientIp(req);
  if (ip === 'unknown') return false; // can't identify the caller — don't block
  const now = Date.now();
  const rec = rlMap.get(ip);
  if (!rec || now > rec.resetAt) {
    if (rlMap.size > 5000) for (const [k, v] of rlMap) if (now > v.resetAt) rlMap.delete(k); // opportunistic prune
    rlMap.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return false;
  }
  if (rec.count >= RL_MAX) return true;
  rec.count += 1;
  return false;
}

/**
 * Combined inbound guard: authenticate (401), then rate-limit per IP (429).
 * Returns a NextResponse to short-circuit, or null when the request may proceed.
 */
export async function guardCrm(req: Request, rawBody: string): Promise<NextResponse | null> {
  if (!(await authCrm(req, rawBody))) return unauthorized();
  if (isRateLimited(req)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  return null;
}

export const json = (data: Record<string, unknown>) => NextResponse.json(data);
export const badRequest = (error: string, allowed?: string[]) =>
  NextResponse.json(allowed ? { error, allowed } : { error }, { status: 400 });
export const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
export const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404 });
export const serverError = (err?: unknown) => {
  console.error('[crm-api] unexpected 500', err ?? '');
  return NextResponse.json({ error: 'Internal error' }, { status: 500 });
};
