'use server';

import { getPocketBaseClient } from '@/lib/pocketbase';
import { getAdminPocketBase } from '@/lib/pocketbase-admin';
import { requireAgencyAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * §12.2 agency-only settings fields (CMS-native lead notifications + envelope
 * extensions). NEVER returned by the generic getSettings() below — its result
 * serializes into BO-facing client components — and never writable through the
 * generic updateSettings(). Managed exclusively by the requireAgencyAdmin-gated
 * actions in ./agency/notifications-actions.ts (secrets masked there too).
 */
const AGENCY_ONLY_SETTINGS_KEYS = [
  'notify_owner_email_enabled', 'notify_owner_sms_enabled',
  'lead_ack_email_enabled', 'lead_ack_sms_enabled',
  'notify_owner_email_to', 'notify_owner_sms_to',
  'sms_provider',
  'twilio_account_sid', 'twilio_auth_token', 'twilio_from_number',
  'telnyx_api_key', 'telnyx_from_number',
  'postmark_server_token', 'postmark_from_email',
  'lead_ack_email_subject', 'lead_ack_email_body', 'lead_ack_sms_body',
  'sms_consent_text',
  'automation_custom_headers', 'automation_context',
];

export async function getSettings() {
  const pb = await getPocketBaseClient();
  const record: any = await pb.collection('settings').getFirstListItem('').catch(async () => {
    // settings has createRule null (superuser-only) — seed normally creates the
    // singleton, so this fallback needs the admin client.
    const admin = await getAdminPocketBase();
    return admin.collection('settings').create({ active_template: 'modern' });
  });
  for (const key of AGENCY_ONLY_SETTINGS_KEYS) delete record[key];
  return record;
}

export async function updateSettings(id: string, data: any) {
  try {
    await requireAgencyAdmin();
    const clean = { ...data };
    for (const key of AGENCY_ONLY_SETTINGS_KEYS) delete clean[key];
    const pb = await getPocketBaseClient();
    await pb.collection('settings').update(id, clean);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
