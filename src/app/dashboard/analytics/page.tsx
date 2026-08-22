import { getAnalytics, getSourceSpend } from './actions';
import { getActiveLeadSources } from '../deals/actions';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export default async function AnalyticsPage() {
  const [analytics, spend, sources] = await Promise.all([
    getAnalytics(),
    getSourceSpend(),
    getActiveLeadSources(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Revenue, pipeline, and ROI across your lead sources.</p>
      </div>
      <AnalyticsDashboard analytics={analytics} spend={spend} sources={sources} />
    </div>
  );
}
