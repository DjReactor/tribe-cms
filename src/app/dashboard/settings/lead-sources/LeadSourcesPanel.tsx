'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  createLeadSource,
  updateLeadSource,
  archiveLeadSource,
  restoreLeadSource,
  markLeadSourceReviewed,
} from './actions';

interface LeadSource {
  id: string;
  slug: string;
  label: string;
  is_active: boolean;
  needs_review: boolean;
  sort_order?: number;
}

export function LeadSourcesPanel({ initialSources }: { initialSources: LeadSource[] }) {
  const { addToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newLabel, setNewLabel] = useState('');

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        addToast({ title: okMsg, type: 'success' });
        router.refresh();
      } else {
        addToast({ title: 'Action failed', description: res.error, type: 'error' });
      }
    });

  const onAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    setNewLabel('');
    run(() => createLeadSource({ label }), 'Source added');
  };

  const active = initialSources.filter((s) => s.is_active);
  const archived = initialSources.filter((s) => !s.is_active);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add a Source</CardTitle>
          <CardDescription>
            The slug is generated automatically (e.g. &ldquo;Facebook Ads&rdquo; &rarr; <code>facebook_ads</code>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Source name"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Facebook Ads"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAdd();
                  }
                }}
              />
            </div>
            <Button onClick={onAdd} isLoading={isPending} disabled={!newLabel.trim()}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sources</CardTitle>
          <CardDescription>Shown in source dropdowns when attributing leads and deals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {active.length === 0 && <p className="text-sm text-slate-400">No active sources.</p>}
          {active.map((s) => (
            <LeadSourceRow key={s.id} source={s} pending={isPending} run={run} archived={false} />
          ))}
        </CardContent>
      </Card>

      {archived.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archived</CardTitle>
            <CardDescription>Hidden from new dropdowns, but still resolve for existing records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {archived.map((s) => (
              <LeadSourceRow key={s.id} source={s} pending={isPending} run={run} archived />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LeadSourceRow({
  source,
  pending,
  archived,
  run,
}: {
  source: LeadSource;
  pending: boolean;
  archived: boolean;
  run: (fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) => void;
}) {
  const [label, setLabel] = useState(source.label);
  const dirty = label.trim() !== source.label && label.trim().length > 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
      <div className="flex-1 min-w-0">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
        />
        <code className="text-xs text-slate-400">{source.slug}</code>
      </div>

      {source.needs_review && (
        <span className="shrink-0 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          Needs review
        </span>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {dirty && (
          <Button
            size="sm"
            variant="secondary"
            isLoading={pending}
            onClick={() => run(() => updateLeadSource(source.id, { label: label.trim() }), 'Renamed')}
          >
            Save
          </Button>
        )}
        {source.needs_review && (
          <Button
            size="sm"
            variant="ghost"
            isLoading={pending}
            onClick={() => run(() => markLeadSourceReviewed(source.id), 'Marked reviewed')}
          >
            Mark reviewed
          </Button>
        )}
        {archived ? (
          <Button
            size="sm"
            variant="secondary"
            isLoading={pending}
            onClick={() => run(() => restoreLeadSource(source.id), 'Restored')}
          >
            Restore
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            isLoading={pending}
            onClick={() => run(() => archiveLeadSource(source.id), 'Archived')}
          >
            Archive
          </Button>
        )}
      </div>
    </div>
  );
}
