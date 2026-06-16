'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

// ── Constants ────────────────────────────────────────────────────────────────

/** Available auto-fill tokens. Extend this array when new tokens are added. */
export const AVAILABLE_TOKENS = [
  { name: 'business_name', description: 'e.g. "Apex Plumbing LLC"' },
  { name: 'city',          description: 'e.g. "Dallas"' },
  { name: 'phone',         description: 'e.g. "(555) 123-4567"' },
  { name: 'business_type', description: 'e.g. "Electrician"' },
];

// ── Regex ────────────────────────────────────────────────────────────────────

/** Matches a complete token, e.g. {{city}} */
const COMPLETE_TOKEN_RE = /\{\{([^}]+)\}\}/g;

/** Matches an opening {{ with no closing }} (mid-token state) */
const INCOMPLETE_TOKEN_RE = /\{\{([^}]*)$/;

// ── Highlight renderer ───────────────────────────────────────────────────────

/**
 * Converts plain text into an array of React nodes with color coding:
 *   - Complete {{token}}  → brand-colored pill span
 *   - Opening {{...      → amber span (mid-token)
 *   - Regular text       → plain span
 */
function renderHighlightedText(text: string): React.ReactNode[] {
  if (!text) return [<span key="empty">&nbsp;</span>];

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  COMPLETE_TOKEN_RE.lastIndex = 0;

  while ((match = COMPLETE_TOKEN_RE.exec(text)) !== null) {
    // Text before this token
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      nodes.push(...splitIncomplete(before, `pre-${lastIndex}`));
    }
    // The complete token — brand-colored pill
    nodes.push(
      <span
        key={`token-${match.index}`}
        style={{
          background: 'var(--tribe-brand, #2563eb)',
          color: 'var(--tribe-brand-text, #ffffff)',
          borderRadius: '4px',
          padding: '0 4px',
          fontSize: 'inherit',
          lineHeight: 'inherit',
        }}
      >
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last complete token
  if (lastIndex < text.length) {
    nodes.push(...splitIncomplete(text.slice(lastIndex), `tail-${lastIndex}`));
  }

  // Ensure overlay is never empty (preserves height)
  if (nodes.length === 0) nodes.push(<span key="empty">&nbsp;</span>);

  return nodes;
}

/**
 * Splits a text segment on a trailing incomplete {{ and colours it amber.
 */
function splitIncomplete(text: string, keyPrefix: string): React.ReactNode[] {
  const incompleteMatch = INCOMPLETE_TOKEN_RE.exec(text);
  if (!incompleteMatch) {
    return [<span key={keyPrefix}>{text}</span>];
  }
  const before = text.slice(0, incompleteMatch.index);
  const incomplete = text.slice(incompleteMatch.index);
  return [
    before && <span key={`${keyPrefix}-pre`}>{before}</span>,
    <span
      key={`${keyPrefix}-inc`}
      style={{ color: '#d97706' /* amber-600 */ }}
    >
      {incomplete}
    </span>,
  ].filter(Boolean) as React.ReactNode[];
}

// ── Mirror styles ─────────────────────────────────────────────────────────────

/**
 * CSS properties shared between the textarea and its backdrop overlay.
 * Both must be identical so highlighted text aligns pixel-perfectly.
 */
const SHARED_STYLES: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: '1.5',
  padding: '8px 12px',
  margin: 0,
  border: '1px solid transparent',
  borderRadius: '6px',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  overflowWrap: 'break-word',
  boxSizing: 'border-box',
  width: '100%',
};

// ── TokenDropdown ─────────────────────────────────────────────────────────────

interface TokenDropdownProps {
  query: string;
  tokens: typeof AVAILABLE_TOKENS;
  onSelect: (name: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function TokenDropdown({ query, tokens, onSelect, onClose, anchorRef }: TokenDropdownProps) {
  const filtered = query
    ? tokens.filter(t => t.name.includes(query.toLowerCase()))
    : tokens;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anchorRef, onClose]);

  if (filtered.length === 0) return null;

  return (
    <ul
      role="listbox"
      aria-label="Available tokens"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 50,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '4px',
        minWidth: '220px',
        margin: '2px 0 0',
        listStyle: 'none',
      }}
    >
      {filtered.map(token => (
        <li
          key={token.name}
          role="option"
          aria-selected={false}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent textarea blur
            onSelect(token.name);
          }}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--tribe-brand, #2563eb)', fontWeight: 600 }}>
            {`{{${token.name}}}`}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>{token.description}</span>
        </li>
      ))}
    </ul>
  );
}

// ── TokenInput ─────────────────────────────────────────────────────────────────

export interface TokenInputProps {
  /** Token names available for autocomplete */
  tokens?: typeof AVAILABLE_TOKENS;
  label: string;
  hint?: string;
  /** true = textarea (multi-line), false/undefined = single-line */
  multiline?: boolean;
  value: string;
  onChange: (value: string) => void;
  /** Shown when field is empty — use the raw default string (may include {{tokens}}) */
  placeholder?: string;
  id?: string;
}

export function TokenInput({
  tokens = AVAILABLE_TOKENS,
  label,
  hint,
  multiline,
  value,
  onChange,
  placeholder,
  id,
}: TokenInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [tokenQuery, setTokenQuery]     = useState('');

  // ── Autocomplete detection ──────────────────────────────────────────────────

  const detectTrigger = useCallback((val: string, cursorPos: number) => {
    const textBeforeCursor = val.slice(0, cursorPos);
    const incompleteMatch = INCOMPLETE_TOKEN_RE.exec(textBeforeCursor);
    if (incompleteMatch) {
      setTokenQuery(incompleteMatch[1]); // text typed after {{
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setTokenQuery('');
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newVal = e.target.value;
    const cursor = e.target.selectionStart ?? newVal.length;
    onChange(newVal);
    detectTrigger(newVal, cursor);
  }, [onChange, detectTrigger]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showDropdown) {
      setShowDropdown(false);
      e.preventDefault();
    }
  }, [showDropdown]);

  // ── Token insertion ─────────────────────────────────────────────────────────

  const insertToken = useCallback((tokenName: string) => {
    const el = multiline ? textareaRef.current : inputRef.current;
    if (!el) return;

    const cursor = el.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursor);

    // Find where the opening {{ starts
    const incompleteMatch = INCOMPLETE_TOKEN_RE.exec(textBeforeCursor);
    const replaceFrom = incompleteMatch ? incompleteMatch.index : cursor;

    const newVal =
      value.slice(0, replaceFrom) +
      `{{${tokenName}}}` +
      value.slice(cursor);

    onChange(newVal);
    setShowDropdown(false);
    setTokenQuery('');

    // Restore focus and position cursor after inserted token
    requestAnimationFrame(() => {
      el.focus();
      const newCursor = replaceFrom + tokenName.length + 4; // 4 = {{ + }}
      el.setSelectionRange(newCursor, newCursor);
    });
  }, [value, onChange, multiline]);

  // ── Overlay scroll sync ─────────────────────────────────────────────────────

  const overlayRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {/* Label */}
      <label
        htmlFor={inputId}
        style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}
      >
        {label}
      </label>

      {/* Input wrapper — positions overlay + textarea + dropdown */}
      <div ref={wrapperRef} style={{ position: 'relative' }}>

        {/* ── Backdrop overlay (aria-hidden, shows colored tokens) ── */}
        <div
          ref={overlayRef}
          aria-hidden="true"
          style={{
            ...SHARED_STYLES,
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            color: '#1e293b',
            border: '1px solid transparent',
            // Must sit behind the textarea but be visible through it
            zIndex: 0,
          }}
        >
          {renderHighlightedText(value || '')}
        </div>

        {/* ── Actual editable element ── */}
        {multiline ? (
          <textarea
            ref={textareaRef}
            id={inputId}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            placeholder={placeholder}
            rows={3}
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls={showDropdown ? `${inputId}-dropdown` : undefined}
            style={{
              ...SHARED_STYLES,
              position: 'relative',
              zIndex: 1,
              color: 'transparent',
              caretColor: '#1e293b',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              outline: 'none',
              resize: 'vertical',
              display: 'block',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--tribe-brand, #2563eb)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
          />
        ) : (
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls={showDropdown ? `${inputId}-dropdown` : undefined}
            style={{
              ...SHARED_STYLES,
              position: 'relative',
              zIndex: 1,
              color: 'transparent',
              caretColor: '#1e293b',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              outline: 'none',
              display: 'block',
              height: '38px',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--tribe-brand, #2563eb)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
          />
        )}

        {/* ── Autocomplete dropdown ── */}
        {showDropdown && (
          <TokenDropdown
            query={tokenQuery}
            tokens={tokens}
            onSelect={insertToken}
            onClose={() => setShowDropdown(false)}
            anchorRef={wrapperRef}
          />
        )}
      </div>

      {/* Hint text */}
      {hint && (
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{hint}</p>
      )}
    </div>
  );
}
