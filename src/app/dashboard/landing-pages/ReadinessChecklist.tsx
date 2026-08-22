import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReadinessCheck } from '@/lib/pair-readiness';

/**
 * The system half of the readiness checklist: hardcoded predicates over data,
 * rendered the same way during selection (support checks only) and on a saved
 * record (all of them). No 'use client' — it is presentational, so both server
 * pages and client components can render it.
 */
export function ReadinessChecklist({ checks, className }: { checks: ReadinessCheck[]; className?: string }) {
  if (checks.length === 0) return null;

  return (
    <ul className={cn('space-y-3', className)}>
      {checks.map((check) => (
        <li key={check.id} className="flex gap-3">
          <span className="mt-0.5 shrink-0">
            {check.ok
              ? <CheckCircle2 className="h-5 w-5 text-success" />
              : check.blocking
                ? <AlertTriangle className="h-5 w-5 text-warning" />
                : <Circle className="h-5 w-5 text-muted-foreground" />}
          </span>
          <div className="min-w-0">
            <p className={cn('text-sm font-medium', check.ok ? 'text-foreground' : 'text-muted-foreground')}>
              {check.label}
              {check.blocking && !check.ok && (
                <span className="ml-2 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                  Required to publish
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">{check.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** `4/6`, coloured by how close it is. Advisory — nothing here blocks a save. */
export function ReadinessScore({ passed, total }: { passed: number; total: number }) {
  const tone = passed === total
    ? 'bg-success/10 text-success'
    : passed >= total / 2
      ? 'bg-muted text-foreground'
      : 'bg-warning/10 text-warning';

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums', tone)}>
      {passed}/{total}
    </span>
  );
}
