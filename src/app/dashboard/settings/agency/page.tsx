import { getSettings } from '../actions';
import { AgencySettingsForm } from './AgencySettingsForm';
import { LeadNotificationsCard } from './LeadNotificationsCard';
import { getNotificationSettings } from './notifications-actions';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';

export default async function AgencySettingsPage() {
  const user = await requireAuth();

  if (user.role !== 'agency_admin') {
    notFound();
  }

  const settings = await getSettings();
  const notificationSettings = await getNotificationSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-red-700 tracking-tight flex items-center gap-2">
          Agency Interventions
        </h1>
        <p className="text-slate-500 mt-2">Manage feature flags, API keys, and instance updates. (Agency Admin Only)</p>
      </div>

      <AgencySettingsForm initialData={settings} />
      <LeadNotificationsCard initialData={notificationSettings} />
    </div>
  );
}
