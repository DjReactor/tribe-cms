'use client';
import { useState, useTransition } from 'react';
import { updateCacheSettings, purgeCacheNow, type CacheSettingsView } from './cache-actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

/**
 * "Site Cache" — agency-admin only. The page gates rendering and both actions
 * re-check `requireAgencyAdmin()`.
 *
 * Content edits do NOT wait for this interval: every dashboard save calls
 * `revalidatePath` for the pages it affects, so an edit is live on the next
 * request. This interval is the safety net for a write path that forgets to,
 * and the manual button is the escape hatch when something looks stale.
 */
export function CacheControlCard({ initialData }: { initialData: CacheSettingsView }) {
  const { addToast } = useToast();
  const [isSaving, startSaving] = useTransition();
  const [ttl, setTtl] = useState(String(initialData.cache_ttl_minutes || 0));
  const [purging, setPurging] = useState(false);
  const [lastPurged, setLastPurged] = useState(initialData.cache_last_purged);

  const save = () => {
    startSaving(async () => {
      const res = await updateCacheSettings(Number(ttl));
      if (res.success) {
        addToast({ title: 'Cache interval saved', type: 'success' });
      } else {
        addToast({ title: 'Error saving', description: res.error, type: 'error' });
      }
    });
  };

  const purge = async () => {
    setPurging(true);
    const res = await purgeCacheNow();
    setPurging(false);
    if (res.success) {
      setLastPurged(res.purgedAt || new Date().toISOString());
      addToast({ title: 'Cache purged', description: 'Every public page rebuilds on its next visit.', type: 'success' });
    } else {
      addToast({ title: 'Purge failed', description: res.error, type: 'error' });
    }
  };

  const ttlNum = Number(ttl);
  const showCeilingNote = Number.isFinite(ttlNum) && ttlNum > 60;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Cache</CardTitle>
        <CardDescription>
          Public pages are saved as finished HTML and reused, which is what makes them fast.
          Editing content in the dashboard refreshes the affected pages immediately — these
          controls are the safety net, not the main mechanism.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="cache_ttl_minutes">
            Automatic refresh interval (minutes)
          </label>
          <div className="flex items-center gap-3">
            <Input
              id="cache_ttl_minutes"
              type="number"
              min={0}
              max={1440}
              step={1}
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              className="max-w-[140px]"
            />
            <Button type="button" onClick={save} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            How often every public page is rebuilt regardless of edits. <strong>0 disables it</strong>,
            leaving the built-in hourly refresh as the only timer.
          </p>
          {showCeilingNote && (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Values above 60 are accepted but have no extra effect — pages already refresh at
              least hourly, and that ceiling is fixed at build time by the framework.
            </p>
          )}
        </div>

        <div className="border-t border-border pt-6 space-y-2">
          <label className="text-sm font-medium text-foreground">Purge now</label>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={purge} disabled={purging}>
              {purging ? 'Purging…' : 'Purge cache now'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {lastPurged
                ? `Last purged ${new Date(lastPurged).toLocaleString()}`
                : 'Never purged'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Clears every cached public page. The next visitor to each page gets a freshly built
            version. Safe to run any time; the only cost is that the first visit to each page is
            slightly slower.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
