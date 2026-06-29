'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { retryOutboxFailures } from './actions';

const STATUS_VARIANT: Record<string, any> = {
  pending: 'info', delivering: 'warning', delivered: 'success', failed: 'warning', dead: 'danger',
};
const ORDER = ['pending', 'delivering', 'delivered', 'failed', 'dead'];

export function OutboxView({ counts, recent }: { counts: Record<string, number>; recent: any[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const stuck = (counts.failed || 0) + (counts.dead || 0);

  const onRetry = () => startTransition(async () => {
    const res = await retryOutboxFailures();
    if (res.success) { addToast({ title: `Re-queued ${res.count} event(s)`, type: 'success' }); router.refresh(); }
    else addToast({ title: 'Retry failed', description: res.error, type: 'error' });
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {ORDER.map((s) => (
          <Card key={s}>
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wider text-slate-400">{s}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{counts[s] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Failed &amp; dead-lettered</h2>
        <Button size="sm" onClick={onRetry} isLoading={isPending} disabled={stuck === 0}>
          Retry all failures
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No failed or dead events.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-4">Event</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Attempts</th>
                    <th className="py-2 pr-4">Last error</th><th className="py-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 font-medium text-slate-800">{r.event}</td>
                      <td className="py-2 pr-4"><Badge variant={STATUS_VARIANT[r.status] || 'default'}>{r.status}</Badge></td>
                      <td className="py-2 pr-4 text-slate-600">{r.attempts}</td>
                      <td className="py-2 pr-4 max-w-xs truncate text-slate-500" title={r.last_error}>{r.last_error || '—'}</td>
                      <td className="py-2 text-slate-500">{r.updated ? new Date(r.updated).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
