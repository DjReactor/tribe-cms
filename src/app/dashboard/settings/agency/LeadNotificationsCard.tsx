'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import {
  updateNotificationSettings,
  sendTestNotificationAction,
  type NotificationSettingsView,
} from './notifications-actions';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

/**
 * "Lead Notifications — built-in" (plan §12.5). Agency-admin only: the page
 * gates rendering, and every action re-checks requireAgencyAdmin. Secrets
 * display masked (••••last4); leaving them blank/masked keeps the stored value.
 */
export function LeadNotificationsCard({ initialData }: { initialData: NotificationSettingsView }) {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [testTo, setTestTo] = useState('');
  const [testPending, setTestPending] = useState<'sms' | 'email' | null>(null);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      notify_owner_email_enabled: initialData.notify_owner_email_enabled,
      notify_owner_sms_enabled: initialData.notify_owner_sms_enabled,
      lead_ack_email_enabled: initialData.lead_ack_email_enabled,
      lead_ack_sms_enabled: initialData.lead_ack_sms_enabled,
      notify_owner_email_to: initialData.notify_owner_email_to,
      notify_owner_sms_to: initialData.notify_owner_sms_to,
      sms_provider: initialData.sms_provider,
      twilio_account_sid: initialData.twilio_account_sid,
      twilio_auth_token: initialData.twilio_auth_token,
      twilio_from_number: initialData.twilio_from_number,
      telnyx_api_key: initialData.telnyx_api_key,
      telnyx_from_number: initialData.telnyx_from_number,
      postmark_server_token: initialData.postmark_server_token,
      postmark_from_email: initialData.postmark_from_email,
      lead_ack_email_subject: initialData.lead_ack_email_subject,
      lead_ack_email_body: initialData.lead_ack_email_body,
      lead_ack_sms_body: initialData.lead_ack_sms_body,
      sms_consent_text: initialData.sms_consent_text,
      automation_custom_headers: initialData.automation_custom_headers,
      automation_context: initialData.automation_context,
    },
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const res = await updateNotificationSettings(data);
      if (res.success) {
        addToast({ title: 'Lead notification settings saved', type: 'success' });
      } else {
        addToast({ title: 'Error saving', description: res.error, type: 'error' });
      }
    });
  };

  const runTest = async (channel: 'sms' | 'email') => {
    setTestPending(channel);
    const res = await sendTestNotificationAction(channel, testTo);
    setTestPending(null);
    if (res.ok) {
      addToast({ title: `Test ${channel.toUpperCase()} sent`, type: 'success' });
    } else {
      addToast({ title: `Test ${channel.toUpperCase()} failed`, description: res.error, type: 'error' });
    }
  };

  const provider = watch('sms_provider');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card className="border-destructive">
        <CardHeader className="bg-destructive/5 border-b border-destructive/20 rounded-t-xl">
          <CardTitle className="text-destructive">Lead Notifications — built-in</CardTitle>
          <CardDescription className="text-destructive">
            CMS-native sends on a new lead (no n8n dependency). Immediate, single-shot only —
            sequences and follow-ups belong in n8n. If n8n workflows also notify, keep these off
            to avoid double sends.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b pb-2">Owner notification</h3>
            <Toggle
              checked={watch('notify_owner_email_enabled')}
              onChange={(e) => setValue('notify_owner_email_enabled', e.target.checked)}
              label="Email the owner on a new lead"
            />
            <Toggle
              checked={watch('notify_owner_sms_enabled')}
              onChange={(e) => setValue('notify_owner_sms_enabled', e.target.checked)}
              label="Text the owner on a new lead"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <Input label="Owner email(s) — comma-separated" {...register('notify_owner_email_to')} placeholder="owner@business.com" />
              <Input label="Owner mobile (E.164)" {...register('notify_owner_sms_to')} placeholder="+15551234567" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b pb-2">Lead acknowledgement</h3>
            <Toggle
              checked={watch('lead_ack_email_enabled')}
              onChange={(e) => setValue('lead_ack_email_enabled', e.target.checked)}
              label="Email the lead an acknowledgement"
            />
            <Toggle
              checked={watch('lead_ack_sms_enabled')}
              onChange={(e) => setValue('lead_ack_sms_enabled', e.target.checked)}
              label="Text the lead an acknowledgement (requires form consent)"
            />
            <p className="text-xs text-muted-foreground pl-6">
              The ack SMS only ever sends when the lead checked the consent box on the contact
              form — the toggle alone is not enough (TCPA).
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b pb-2">SMS provider</h3>
            <Select label="Provider" {...register('sms_provider')}>
              <option value="">Not configured</option>
              <option value="twilio">Twilio</option>
              <option value="telnyx">Telnyx</option>
            </Select>
            {provider === 'twilio' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                <Input label="Account SID" {...register('twilio_account_sid')} />
                <Input label="Auth token" type="password" {...register('twilio_auth_token')} />
                <Input label="From number (E.164)" {...register('twilio_from_number')} placeholder="+15551234567" />
              </div>
            )}
            {provider === 'telnyx' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <Input label="API key" type="password" {...register('telnyx_api_key')} />
                <Input label="From number (E.164)" {...register('telnyx_from_number')} placeholder="+15551234567" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b pb-2">Email provider (Postmark)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Server token" type="password" {...register('postmark_server_token')} />
              <Input label="From email (verified sender)" {...register('postmark_from_email')} placeholder="hello@business.com" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b pb-2">Templates (blank = default)</h3>
            <p className="text-xs text-muted-foreground">
              Placeholders: {'{{name}} {{phone}} {{email}} {{message}} {{business_name}} {{business_phone}}'}
            </p>
            <Input label="Ack email subject" {...register('lead_ack_email_subject')} placeholder={initialData.defaults.ack_email_subject} />
            <Textarea label="Ack email body" rows={4} {...register('lead_ack_email_body')} placeholder={initialData.defaults.ack_email_body} />
            <Textarea label="Ack SMS body" rows={2} {...register('lead_ack_sms_body')} placeholder={initialData.defaults.ack_sms_body} />
            <Textarea
              label="SMS consent disclosure (contact form checkbox — shown publicly, stored as proof)"
              rows={3}
              {...register('sms_consent_text')}
              placeholder={initialData.defaults.consent_text}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b pb-2">Send test</h3>
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <Input
                  label="Test recipient (email or E.164 number)"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                  placeholder="you@agency.com or +15551234567"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" isLoading={testPending === 'email'} onClick={() => runTest('email')}>
                  Test email
                </Button>
                <Button type="button" variant="outline" isLoading={testPending === 'sms'} onClick={() => runTest('sms')}>
                  Test SMS
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Tests use the saved credentials — save first.</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b pb-2">Outbound webhook extras (n8n lane)</h3>
            <Textarea
              label='Custom request headers (JSON object, e.g. {"X-Api-Key": "..."}) — X-Tribe-*/Content-Type protected'
              rows={3}
              {...register('automation_custom_headers')}
            />
            <Textarea
              label='Per-instance payload context (JSON object) — merged into every event envelope as "context"'
              rows={4}
              {...register('automation_context')}
            />
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isPending} size="lg" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          Save Lead Notifications
        </Button>
      </div>
    </form>
  );
}
