'use client';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { createPair } from '../actions';
import { ReadinessChecklist } from '../ReadinessChecklist';
import type { Pair, Service, ServiceArea } from '@/types/index';
import {
  buildReadinessFacts,
  evaluateReadiness,
  getPairPath,
  PAIR_COUNT_WARNING_THRESHOLD,
  type ReadinessSource,
} from '@/lib/pair-readiness';
import { indexServices, getAncestors as getServiceAncestors } from '@/lib/service-tree';
import { indexAreas, getAreaAncestors } from '@/lib/area-tree';

interface Props {
  services: Service[];
  areas: ServiceArea[];
  pairs: Pair[];
  source: ReadinessSource;
}

/**
 * Two pickers, then a draft. No bulk path, and no path that creates more than
 * one page at a time — the deliberateness is the feature.
 *
 * ANY combination may be created, including one with nothing behind it yet:
 * agencies do their keyword research off-platform and often create the record
 * before the projects and reviews that will support it exist. The checks below
 * are advisory and shown at selection time so that choice is an informed one.
 */
export function PairCreator({ services, areas, pairs, source }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [serviceId, setServiceId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [isPending, startTransition] = useTransition();

  const servicesById = useMemo(() => indexServices(services), [services]);
  const areasById = useMemo(() => indexAreas(areas), [areas]);

  const serviceOptions = useMemo(() => services.map((s) => ({
    id: s.id,
    label: [...getServiceAncestors(s, servicesById).map((a) => a.name), s.name].join('  >  ')
      + (s.is_active ? '' : '  (hidden)'),
  })).sort((a, b) => a.label.localeCompare(b.label)), [services, servicesById]);

  const areaOptions = useMemo(() => areas.map((a) => ({
    id: a.id,
    label: [...getAreaAncestors(a, areasById).map((x) => x.name), a.name].join('  >  ')
      + (a.is_active ? '' : '  (hidden)'),
  })).sort((a, b) => a.label.localeCompare(b.label)), [areas, areasById]);

  const service = serviceId ? servicesById.get(serviceId) : undefined;
  const area = areaId ? areasById.get(areaId) : undefined;
  const chosen = Boolean(service && area);

  const existing = chosen
    ? pairs.find((p) => p.service === serviceId && p.service_area === areaId)
    : undefined;

  // Only the support checks here: body, H1 and intro belong to a page that has
  // not been written yet, so showing them as failures would be noise.
  const checks = chosen
    ? evaluateReadiness(buildReadinessFacts(source, serviceId, areaId)).filter((c) => c.group === 'support')
    : [];

  const handleCreate = () => {
    startTransition(async () => {
      const res = await createPair({ service: serviceId, service_area: areaId });
      if (res.success && 'id' in res && res.id) {
        router.push(`/dashboard/landing-pages/${res.id}`);
        return;
      }
      if ('existingId' in res && res.existingId) {
        router.push(`/dashboard/landing-pages/${res.existingId}`);
        return;
      }
      addToast({ title: 'Could not create the page', description: res.error, type: 'error' });
    });
  };

  return (
    <div className="space-y-8">
      {pairs.length >= PAIR_COUNT_WARNING_THRESHOLD && (
        <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning/10 p-4 text-sm text-warning">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <p>
            This site already has {pairs.length} landing pages. Volume alone has drawn manual
            thin-content actions on sites whose copy was unique and human-written. Add this one only
            if there is something genuinely local to say on it.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pick the pair</CardTitle>
          <CardDescription>
            One service, one area. That combination is the whole key — there is no third dimension,
            because every extra one multiplies the page count.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">— Choose a service —</option>
              {serviceOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </Select>
            <Select label="Service Area" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">— Choose an area —</option>
              {areaOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </Select>
          </div>

          {chosen && (
            <div className="rounded-xl border border-border/60 bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Page URL</p>
              <p className="font-mono text-sm text-foreground break-all">
                {getPairPath(area!.slug, service!.slug)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                The second segment defaults to the service slug and can be changed on the page
                itself.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {chosen && existing && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-foreground">
              {service!.name} in {area!.name} already has a landing page.
            </p>
            <Link href={`/dashboard/landing-pages/${existing.id}`} className="inline-block mt-4">
              <Button variant="outline">Open it</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {chosen && !existing && (
        <Card>
          <CardHeader>
            <CardTitle>What is already behind this page</CardTitle>
            <CardDescription>
              None of this blocks creating the page. It is what the page will have to draw on when
              you write it — a page with none of it has to be carried entirely by its copy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ReadinessChecklist checks={checks} />
            <div className="flex justify-end">
              <Button onClick={handleCreate} isLoading={isPending} size="lg">
                Create draft
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
