'use client';
import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { updateSettings } from '../actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export function AgencySettingsForm({ initialData }: { initialData: any }) {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      retell_enabled: initialData?.retell_enabled ?? false,
      retell_agent_url: initialData?.retell_agent_url || '',
      reviews_enabled: initialData?.reviews_enabled ?? false,
      blog_enabled: initialData?.blog_enabled ?? false,
      service_areas_index_enabled: initialData?.service_areas_index_enabled ?? false,
      blog_auto_publish: initialData?.blog_auto_publish ?? true,
      analytics_enabled: initialData?.analytics_enabled ?? false,
      ga4_measurement_id: initialData?.ga4_measurement_id || '',
      crm_enabled: initialData?.crm_enabled ?? true,
      n8n_webhook_url: initialData?.n8n_webhook_url || '',
      n8n_api_key: initialData?.n8n_api_key || '',
      updates_enabled: initialData?.updates_enabled ?? true,
      update_channel: initialData?.update_channel || 'stable',
    }
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const res = await updateSettings(initialData.id, data);
      if (res.success) {
        addToast({ title: 'Agency settings saved', type: 'success' });
        // Hard refresh needed because we might have toggled sidebar modules
        window.location.reload();
      } else {
        addToast({ title: 'Error saving', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card className="border-red-200">
        <CardHeader className="bg-red-50/50 border-b border-red-100 rounded-t-xl">
          <CardTitle className="text-red-900">Core Modules & Integrations</CardTitle>
          <CardDescription className="text-red-700">Enable or disable features for this client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-2">CRM & Leads</h3>
            <Toggle 
              checked={watch('crm_enabled')} 
              onChange={(e) => setValue('crm_enabled', e.target.checked)} 
              label="Enable CRM Module" 
            />
            <div className="pl-6 space-y-4 mt-2">
              <Input label="n8n Webhook URL (For automation workflows)" {...register('n8n_webhook_url')} />
              <Input label="n8n API Key" type="password" {...register('n8n_api_key')} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-2">Retell AI Voice Agent</h3>
            <Toggle 
              checked={watch('retell_enabled')} 
              onChange={(e) => setValue('retell_enabled', e.target.checked)} 
              label="Enable Retell Call Logs" 
            />
            {watch('retell_enabled') && (
              <div className="pl-6">
                <Input label="Retell Agent URL / ID" {...register('retell_agent_url')} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-2">Content & SEO</h3>
            <Toggle 
              checked={watch('blog_enabled')} 
              onChange={(e) => setValue('blog_enabled', e.target.checked)} 
              label="Enable Blog System" 
            />
            {watch('blog_enabled') && (
              <div className="pl-6">
                <Toggle 
                  checked={watch('blog_auto_publish')} 
                  onChange={(e) => setValue('blog_auto_publish', e.target.checked)} 
                  label="Auto-publish incoming n8n/AI blog drafts" 
                />
              </div>
            )}
            
            <Toggle
              checked={watch('service_areas_index_enabled')}
              onChange={(e) => setValue('service_areas_index_enabled', e.target.checked)}
              label="Enable Service Areas Index Page (/service-areas)"
            />

            <Toggle
              checked={watch('reviews_enabled')}
              onChange={(e) => setValue('reviews_enabled', e.target.checked)}
              label="Enable Reviews Integration (Google Sync)"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-2">Analytics</h3>
            <Toggle 
              checked={watch('analytics_enabled')} 
              onChange={(e) => setValue('analytics_enabled', e.target.checked)} 
              label="Enable Google Analytics 4" 
            />
            {watch('analytics_enabled') && (
              <div className="pl-6">
                <Input label="GA4 Measurement ID (G-XXXXXXXXXX)" {...register('ga4_measurement_id')} />
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader className="bg-red-50/50 border-b border-red-100 rounded-t-xl">
          <CardTitle className="text-red-900">Instance Infrastructure</CardTitle>
          <CardDescription className="text-red-700">Manage updates for this specific VPS instance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Toggle 
            checked={watch('updates_enabled')} 
            onChange={(e) => setValue('updates_enabled', e.target.checked)} 
            label="Accept Central Updates" 
          />
          <Select label="Update Channel" {...register('update_channel')}>
            <option value="stable">Stable (Production)</option>
            <option value="beta">Beta (Early Access)</option>
          </Select>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-12">
        <Button type="submit" isLoading={isPending} size="lg" className="bg-red-600 hover:bg-red-700 text-white">
          Save Agency Settings
        </Button>
      </div>
    </form>
  );
}
