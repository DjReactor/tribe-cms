'use client';
import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { updateSettings } from './actions';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export function SettingsForm({ initialData }: { initialData: any }) {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const { handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      show_powered_by:        initialData?.show_powered_by        ?? false,
      notify_on_publish:      initialData?.notify_on_publish      ?? true,
      notify_monthly_summary: initialData?.notify_monthly_summary ?? false,
      notify_new_blog_post:   initialData?.notify_new_blog_post   ?? false,
      lead_webhook_url:       initialData?.lead_webhook_url       ?? '',
      lead_webhook_secret:    initialData?.lead_webhook_secret    ?? '',
      automation_enabled:        initialData?.automation_enabled        ?? false,
      automation_webhook_url:    initialData?.automation_webhook_url    ?? '',
      automation_webhook_secret: initialData?.automation_webhook_secret ?? '',
      automation_allowed_host:   initialData?.automation_allowed_host   ?? '',
      projects_enabled:       initialData?.projects_enabled       ?? false,
      locations_enabled:      initialData?.locations_enabled      ?? false,
    }
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const res = await updateSettings(initialData.id, data);
      if (res.success) {
        addToast({ title: 'Settings saved', type: 'success' });
      } else {
        addToast({ title: 'Error saving', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose which events you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Content Published</p>
              <p className="text-sm text-slate-500">Get notified when a new page or service goes live.</p>
            </div>
            <Toggle 
              checked={watch('notify_on_publish')} 
              onChange={(e) => setValue('notify_on_publish', e.target.checked)} 
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Monthly Summary</p>
              <p className="text-sm text-slate-500">Receive a monthly report of traffic and leads.</p>
            </div>
            <Toggle 
              checked={watch('notify_monthly_summary')} 
              onChange={(e) => setValue('notify_monthly_summary', e.target.checked)} 
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">New Blog Post Alerts</p>
              <p className="text-sm text-slate-500">Get notified when an AI-generated blog post is published.</p>
            </div>
            <Toggle 
              checked={watch('notify_new_blog_post')} 
              onChange={(e) => setValue('notify_new_blog_post', e.target.checked)} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Notifications</CardTitle>
          <CardDescription>
            When a visitor submits a form, send the lead data to an automation webhook (n8n, Make, Zapier).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Webhook URL"
            value={watch('lead_webhook_url')}
            onChange={(e) => setValue('lead_webhook_url', e.target.value)}
            placeholder="https://your-n8n-instance.com/webhook/..."
            type="url"
          />
          <Input
            label="Webhook Secret (optional)"
            value={watch('lead_webhook_secret')}
            onChange={(e) => setValue('lead_webhook_secret', e.target.value)}
            placeholder="Sent as Authorization: Bearer ..."
            type="password"
          />
          <p className="text-xs text-slate-400">
            Leave blank to disable webhook dispatch. The secret is sent as a Bearer token in the Authorization header.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Automation (n8n)</CardTitle>
          <CardDescription>
            Stream CRM events (new leads, deal stage changes, completed calls) to your n8n workflows.
            Events are signed with the secret and delivered to the webhook URL below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Enable Automation</p>
              <p className="text-sm text-slate-500">Emit signed CRM events to n8n. Leave off to pause all outbound events.</p>
            </div>
            <Toggle
              checked={watch('automation_enabled')}
              onChange={(e) => setValue('automation_enabled', e.target.checked)}
            />
          </div>
          <Input
            label="n8n Webhook URL"
            value={watch('automation_webhook_url')}
            onChange={(e) => setValue('automation_webhook_url', e.target.value)}
            placeholder="https://your-n8n-instance.com/webhook/..."
            type="url"
          />
          <Input
            label="Signing Secret"
            value={watch('automation_webhook_secret')}
            onChange={(e) => setValue('automation_webhook_secret', e.target.value)}
            placeholder="Used to sign events (X-Tribe-Signature: sha256=...)"
            type="password"
          />
          <Input
            label="Allowed Host"
            value={watch('automation_allowed_host')}
            onChange={(e) => setValue('automation_allowed_host', e.target.value)}
            placeholder="e.g. your-n8n-instance.com — permits this host past the SSRF guard"
          />
          <p className="text-xs text-slate-400">
            The allowed host lets the webhook URL bypass the private-network SSRF block for self-hosted n8n.
            Only set it to a host you control.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Manage how the website displays agency attribution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Show "Powered by Tribe CMS"</p>
              <p className="text-sm text-slate-500">Display a small badge in the footer of your website.</p>
            </div>
            <Toggle 
              checked={watch('show_powered_by')} 
              onChange={(e) => setValue('show_powered_by', e.target.checked)} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Modules</CardTitle>
          <CardDescription>Enable optional sections on your website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Projects Showcase</p>
              <p className="text-sm text-slate-500">Display a portfolio of completed work on your site.</p>
            </div>
            <Toggle
              checked={watch('projects_enabled')}
              onChange={(e) => setValue('projects_enabled', e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Locations</p>
              <p className="text-sm text-slate-500">Show your business locations (address &amp; phone) and per-location pages.</p>
            </div>
            <Toggle
              checked={watch('locations_enabled')}
              onChange={(e) => setValue('locations_enabled', e.target.checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-12">
        <Button type="submit" isLoading={isPending} size="lg">Save Preferences</Button>
      </div>
    </form>
  );
}
