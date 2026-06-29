import { redirect } from 'next/navigation';
import { requireAgencyAdmin } from '@/lib/auth';
import { getLeadSources } from './actions';
import { LeadSourcesPanel } from './LeadSourcesPanel';

export default async function LeadSourcesPage() {
  try {
    await requireAgencyAdmin();
  } catch {
    redirect('/dashboard');
  }

  const sources = await getLeadSources();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lead Sources</h1>
        <p className="text-slate-500 mt-2">
          The channels leads and deals are attributed to. These power revenue-by-source and
          cost-per-job analytics. &ldquo;Delete&rdquo; archives a source so historical attribution
          stays intact.
        </p>
      </div>

      <LeadSourcesPanel initialSources={sources as any[]} />
    </div>
  );
}
