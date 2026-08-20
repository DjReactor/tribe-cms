'use client';

import { useForm } from 'react-hook-form';
import { useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { BlockNoteEditor } from '@/components/dashboard/BlockNoteEditor';
import { updatePair } from '../actions';
import { ReadinessChecklist, ReadinessScore } from '../ReadinessChecklist';
import type { Pair, Service, ServiceArea, ManualChecklistItem } from '@/types/index';
import {
  buildReadinessFacts,
  evaluateReadiness,
  readinessScore,
  canPublish,
  getPairPath,
  type ReadinessSource,
} from '@/lib/pair-readiness';

const schema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  h1: z.string().optional().or(z.literal('')),
  intro: z.string().optional().or(z.literal('')),
  body: z.any().optional(),
  seo_title: z.string().max(70).optional().or(z.literal('')),
  seo_description: z.string().max(160).optional().or(z.literal('')),
  noindex: z.boolean(),
  is_published: z.boolean(),
  manual_checklist: z.record(z.string(), z.boolean()),
});

type FormData = z.infer<typeof schema>;

interface Props {
  pair: Pair;
  service?: Service;
  area?: ServiceArea;
  source: ReadinessSource;
  checklistItems: ManualChecklistItem[];
}

export function PairDetailForm({ pair, service, area, source, checklistItems }: Props) {
  const { addToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: pair.slug || '',
      h1: pair.h1 || '',
      intro: pair.intro || '',
      body: pair.body || undefined,
      seo_title: pair.seo_title || '',
      seo_description: pair.seo_description || '',
      noindex: pair.noindex ?? false,
      is_published: pair.is_published ?? false,
      manual_checklist: (pair.manual_checklist || {}) as Record<string, boolean>,
    },
  });

  const body = watch('body');
  const slug = watch('slug');
  const checklist = watch('manual_checklist');

  /**
   * Scored in the browser from the same pure module the server uses, so the
   * checklist answers while the copy is being written rather than after a save.
   */
  const checks = evaluateReadiness(buildReadinessFacts(source, pair.service, pair.service_area, {
    id: pair.id,
    h1: watch('h1'),
    intro: watch('intro'),
    body,
  }));
  const score = readinessScore(checks);

  const bodyReady = canPublish(body);
  const serviceHidden = service ? !service.is_active : true;
  const areaHidden = area ? !area.is_active : true;
  const publishBlocker = !bodyReady
    ? 'Write the page body first.'
    : serviceHidden
      ? 'The service behind this page is hidden.'
      : areaHidden
        ? 'The area behind this page is hidden.'
        : null;

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = await updatePair(pair.id, data);
      if (res.success) {
        addToast({ title: 'Landing page saved', type: 'success' });
        router.push('/dashboard/landing-pages');
      } else {
        addToast({ title: 'Error saving', description: res.error, type: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {pair.auto_unpublished && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p>
            This page was unpublished automatically because its service or area was hidden. It was
            kept rather than deleted so somebody could decide. Publish it again once both are live,
            or delete it from the list.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Address &amp; Status</CardTitle>
          <CardDescription>
            The first segment is the area&apos;s own slug; only the second belongs to this page. It
            has to be unique within the area, and nowhere else.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500 mb-1">Page URL</p>
            <p className="font-mono text-sm text-slate-900 break-all">
              {getPairPath(area?.slug || '…', slug || 'your-page')}
            </p>
          </div>

          <Input label="URL Slug" error={errors.slug?.message} {...register('slug')} />

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="pr-6">
              <p className="font-medium text-slate-900">Published</p>
              <p className="text-sm text-slate-500">
                {publishBlocker
                  ? `${publishBlocker} A landing page with no body of its own is exactly the page family Google acts on.`
                  : 'Live on the site.'}
              </p>
            </div>
            <Toggle
              checked={watch('is_published')}
              disabled={Boolean(publishBlocker) && !watch('is_published')}
              onChange={(e) => setValue('is_published', e.target.checked, { shouldDirty: true })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page Copy</CardTitle>
          <CardDescription>
            Write for this service in this place. Copy that would read the same with the city name
            swapped out is the copy that gets a page family actioned.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input label="H1 Headline" error={errors.h1?.message} {...register('h1')} />
          <Textarea label="Intro Paragraph" error={errors.intro?.message} {...register('intro')} />
          <div>
            <p className="block text-sm font-medium text-slate-700 mb-1.5">Page Body</p>
            <BlockNoteEditor
              initialContent={pair.body as any}
              onChange={(content) => setValue('body', content, { shouldDirty: true })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Readiness</CardTitle>
              <CardDescription>
                Measured from your own data. Advisory, except the body.
              </CardDescription>
            </div>
            <ReadinessScore passed={score.passed} total={score.total} />
          </div>
        </CardHeader>
        <CardContent>
          <ReadinessChecklist checks={checks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Checklist</CardTitle>
          <CardDescription>
            Your own steps, ticked by hand. These are plain labels with no logic behind them —
            anything the CMS could check for itself is in Readiness above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.length === 0 ? (
            <p className="text-sm text-slate-500">
              No checklist items yet.{' '}
              <Link href="/dashboard/landing-pages/checklist" className="text-blue-600 hover:underline">
                Add some
              </Link>{' '}
              and they appear on every landing page.
            </p>
          ) : (
            checklistItems.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200/60 p-4 cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={Boolean(checklist?.[item.id])}
                  onChange={(e) => setValue(
                    'manual_checklist',
                    { ...(checklist || {}), [item.id]: e.target.checked },
                    { shouldDirty: true },
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                </div>
              </label>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO &amp; Search Visibility</CardTitle>
          <CardDescription>Optimize how this page appears on Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input label="SEO Title (Max 70 chars)" error={errors.seo_title?.message} {...register('seo_title')} />
          <Textarea label="SEO Description (Max 160 chars)" error={errors.seo_description?.message} {...register('seo_description')} />

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <p className="font-medium text-slate-900">Hide from Search Engines (Noindex)</p>
              <p className="text-sm text-slate-500">Prevent Google from indexing this page</p>
            </div>
            <Toggle
              checked={watch('noindex')}
              onChange={(e) => setValue('noindex', e.target.checked, { shouldDirty: true })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4 pb-12">
        <Button type="submit" isLoading={isPending} size="lg">Save Landing Page</Button>
      </div>
    </form>
  );
}
