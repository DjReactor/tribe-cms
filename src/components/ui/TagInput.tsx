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
    <div className={cn('w-full space-y-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/50 backdrop-blur-sm px-2 py-1.5 text-sm shadow-sm transition-all',
          'focus-within:border-blue-500 focus-within:bg-white focus-within:outline-none focus-within:ring-4 focus-within:ring-blue-500/10',
          error && 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10'
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 py-1 pl-2.5 pr-1 text-xs font-medium text-blue-700"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeAt(i);
              }}
              className="flex h-4 w-4 items-center justify-center rounded text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-700"
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
          className="h-7 min-w-[8ch] flex-1 bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

TagInput.displayName = 'TagInput';
