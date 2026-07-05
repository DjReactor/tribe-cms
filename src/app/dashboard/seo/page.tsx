import { getSeoSettings, get404Logs, getRedirects } from './actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function SeoOverviewPage() {
  const settings = await getSeoSettings();
  const redirects = await getRedirects();
  const logs = await get404Logs();
  
  const activeRedirects = redirects.length;
  const unresolved404s = logs.filter((l: any) => !l.resolved).length;
  
  // Basic health score logic
  let score = 100;
  if (!settings.site_name) score -= 10;
  if (!settings.default_og_image) score -= 5;
  if (!settings.google_verification) score -= 5;
  if (unresolved404s > 0) score -= Math.min(20, unresolved404s * 2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none">
          <CardContent className="p-6">
            <p className="text-blue-100 font-medium mb-1">SEO Health Score</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{score}</span>
              <span className="text-blue-200 mb-1">/ 100</span>
            </div>
            {score < 90 && (
              <p className="text-sm text-blue-100 mt-4">
                Fill out your core settings and resolve 404 errors to improve your score.
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-500 font-medium mb-1">Active Redirects</p>
            <div className="text-3xl font-bold text-slate-900">{activeRedirects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-500 font-medium mb-1">Unresolved 404s</p>
            <div className="text-3xl font-bold text-red-600">{unresolved404s}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}