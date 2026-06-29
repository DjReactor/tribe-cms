import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getDeals, getActiveLeadSources } from './actions';
import { DealsManager } from './DealsManager';

export default async function DealsPage() {
  try {
    await requireAuth();
  } catch {
    redirect('/login');
  }

  const [deals, sources] = await Promise.all([getDeals(), getActiveLeadSources()]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Deals</h1>
        <p className="text-slate-500 mt-2">
          Each deal is a job tied to a contact. Stage changes are recorded as activities and feed
          your pipeline and revenue analytics.
        </p>
      </div>

      <DealsManager initialDeals={deals as any[]} sources={sources as any[]} />
    </div>
  );
}
