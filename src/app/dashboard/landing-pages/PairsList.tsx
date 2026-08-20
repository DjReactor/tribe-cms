'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Trash2, Edit2, Plus, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/Toast';
import { setPairPublished, deletePair } from './actions';
import { ReadinessScore } from './ReadinessChecklist';
import type { Pair, Service, ServiceArea } from '@/types/index';
import {
  buildReadinessFacts,
  evaluateReadiness,
  readinessScore,
  getPairPath,
  type ReadinessSource,
} from '@/lib/pair-readiness';

interface Props {
  initialPairs: Pair[];
  services: Service[];
  areas: ServiceArea[];
  source: ReadinessSource;
}

export function PairsList({ initialPairs, services, areas, source }: Props) {
  const [pairs, setPairs] = useState<Pair[]>(initialPairs);
  const { addToast } = useToast();

  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas]);

  /**
   * Readiness is scored in the browser from the same pure module the server
   * uses, so a row's score updates the moment its record does without another
   * round trip.
   */
  const rows = useMemo(() => pairs.map((pair) => {
    const facts = buildReadinessFacts(source, pair.service, pair.service_area, pair);
    return {
      pair,
      service: serviceById.get(pair.service),
      area: areaById.get(pair.service_area),
      score: readinessScore(evaluateReadiness(facts)),
    };
  }).sort((a, b) => {
    const area = (a.area?.name || '').localeCompare(b.area?.name || '');
    return area !== 0 ? area : (a.service?.name || '').localeCompare(b.service?.name || '');
  }), [pairs, source, serviceById, areaById]);

  const handleToggle = async (pair: Pair) => {
    const next = !pair.is_published;
    setPairs((prev) => prev.map((p) => (p.id === pair.id
      ? { ...p, is_published: next, auto_unpublished: next ? false : p.auto_unpublished }
      : p)));

    const res = await setPairPublished(pair.id, next);
    if (!res.success) {
      setPairs((prev) => prev.map((p) => (p.id === pair.id ? pair : p)));
      addToast({ title: next ? 'Cannot publish yet' : 'Error unpublishing', description: res.error, type: 'error' });
    }
  };

  const handleDelete = async (pair: Pair) => {
    const service = serviceById.get(pair.service)?.name || 'this service';
    const area = areaById.get(pair.service_area)?.name || 'this area';
    if (!confirm(`Delete the landing page for ${service} in ${area}? The page and its copy are gone for good.`)) return;

    const res = await deletePair(pair.id);
    if (res.success) {
      setPairs((prev) => prev.filter((p) => p.id !== pair.id));
      addToast({ title: 'Landing page deleted', type: 'success' });
    } else {
      addToast({ title: 'Error deleting landing page', description: res.error, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/dashboard/landing-pages/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Landing Page
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Area</th>
                <th className="px-6 py-4">URL</th>
                <th className="px-6 py-4">Ready</th>
                <th className="px-6 py-4">Published</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ pair, service, area, score }) => (
                <tr key={pair.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {service?.name || <span className="text-red-600">Service deleted</span>}
                    {service && !service.is_active && (
                      <Badge variant="warning" className="ml-2">Hidden</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {area?.name || <span className="text-red-600">Area deleted</span>}
                    {area && !area.is_active && (
                      <Badge variant="warning" className="ml-2">Hidden</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {/* Live only while the page is published — an unpublished
                        pair 404s, so linking it would send the agency to the
                        404 page rather than their draft. */}
                    {area && pair.is_published ? (
                      <a
                        href={getPairPath(area.slug, pair.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-blue-600 hover:underline"
                      >
                        {getPairPath(area.slug, pair.slug)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      area ? getPairPath(area.slug, pair.slug) : `/…/${pair.slug}`
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <ReadinessScore passed={score.passed} total={score.total} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Toggle checked={pair.is_published} onChange={() => handleToggle(pair)} />
                      {pair.auto_unpublished && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                          title="Its service or area was hidden, so this page was taken down automatically."
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Auto-unpublished
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/landing-pages/${pair.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(pair)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No landing pages yet. Create one for a service and area you can write
                    genuinely local copy about.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
