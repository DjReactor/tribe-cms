'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { upsertSourceSpend, deleteSourceSpend } from './actions';

const STAGE_ORDER = ['new', 'estimate_scheduled', 'quoted', 'won', 'lost'];
const STAGE_LABEL: Record<string, string> = {
  new: 'New', estimate_scheduled: 'Estimate Scheduled', quoted: 'Quoted', won: 'Won', lost: 'Lost',
};

const money = (n: any) =>
  Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const num = (n: any) => Number(n || 0);

export function AnalyticsDashboard({ analytics, spend, sources }: { analytics: any; spend: any[]; sources: any[] }) {
  const s = analytics.summary || {};
  const speed = analytics.speedToLead || {};

  return (
    <div className="space-y-8">
      {/* Headline scalars */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Won Revenue" value={money(s.won_revenue)} />
        <Stat label="Win Rate" value={`${num(s.win_rate_pct)}%`} />
        <Stat label="Avg Job Value" value={money(s.avg_job_value)} />
        <Stat label="Avg Days to Close" value={num(s.avg_days_to_close).toFixed(1)} />
        <Stat label="Speed to Lead" value={`${num(speed.avg_days_to_first_touch).toFixed(1)}d`} />
        <Stat label="Total Deals" value={num(s.total_deals)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <Card>
          <CardHeader><CardTitle>Pipeline Funnel</CardTitle></CardHeader>
          <CardContent>
            <BarList
              rows={STAGE_ORDER.map((stage) => {
                const row = analytics.funnel.find((f: any) => f.stage === stage);
                return { label: STAGE_LABEL[stage], value: num(row?.count), sub: row?.revenue ? money(row.revenue) : '' };
              })}
              empty="No deals yet."
            />
          </CardContent>
        </Card>

        {/* Revenue by source */}
        <Card>
          <CardHeader><CardTitle>Revenue by Source</CardTitle></CardHeader>
          <CardContent>
            <BarList
              rows={analytics.revenueBySource.map((r: any) => ({ label: r.source, value: num(r.revenue), sub: `${num(r.deals)} deals`, money: true }))}
              empty="No revenue yet."
            />
          </CardContent>
        </Card>
      </div>

      {/* Cost per job + ROAS */}
      <Card>
        <CardHeader>
          <CardTitle>Cost per Job &amp; ROAS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RoasTable title="By close month" rows={analytics.costClose} />
          <RoasTable title="By lead-created cohort (recent months provisional)" rows={analytics.costCohort} provisional />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top referrers */}
        <Card>
          <CardHeader><CardTitle>Top Referrers</CardTitle></CardHeader>
          <CardContent>
            {analytics.topReferrers.length === 0 ? (
              <Empty>No referral deals yet.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {analytics.topReferrers.map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium text-slate-800">{r.referrer}</span>
                    <span className="text-slate-500">{num(r.referred_deals)} deals · {money(r.referred_revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Call outcomes */}
        <Card>
          <CardHeader><CardTitle>Call Outcomes</CardTitle></CardHeader>
          <CardContent>
            {analytics.callOutcomes.length === 0 ? (
              <Empty>No calls yet.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {analytics.callOutcomes.map((c: any) => (
                  <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="capitalize text-slate-800">{c.sentiment}</span>
                    <span className="text-slate-500">{num(c.calls)} calls · {num(c.successful)} successful</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AdSpendPanel spend={spend} sources={sources} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-400">{children}</p>;
}

function BarList({ rows, empty }: { rows: { label: string; value: number; sub?: string; money?: boolean }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.every((r) => r.value === 0) && rows.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-700">{r.label}</span>
            <span className="font-medium text-slate-900">
              {r.money ? money(r.value) : r.value}{r.sub ? <span className="ml-2 text-xs font-normal text-slate-400">{r.sub}</span> : null}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RoasTable({ title, rows, provisional }: { title: string; rows: any[]; provisional?: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {provisional && <Badge variant="warning">provisional</Badge>}
      </div>
      {rows.length === 0 ? (
        <Empty>Enter monthly ad spend below to see cost-per-job and ROAS.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-4">Source</th><th className="py-2 pr-4">Period</th><th className="py-2 pr-4">Spend</th>
                <th className="py-2 pr-4">Jobs Won</th><th className="py-2 pr-4">Revenue</th><th className="py-2 pr-4">Cost/Job</th><th className="py-2">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-4 font-medium text-slate-800">{r.source}</td>
                  <td className="py-2 pr-4 text-slate-500">{r.period}</td>
                  <td className="py-2 pr-4 text-slate-600">{money(r.spend)}</td>
                  <td className="py-2 pr-4 text-slate-600">{num(r.jobs_won)}</td>
                  <td className="py-2 pr-4 text-slate-600">{money(r.revenue)}</td>
                  <td className="py-2 pr-4 text-slate-600">{r.jobs_won ? money(r.cost_per_job) : '—'}</td>
                  <td className="py-2 font-medium text-slate-900">{r.roas ? `${num(r.roas).toFixed(1)}×` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdSpendPanel({ spend, sources }: { spend: any[]; sources: any[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [source, setSource] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');

  const onSave = () => startTransition(async () => {
    const res = await upsertSourceSpend({ source, period, amount: amount ? Number(amount) : 0 });
    if (res.success) { addToast({ title: 'Spend saved', type: 'success' }); setAmount(''); router.refresh(); }
    else addToast({ title: 'Could not save', description: res.error, type: 'error' });
  });

  const onDelete = (id: string) => startTransition(async () => {
    const res = await deleteSourceSpend(id);
    if (res.success) { addToast({ title: 'Spend removed', type: 'success' }); router.refresh(); }
    else addToast({ title: 'Could not remove', description: res.error, type: 'error' });
  });

  return (
    <Card>
      <CardHeader><CardTitle>Ad Spend</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">— Source —</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
          <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          <Input type="number" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button onClick={onSave} isLoading={isPending} disabled={!source}>Save spend</Button>
        </div>

        {spend.length === 0 ? (
          <Empty>No spend recorded yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-4">Source</th><th className="py-2 pr-4">Period</th><th className="py-2 pr-4">Amount</th><th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {spend.map((r: any) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-800">{r.expand?.source?.label || '—'}</td>
                    <td className="py-2 pr-4 text-slate-500">{r.period}</td>
                    <td className="py-2 pr-4 text-slate-600">{money(r.amount)}</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => onDelete(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
