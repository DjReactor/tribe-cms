'use server';

import { requireAgencyAdmin } from '@/lib/auth';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { sendTestNotification, DEFAULT_ACK_EMAIL_SUBJECT, DEFAULT_ACK_EMAIL_BODY, DEFAULT_ACK_SMS_BODY, DEFAULT_SMS_CONSENT_TEXT } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

/**
 * Agency-admin-only actions for the CMS-native lead-notification config
 * (plan §12.2/§12.5). These are the ONLY read/write surface for the
 * AGENCY_ONLY_SETTINGS_KEYS — the generic settings actions strip them.
 * Secrets round-trip MASKED: reads return `••••` + last 4; writes that arrive
 * blank or still masked leave the stored value unchanged.
 */

const SECRET_KEYS = ['twilio_auth_token', 'telnyx_api_key', 'postmark_server_token'] as const;
const MASK_PREFIX = '••••';

function mask(value: string): string {
  return value ? `${MASK_PREFIX}${value.slice(-4)}` : '';
}

export type NotificationSettingsView = {
  id: string;
  notify_owner_email_enabled: boolean;
  notify_owner_sms_enabled: boolean;
  lead_ack_email_enabled: boolean;
  lead_ack_sms_enabled: boolean;
  notify_owner_email_to: string;
  notify_owner_sms_to: string;
  sms_provider: string;
  twilio_account_sid: string;
  twilio_auth_token: string;   // masked
  twilio_from_number: string;
  telnyx_api_key: string;      // masked
  telnyx_from_number: string;
  postmark_server_token: string; // masked
  postmark_from_email: string;
  lead_ack_email_subject: string;
  lead_ack_email_body: string;
  lead_ack_sms_body: string;
  sms_consent_text: string;
  automation_custom_headers: string; // JSON as text for editing
  automation_context: string;        // JSON as text for editing
  defaults: {
    ack_email_subject: string;
    ack_email_body: string;
    ack_sms_body: string;
    consent_text: string;
  };
};

export async function getNotificationSettings(): Promise<NotificationSettingsView> {
  await requireAgencyAdmin();
  const pb = await getAdminPocketBase();
  const s: any = await pb.collection('settings').getFirstListItem('');
  const asJsonText = (v: unknown) =>
    v && typeof v === 'object' && Object.keys(v as object).length > 0
      ? JSON.stringify(v, null, 2)
      : '';
  return {
    id: s.id,
    notify_owner_email_enabled: !!s.notify_owner_email_enabled,
    notify_owner_sms_enabled: !!s.notify_owner_sms_enabled,
    lead_ack_email_enabled: !!s.lead_ack_email_enabled,
    lead_ack_sms_enabled: !!s.lead_ack_sms_enabled,
    notify_owner_email_to: s.notify_owner_email_to || '',
    notify_owner_sms_to: s.notify_owner_sms_to || '',
    sms_provider: s.sms_provider || '',
    twilio_account_sid: s.twilio_account_sid || '',
    twilio_auth_token: mask(s.twilio_auth_token || ''),
    twilio_from_number: s.twilio_from_number || '',
    telnyx_api_key: mask(s.telnyx_api_key || ''),
    telnyx_from_number: s.telnyx_from_number || '',
    postmark_server_token: mask(s.postmark_server_token || ''),
    postmark_from_email: s.postmark_from_email || '',
    lead_ack_email_subject: s.lead_ack_email_subject || '',
    lead_ack_email_body: s.lead_ack_email_body || '',
    lead_ack_sms_body: s.lead_ack_sms_body || '',
    sms_consent_text: s.sms_consent_text || '',
    automation_custom_headers: asJsonText(s.automation_custom_headers),
    automation_context: asJsonText(s.automation_context),
    defaults: {
      ack_email_subject: DEFAULT_ACK_EMAIL_SUBJECT,
      ack_email_body: DEFAULT_ACK_EMAIL_BODY,
      ack_sms_body: DEFAULT_ACK_SMS_BODY,
      consent_text: DEFAULT_SMS_CONSENT_TEXT,
    },
  };
}

export async function updateNotificationSettings(
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAgencyAdmin();
    const pb = await getAdminPocketBase();
    const s: any = await pb.collection('settings').getFirstListItem('');

    const patch: Record<string, unknown> = {};
    const boolKeys = [
      'notify_owner_email_enabled', 'notify_owner_sms_enabled',
      'lead_ack_email_enabled', 'lead_ack_sms_enabled',
    ];
    const textKeys = [
      'notify_owner_email_to', 'notify_owner_sms_to',
      'twilio_account_sid', 'twilio_from_number', 'telnyx_from_number',
      'postmark_from_email',
      'lead_ack_email_subject', 'lead_ack_email_body', 'lead_ack_sms_body',
      'sms_consent_text',
    ];
    for (const k of boolKeys) if (k in data) patch[k] = !!data[k];
    for (const k of textKeys) if (k in data) patch[k] = String(data[k] ?? '').trim();

    if ('sms_provider' in data) {
      const p = String(data.sms_provider ?? '');
      if (p !== '' && p !== 'twilio' && p !== 'telnyx') {
        return { success: false, error: 'sms_provider must be twilio or telnyx' };
      }
      patch.sms_provider = p;
    }

    // Secrets: blank or still-masked input leaves the stored value unchanged.
    for (const k of SECRET_KEYS) {
      if (!(k in data)) continue;
      const v = String(data[k] ?? '').trim();
      if (v === '' || v.startsWith(MASK_PREFIX)) continue;
      patch[k] = v;
    }

    // JSON fields arrive as text — validate before storing.
    for (const k of ['automation_custom_headers', 'automation_context'] as const) {
      if (!(k in data)) continue;
      const raw = String(data[k] ?? '').trim();
      if (raw === '') { patch[k] = null; continue; }
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return { success: false, error: `${k} must be a JSON object` };
        }
        patch[k] = parsed;
      } catch {
        return { success: false, error: `${k} is not valid JSON` };
      }
    }

    await pb.collection('settings').update(s.id, patch);
    revalidatePath('/dashboard/settings/agency');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'update failed' };
  }
}

export async function sendTestNotificationAction(
  channel: 'sms' | 'email',
  to: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAgencyAdmin();
  } catch {
    return { ok: false, error: 'Unauthorized' };
  }
  const trimmed = (to || '').trim();
  if (!trimmed) return { ok: false, error: 'Recipient is required' };
  return sendTestNotification(channel, trimmed);
}
