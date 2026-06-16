import { NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { getSettings } from '@/lib/settings';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (origin && allowedOrigin && origin !== allowedOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (ip !== 'unknown' && !checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const {
    name, email, phone, message, source,
    address_street, address_city, address_state, address_zip, address_full,
  } = payload;

  // --- Validate required fields ---
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Phone is required.' }, { status: 400 });
  }

  const pb = await getAdminPocketBase();

  // --- Save to PocketBase ---
  let lead: any;
  try {
    lead = await pb.collection('contacts').create({
      name:           stripHtml(name.trim()),
      email:          email.trim(),
      phone:          phone.trim(),
      message:        stripHtml(message?.trim()),
      address_street: stripHtml(address_street?.trim()),
      address_city:   stripHtml(address_city?.trim()),
      address_state:  stripHtml(address_state?.trim()),
      address_zip:    stripHtml(address_zip?.trim()),
      address_full:   stripHtml(address_full?.trim()),
      source:         stripHtml(source) || 'website',
      status:         'new',
    });
  } catch (err) {
    console.error('[/api/contact] Failed to save contact:', err);
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
  }

  // --- Fire webhook (non-blocking — never fail the user request) ---
  fireWebhook(lead).catch((err) =>
    console.error('[/api/contact] Webhook dispatch failed:', err)
  );

  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook dispatcher — fires and forgets
// ─────────────────────────────────────────────────────────────────────────────
async function fireWebhook(lead: any): Promise<void> {
  const settings = await getSettings();
  const webhookUrl = settings.lead_webhook_url;
  if (!webhookUrl) return;

  try {
    const parsed = new URL(webhookUrl);
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '169.254.169.254'
    ) {
      console.warn('Webhook URL rejected due to security policy');
      return;
    }
  } catch {
    console.warn('Webhook URL rejected: invalid URL');
    return;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const secret = settings.lead_webhook_secret;
  if (secret) {
    headers['Authorization'] = `Bearer ${secret}`;
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      event: 'lead.created',
      lead: {
        id:             lead.id,
        name:           lead.name,
        email:          lead.email,
        phone:          lead.phone,
        message:        lead.message,
        address_street: lead.address_street,
        address_city:   lead.address_city,
        address_state:  lead.address_state,
        address_zip:    lead.address_zip,
        address_full:   lead.address_full,
        source:         lead.source,
        status:         lead.status,
        created:        lead.created,
      },
    }),
  });

  if (!res.ok) {
    console.warn(`[fireWebhook] Webhook returned ${res.status} from ${webhookUrl}`);
  }
}
