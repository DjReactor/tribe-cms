import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeFocusKeyword, focusKeywordScore, type KeywordSubject } from '@/lib/focus-keyword';

/**
 * Live on-page analysis against the focus keyword.
 *
 * Presentational, like `ReadinessChecklist` — no `'use client'`, so a client
 * form re-rendering on every keystroke and a server page both render it from
 * the same pure module.
 *
 * Everything shown is ADVISORY. Nothing here blocks a save: a keyword the copy
 * does not happen to repeat is a judgement call about writing, not an error.
 */
export function FocusKeywordAnalysis({ subject, className }: { subject: KeywordSubject; className?: string }) {
  const keyword = (subject.keyword || '').trim();

  if (!keyword) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        Set a focus keyword to see how this page lines up with it — heading, title,
        description, URL and opening paragraph.
      </p>
    );
  }

  const checks = analyzeFocusKeyword(subject);
  const { passed, total } = focusKeywordScore(checks);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums',
            passed === total
              ? 'bg-success/10 text-success'
              : passed >= total / 2
                ? 'bg-muted text-foreground'
                : 'bg-warning/10 text-warning',
          )}
        >
          {passed}/{total}
        </span>
        <span className="text-sm text-muted-foreground">
          for &ldquo;{keyword}&rdquo;
        </span>
      </div>

      <ul className="space-y-3">
        {checks.map((check) => (
          <li key={check.id} className="flex gap-3">
            <span className="mt-0.5 shrink-0">
              {check.ok
                ? <CheckCircle2 className="h-5 w-5 text-success" />
                : check.inverse
                  ? <AlertTriangle className="h-5 w-5 text-warning" />
                  : <Circle className="h-5 w-5 text-muted-foreground" />}
            </span>
            <div className="min-w-0">
              <p className={cn('text-sm font-medium', check.ok ? 'text-foreground' : 'text-muted-foreground')}>
                {check.label}
              </p>
              <p className="text-sm text-muted-foreground">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Advisory only — none of this blocks saving, and there is no keyword-density
        target to hit. Write for the reader; these just catch the mechanical misses.
      </p>
    </div>
  );
}
