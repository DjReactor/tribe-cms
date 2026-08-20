import Link from 'next/link';
import { AlertTriangle, ListChecks } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getLandingPagesData } from './actions';
import { PairsList } from './PairsList';
import { CoverageMatrix } from './CoverageMatrix';
import { PAIR_COUNT_WARNING_THRESHOLD } from '@/lib/pair-readiness';

export default async function LandingPagesPage() {
  const { pairs, services, areas, source } = await getLandingPagesData();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Landing Pages</h1>
          <p className="text-slate-500 mt-2 max-w-3xl">
            One page for one service in one area, at <code className="font-mono text-slate-600">/area/service</code>.
            Each one is a record somebody deliberately created and wrote — combinations without a
            page simply do not exist on the site.
          </p>
        </div>
        <Link href="/dashboard/landing-pages/checklist" className="shrink-0">
          <Button variant="outline">
            <ListChecks className="h-4 w-4 mr-2" />
            Checklist Items
          </Button>
        </Link>
      </div>

      {pairs.length >= PAIR_COUNT_WARNING_THRESHOLD && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="font-medium">
              {pairs.length} landing pages. Worth pausing before the next one.
            </p>
            <p>
              A site with 3,000+ location pages took a manual thin-content action despite
              human-written, unique copy on every page — volume alone did it, while a set of ~35
              similar pages ranked fine. Nobody competitive publishes every service in every area.
              Keep adding pages you have real local proof for, and stop where that runs out.
            </p>
          </div>
        </div>
      )}

      <PairsList initialPairs={pairs} services={services} areas={areas} source={source} />

      <Card>
        <CardHeader>
          <CardTitle>Coverage</CardTitle>
          <CardDescription>
            Which combinations have a page. A filled dot is published, a hollow one is a draft.
            This is a map, not a to-do list — an empty cell is a legitimate answer, and the usual
            one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoverageMatrix pairs={pairs} services={services} areas={areas} />
        </CardContent>
      </Card>
    </div>
  );
}
