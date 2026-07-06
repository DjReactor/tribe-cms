import type PocketBase from 'pocketbase';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { logActivity } from '@/lib/crm-writes';

/**
 * CMS-native lead notifications — Automation & CRM plan §12.
 *
 * On a new lead the CMS itself sends up to four immediate, stateless,
 * single-shot notifications (owner/lead × sms/email), each behind its own
 * agency-only toggle. Anything time-delayed, conditional, or multi-step stays
 * in n8n (§12 boundary rule).
 *
 * Delivery rides the existing event_outbox: enqueueLeadNotifications() writes
 * kind:"notification" rows and deliverOne() (automation.ts) routes them to
 * deliverNotificationRow() below. Templates are rendered AT SEND TIME so
 * config/template edits apply to queued retries.
 *
 * Provider calls are typed adapters (plain fetch, no SDKs): Twilio
 * (form-encoded, basic auth), Telnyx (JSON, bearer), Postmark (JSON, server
 * token). Strict provider APIs must never be pointed at the webhook lane
 * (§12.8 scope guard).
 *
 * Config is read via the ADMIN client and is deliberately NOT part of
 * getSettings()/TemplateSettings — credentials and toggles are agency-only
 * (§12.2).
 */

export type NotificationEvent =
  | 'notify.owner.email'
  | 'notify.owner.sms'
  | 'notify.lead.email'
  | 'notify.lead.sms';

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  'notify.owner.email',
  'notify.owner.sms',
  'notify.lead.email',
  'notify.lead.sms',
];

export type NotificationConfig = {
  notify_owner_email_enabled: boolean;
  notify_owner_sms_enabled: boolean;
  lead_ack_email_enabled: boolean;
  lead_ack_sms_enabled: boolean;
  notify_owner_email_to: string;
  notify_owner_sms_to: string;
  sms_provider: 'twilio' | 'telnyx' | '';
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_from_number: string;
  telnyx_api_key: string;
  telnyx_from_number: string;
  postmark_server_token: string;
  postmark_from_email: string;
  lead_ack_email_subject: string;
  lead_ack_email_body: string;
  lead_ack_sms_body: string;
  sms_consent_text: string;
};

type Pb = PocketBase;

export type SendResult =
  | { ok: true }
  | { ok: false; error: string; permanent: boolean };

/* ── Templates (§12.6) — code defaults, overridable via settings text fields ── */

export const DEFAULT_ACK_EMAIL_SUBJECT = 'Thanks for reaching out to {{business_name}}';
export const DEFAULT_ACK_EMAIL_BODY =
  'Hi {{name}},\n\n' +
  'Thanks for contacting {{business_name}} — we received your message and will ' +
  'get back to you shortly.\n\n' +
  '— {{business_name}}\n{{business_phone}}';
export const DEFAULT_ACK_SMS_BODY =
  '{{business_name}}: Thanks {{name}}, we received your request and will get ' +
  'back to you shortly. Reply STOP to opt out, HELP for help.';
const OWNER_EMAIL_SUBJECT = 'New lead: {{name}}';
const OWNER_EMAIL_BODY =
  'You have a new lead on {{business_name}}.\n\n' +
  'Name: {{name}}\nPhone: {{phone}}\nEmail: {{email}}\n' +
  'Address: {{address}}\n\nMessage:\n{{message}}\n\n' +
  'Open the dashboard to view the full timeline.';
const OWNER_SMS_BODY = 'New lead for {{business_name}}: {{name}} — {{phone}}. {{message}}';

/**
 * Default TCPA consent language (plan §12.3 — researched 2026-07-06): names the
 * client business (per-brand consent), covers texts AND calls incl. automated
 * technology + AI-generated voices (FCC: AI voices are "artificial" under
 * TCPA; the fleet uses Retell AI voice agents), frequency, rates, the
 * not-a-condition-of-purchase line, and STOP/HELP. Overridable via
 * settings.sms_consent_text. The exact rendered text is stored VERBATIM on the
 * consent_records row at capture time.
 */
export const DEFAULT_SMS_CONSENT_TEXT =
  'I agree to receive text messages and calls from {{business_name}} at the ' +
  'number provided regarding my inquiry, including messages sent by automated ' +
  'technology and calls or texts using artificial or AI-generated voices. ' +
  'Message frequency varies; message and data rates may apply. Consent is not ' +
  'a condition of purchase. Reply STOP to opt out or HELP for help. See our ' +
  'Privacy Policy.';

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '');
}

/* ── Config + business snapshot (server-only, admin client) ─────────────────── */

export async function getNotificationConfig(pb: Pb): Promise<NotificationConfig | null> {
  try {
    const s: any = await pb.collection('settings').getFirstListItem('');
    return {
      notify_owner_email_enabled: !!s.notify_owner_email_enabled,
      notify_owner_sms_enabled: !!s.notify_owner_sms_enabled,
      lead_ack_email_enabled: !!s.lead_ack_email_enabled,
      lead_ack_sms_enabled: !!s.lead_ack_sms_enabled,
      notify_owner_email_to: (s.notify_owner_email_to || '').trim(),
      notify_owner_sms_to: (s.notify_owner_sms_to || '').trim(),
      sms_provider: s.sms_provider === 'twilio' || s.sms_provider === 'telnyx' ? s.sms_provider : '',
      twilio_account_sid: s.twilio_account_sid || '',
      twilio_auth_token: s.twilio_auth_token || '',
      twilio_from_number: s.twilio_from_number || '',
      telnyx_api_key: s.telnyx_api_key || '',
      telnyx_from_number: s.telnyx_from_number || '',
      postmark_server_token: s.postmark_server_token || '',
      postmark_from_email: s.postmark_from_email || '',
      lead_ack_email_subject: s.lead_ack_email_subject || '',
      lead_ack_email_body: s.lead_ack_email_body || '',
      lead_ack_sms_body: s.lead_ack_sms_body || '',
      sms_consent_text: s.sms_consent_text || '',
    };
  } catch {
    return null;
  }
}

/** Business identity for templates + the §12.8 envelope context. */
export async function getBusinessSnapshot(
  pb: Pb,
): Promise<{ name: string; phone: string; email: string; address: string }> {
  try {
    const b: any = await pb.collection('business_info').getFirstListItem('');
    return {
      name: b.business_name || '',
      phone: b.phone || '',
      email: b.email || '',
      address: b.address || '',
    };
  } catch {
    return { name: '', phone: '', email: '', address: '' };
  }
}

/* ── Provider adapters — body format + auth are CODE, not config (§12.8) ────── */

async function sendSmsTwilio(
  cfg: NotificationConfig,
  to: string,
  body: string,
): Promise<{ externalId: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(cfg.twilio_account_sid)}/Messages.json`;
  const auth = Buffer.from(`${cfg.twilio_account_sid}:${cfg.twilio_auth_token}`).toString('base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: cfg.twilio_from_number, Body: body }).toString(),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${data?.message || 'send failed'}`);
  return { externalId: data.sid || '' };
}

async function sendSmsTelnyx(
  cfg: NotificationConfig,
  to: string,
  body: string,
): Promise<{ externalId: string }> {
  const res = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.telnyx_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: cfg.telnyx_from_number, to, text: body }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.errors?.[0]?.detail || 'send failed';
    throw new Error(`Telnyx ${res.status}: ${detail}`);
  }
  return { externalId: data?.data?.id || '' };
}

export async function sendSms(
  cfg: NotificationConfig,
  to: string,
  body: string,
): Promise<{ externalId: string; provider: string }> {
  if (cfg.sms_provider === 'twilio') {
    if (!cfg.twilio_account_sid || !cfg.twilio_auth_token || !cfg.twilio_from_number) {
      throw new PermanentSendError('Twilio credentials incomplete');
    }
    return { ...(await sendSmsTwilio(cfg, to, body)), provider: 'twilio' };
  }
  if (cfg.sms_provider === 'telnyx') {
    if (!cfg.telnyx_api_key || !cfg.telnyx_from_number) {
      throw new PermanentSendError('Telnyx credentials incomplete');
    }
    return { ...(await sendSmsTelnyx(cfg, to, body)), provider: 'telnyx' };
  }
  throw new PermanentSendError('no SMS provider configured');
}

export async function sendEmail(
  cfg: NotificationConfig,
  to: string,
  subject: string,
  body: string,
): Promise<{ externalId: string; provider: string }> {
  if (!cfg.postmark_server_token || !cfg.postmark_from_email) {
    throw new PermanentSendError('Postmark credentials incomplete');
  }
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'X-Postmark-Server-Token': cfg.postmark_server_token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      From: cfg.postmark_from_email,
      To: to, // comma-separated allowed
      Subject: subject,
      TextBody: body,
      MessageStream: 'outbound',
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Postmark ${res.status}: ${data?.Message || 'send failed'}`);
  return { externalId: data.MessageID || '', provider: 'postmark' };
}

/** Config-shaped failures that a retry can never fix (→ outbox 'dead'). */
export class PermanentSendError extends Error {}

/* ── Enqueue (called by /api/contact after the lead is created) ─────────────── */

/**
 * Write up to four kind:"notification" outbox rows for a new lead, then attempt
 * immediate best-effort delivery. Never throws — notifications must not break
 * the lead write. The consent gate (§12.3) is applied here AND re-checked at
 * send time.
 */
export async function enqueueLeadNotifications(lead: {
  id: string;
  email?: string;
  phone?: string;
  sms_consent?: boolean;
}): Promise<void> {
  try {
    const pb = await getAdminPocketBase();
    const cfg = await getNotificationConfig(pb);
    if (!cfg) return;

    const sends: Array<{ event: NotificationEvent; to: string }> = [];
    if (cfg.notify_owner_email_enabled && cfg.notify_owner_email_to) {
      sends.push({ event: 'notify.owner.email', to: cfg.notify_owner_email_to });
    }
    if (cfg.notify_owner_sms_enabled && cfg.notify_owner_sms_to) {
      sends.push({ event: 'notify.owner.sms', to: cfg.notify_owner_sms_to });
    }
    if (cfg.lead_ack_email_enabled && lead.email) {
      sends.push({ event: 'notify.lead.email', to: lead.email });
    }
    if (cfg.lead_ack_sms_enabled && lead.phone && lead.sms_consent === true) {
      sends.push({ event: 'notify.lead.sms', to: lead.phone });
    }
    if (sends.length === 0) return;

    // Dynamic import avoids a static cycle (automation → notifications → automation).
    const { deliverOne } = await import('@/lib/automation');
    for (const s of sends) {
      const row = await pb.collection('event_outbox').create({
        event: s.event,
        kind: 'notification',
        payload: { contact_id: lead.id, to: s.to },
        status: 'pending',
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
      });
      deliverOne(row.id).catch(() => {});
    }
  } catch (err) {
    console.error('[notifications] enqueueLeadNotifications failed:', err);
  }
}

/* ── Delivery (called by deliverOne() for kind:"notification" rows) ─────────── */

/**
 * Render + send one notification row. Returns a SendResult; the caller
 * (automation.deliverOne) owns the outbox status transitions. Successful sends
 * are logged to the contact timeline: lead-facing sends as `messages` rows,
 * owner notifications as `activities` rows (§12.4).
 */
export async function deliverNotificationRow(pb: Pb, row: any): Promise<SendResult> {
  const event = row.event as NotificationEvent;
  if (!NOTIFICATION_EVENTS.includes(event)) {
    return { ok: false, error: `unknown notification event "${row.event}"`, permanent: true };
  }

  const cfg = await getNotificationConfig(pb);
  if (!cfg) return { ok: false, error: 'settings row unavailable', permanent: false };

  const contactId = row.payload?.contact_id;
  const to = (row.payload?.to || '').trim();
  if (!contactId || !to) {
    return { ok: false, error: 'payload missing contact_id/to', permanent: true };
  }

  let contact: any;
  try {
    contact = await pb.collection('contacts').getOne(contactId);
  } catch {
    return { ok: false, error: `contact ${contactId} not found`, permanent: true };
  }

  // Consent re-check at send time — the gate may have been revoked since enqueue.
  if (event === 'notify.lead.sms' && contact.sms_consent !== true) {
    return { ok: false, error: 'no SMS consent on contact', permanent: true };
  }

  const business = await getBusinessSnapshot(pb);
  const vars: Record<string, string> = {
    name: contact.name || '',
    phone: contact.phone || '',
    email: contact.email || '',
    address: contact.address_full || '',
    message: contact.message || '',
    business_name: business.name,
    business_phone: business.phone,
    business_email: business.email,
    business_address: business.address,
  };

  const channel: 'sms' | 'email' = event.endsWith('.sms') ? 'sms' : 'email';
  try {
    let externalId = '';
    let provider = '';
    let subject = '';
    let body = '';

    if (event === 'notify.owner.email') {
      subject = renderTemplate(OWNER_EMAIL_SUBJECT, vars);
      body = renderTemplate(OWNER_EMAIL_BODY, vars);
      ({ externalId, provider } = await sendEmail(cfg, to, subject, body));
    } else if (event === 'notify.owner.sms') {
      body = renderTemplate(OWNER_SMS_BODY, vars).slice(0, 320);
      ({ externalId, provider } = await sendSms(cfg, to, body));
    } else if (event === 'notify.lead.email') {
      subject = renderTemplate(cfg.lead_ack_email_subject || DEFAULT_ACK_EMAIL_SUBJECT, vars);
      body = renderTemplate(cfg.lead_ack_email_body || DEFAULT_ACK_EMAIL_BODY, vars);
      ({ externalId, provider } = await sendEmail(cfg, to, subject, body));
    } else {
      body = renderTemplate(cfg.lead_ack_sms_body || DEFAULT_ACK_SMS_BODY, vars).slice(0, 320);
      ({ externalId, provider } = await sendSms(cfg, to, body));
    }

    // Timeline logging (§12.4) — best-effort; the send already succeeded.
    if (event.startsWith('notify.lead.')) {
      await pb
        .collection('messages')
        .create({
          contact: contactId,
          direction: 'outbound',
          channel,
          status: 'sent',
          subject,
          body,
          from_addr: channel === 'email' ? cfg.postmark_from_email
            : cfg.sms_provider === 'twilio' ? cfg.twilio_from_number : cfg.telnyx_from_number,
          to_addr: to,
          provider,
          external_id: externalId || `notif_${row.id}`,
          meta: { source: 'cms_lead_notification', outbox_id: row.id },
        })
        .catch(() => {});
    } else {
      await logActivity(pb, {
        contact: contactId,
        type: 'owner_notified',
        title: `Owner notified via ${channel.toUpperCase()}`,
        meta: { channel, to, provider, external_id: externalId, outbox_id: row.id },
        actor: 'system',
      });
    }
    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'send failed',
      permanent: err instanceof PermanentSendError,
    };
  }
}

/* ── Send-test (agency settings card, §12.5) — direct, no outbox ────────────── */

export async function sendTestNotification(
  channel: 'sms' | 'email',
  to: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const pb = await getAdminPocketBase();
    const cfg = await getNotificationConfig(pb);
    if (!cfg) return { ok: false, error: 'settings row unavailable' };
    const business = await getBusinessSnapshot(pb);
    const suffix = `test notification from ${business.name || 'Tribe CMS'}.`;
    if (channel === 'email') {
      await sendEmail(cfg, to, `Test notification — ${business.name || 'Tribe CMS'}`, `This is a ${suffix}`);
    } else {
      await sendSms(cfg, to, `This is a ${suffix}`);
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'send failed' };
  }
}
