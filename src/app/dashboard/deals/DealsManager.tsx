'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { createDeal, updateDealStage, searchContacts } from './actions';

const STAGE_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'estimate_scheduled', label: 'Estimate Scheduled' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

type Picked = { id: string; name: string } | null;

function money(n: number | undefined) {
  if (!n) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function DealsManager({ initialDeals, sources }: { initialDeals: any[]; sources: any[] }) {
  const { addToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [contact, setContact] = useState<Picked>(null);
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('new');
  const [estimateValue, setEstimateValue] = useState('');
  const [wonValue, setWonValue] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [referrer, setReferrer] = useState<Picked>(null);

  const selectedSource = sources.find((s) => s.id === sourceId);
  const isReferral = selectedSource?.slug === 'referral';

  const resetForm = () => {
    setContact(null);
    setTitle('');
    setStage('new');
    setEstimateValue('');
    setWonValue('');
    setSourceId('');
    setReferrer(null);
  };

  const onCreate = () => {
    if (!contact) {
      addToast({ title: 'Select a contact for this deal', type: 'error' });
      return;
    }
    startTransition(async () => {
      const res = await createDeal({
        contact_id: contact.id,
        title: title.trim(),
        stage,
        estimate_value: estimateValue ? Number(estimateValue) : undefined,
        won_value: wonValue ? Number(wonValue) : undefined,
        source_id: sourceId || undefined,
        referred_by: isReferral && referrer ? referrer.id : undefined,
      });
      if (res.success) {
        addToast({ title: 'Deal created', type: 'success' });
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        addToast({ title: 'Could not create deal', description: res.error, type: 'error' });
      }
    });
  };

  const onStageChange = (id: string, newStage: string) => {
    startTransition(async () => {
      const res = await updateDealStage(id, newStage);
      if (res.success) {
        addToast({ title: 'Stage updated', type: 'success' });
        router.refresh();
      } else {
        addToast({ title: 'Could not update stage', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>New Deal</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Referred by</th>
            </tr>
          </thead>
          <tbody>
            {initialDeals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No deals yet. Create one to start capturing revenue.
                </td>
              </tr>
            )}
            {initialDeals.map((d) => (
              <tr key={d.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {d.expand?.contact?.name || '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">{d.title || '—'}</td>
                <td className="px-4 py-3">
                  <Select
                    value={d.stage}
                    disabled={isPending}
                    onChange={(e) => onStageChange(d.id, e.target.value)}
                    className="h-9 py-1"
                  >
                    {STAGE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {d.stage === 'won' ? money(d.won_value) : money(d.estimate_value)}
                </td>
                <td className="px-4 py-3 text-slate-600">{d.expand?.source?.label || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{d.expand?.referred_by?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Deal" description="Capture a revenue opportunity for a contact.">
        <div className="space-y-4">
          <ContactPicker label="Contact" value={contact} onChange={setContact} />

          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Roof replacement" />

          <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estimate value ($)"
              type="number"
              value={estimateValue}
              onChange={(e) => setEstimateValue(e.target.value)}
              placeholder="0"
            />
            {stage === 'won' && (
              <Input
                label="Won value ($)"
                type="number"
                value={wonValue}
                onChange={(e) => setWonValue(e.target.value)}
                placeholder="0"
              />
            )}
          </div>

          <Select label="Source" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">— Select a source —</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>

          {isReferral && (
            <ContactPicker
              label="Referred by"
              value={referrer}
              onChange={setReferrer}
              placeholder="Search the customer who referred this lead…"
            />
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} isLoading={isPending}>
              Create Deal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ContactPicker({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: Picked;
  onChange: (c: Picked) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) return;
    const term = q.trim();
    if (!term) {
      setResults([]);
      setOpen(false);
      return;
    }
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchContacts(term);
      if (!active) return;
      setResults(r);
      setOpen(true);
      setLoading(false);
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, value]);

  if (value) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="truncate text-sm font-medium text-slate-900">{value.name || value.id}</span>
          <button
            type="button"
            className="text-xs font-medium text-slate-500 hover:text-red-600"
            onClick={() => {
              onChange(null);
              setQ('');
            }}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        label={label}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder || 'Search by name, phone, or email…'}
        autoComplete="off"
      />
      {loading && <p className="mt-1 text-xs text-slate-400">Searching…</p>}
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
              onClick={() => {
                onChange({ id: c.id, name: c.name });
                setOpen(false);
              }}
            >
              <span className="text-sm font-medium text-slate-900">{c.name || '(no name)'}</span>
              <span className="text-xs text-slate-400">{c.email || c.phone || c.id}</span>
            </button>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && q.trim() && (
        <p className="mt-1 text-xs text-slate-400">No matching contacts.</p>
      )}
    </div>
  );
}
