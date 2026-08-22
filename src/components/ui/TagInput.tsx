'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  id?: string;
  className?: string;
}

/**
 * Controlled chip/tag input. Type a token and press Enter or comma to add it;
 * Backspace on an empty field removes the last chip. Pasting a comma- or
 * newline-separated list adds them all. Tokens are trimmed and de-duplicated.
 * Styled to match the dashboard `Input` component.
 */
export function TagInput({
  value,
  onChange,
  label,
  error,
  hint,
  placeholder = 'Type and press Enter…',
  id,
  className,
}: TagInputProps) {
  const reactId = React.useId();
  const inputId = id || reactId;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [draft, setDraft] = React.useState('');

  const commit = (raw: string) => {
    const token = raw.trim();
    setDraft('');
    if (!token || value.includes(token)) return;
    onChange([...value, token]);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault();
      removeAt(value.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!/[,\n]/.test(text)) return;
    e.preventDefault();
    const next = [...value];
    for (const token of text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)) {
      if (!next.includes(token)) next.push(token);
    }
    onChange(next);
    setDraft('');
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium leading-none text-foreground">
          {label}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-xs transition-[color,box-shadow]',
          'focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/50',
          error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20'
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-md bg-secondary py-1 pl-2.5 pr-1 text-xs font-medium text-secondary-foreground"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeAt(i);
              }}
              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="h-6 min-w-[8ch] flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

TagInput.displayName = 'TagInput';
