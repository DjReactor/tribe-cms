import { NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { dispatchEvent } from '@/lib/automation';
import { resolveLeadSourceId } from '@/lib/lead-sources';
import {
  enqueueLeadNotifications,
  getBusinessSnapshot,
  getNotificationConfig,
  renderTemplate,
  DEFAULT_SMS_CONSENT_TEXT,
} from '@/lib/notifications';

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

/**
 * GET — the SMS-consent disclosure text (§12.3), rendered server-side from
 * settings.sms_consent_text (or the TCPA default) + the business name. The
 * ContactForm fetches this so the DISPLAYED text and the text RECORDED on the
 * consent_records row come from the same source. Public; contains no secrets.
 */
export async function GET() {
  try {
    const pb = await getAdminPocketBase();
    const cfg = await getNotificationConfig(pb);
    const business = await getBusinessSnapshot(pb);
    const consent_text = renderTemplate(
      cfg?.sms_consent_text || DEFAULT_SMS_CONSENT_TEXT,
      { business_name: business.name || 'this business' },
    );
    return NextResponse.json({ consent_text });
  } catch {
    return NextResponse.json({ consent_text: '' }, { status: 500 });
  }
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
    sms_consent, page_url,
  } = payload;
  const consented = sms_consent === true;

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

  // `source` is now a relation to the managed lead_sources picklist — resolve
  // the incoming value (public form always sends "website") to a row id,
  // auto-creating + flagging on a miss so a lead is never dropped (§4.4).
  const sourceId = await resolveLeadSourceId(pb, source);

  // --- Save to PocketBase ---
  let lead: any;
  try {
    lead = await pb.collection('contacts').create({
      name:             stripHtml(name.trim()),
      email:            email.trim(),
      phone:            phone.trim(),
      message:          stripHtml(message?.trim()),
      address_street:   stripHtml(address_street?.trim()),
      address_city:     stripHtml(address_city?.trim()),
      address_state:    stripHtml(address_state?.trim()),
      address_zip:      stripHtml(address_zip?.trim()),
      address_full:     stripHtml(address_full?.trim()),
      source:           sourceId,
      lifecycle_status: 'lead',   // new CRM lifecycle (§4.4)
      status:           'new',    // legacy free-text — kept for one release
      sms_consent:      consented, // §12.3 denormalized gate
      sms_consent_at:   consented ? new Date().toISOString() : '',
    });
  } catch (err) {
    console.error('[/api/contact] Failed to save contact:', err);
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
  }

  // --- §12.3: durable consent proof (append-only) — non-fatal ---
  // The consent text is re-rendered server-side from the same settings +
  // business_info the form rendered from, and stored VERBATIM with capture
  // context (IP/UA/page) as TCPA "prior express written consent" evidence.
  if (consented) {
    try {
      const cfg = await getNotificationConfig(pb);
      const business = await getBusinessSnapshot(pb);
      const consentText = renderTemplate(
        cfg?.sms_consent_text || DEFAULT_SMS_CONSENT_TEXT,
        { business_name: business.name || 'this business' },
      );
      await pb.collection('consent_records').create({
        contact:      lead.id,
        channel:      'sms',
        action:       'granted',
        method:       'web_form',
        consent_text: consentText,
        page_url:     stripHtml(typeof page_url === 'string' ? page_url.slice(0, 500) : ''),
        ip:           ip,
        user_agent:   stripHtml((request.headers.get('user-agent') || '').slice(0, 500)),
      });
    } catch (err) {
      console.error('[/api/contact] Failed to record consent:', err);
    }
  }

  // --- Emit lead.created to the automation outbox (§5.1) — non-blocking ---
  // dispatchEvent persists to event_outbox, signs the envelope, and applies the
  // SSRF/allowed-host guard internally; the PM2 drain worker retries failures.
  dispatchEvent('lead.created', lead).catch((err) =>
    console.error('[/api/contact] Event dispatch failed:', err)
  );

  // --- §12.4: CMS-native lead notifications (owner + ack) — non-blocking ---
  // Toggle- and consent-gated inside; rides the same outbox for retries.
  enqueueLeadNotifications(lead).catch((err) =>
    console.error('[/api/contact] Notification enqueue failed:', err)
  );

  return NextResponse.json({ success: true });
}
