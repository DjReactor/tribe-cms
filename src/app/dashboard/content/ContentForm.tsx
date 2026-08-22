'use client';

import { useState, useTransition, useCallback } from 'react';
import { updateCopyOverrides } from '../actions';
import { TokenInput, AVAILABLE_TOKENS } from '@/components/ui/TokenInput';
import type { TemplateCopyKey, BusinessInfo } from '@/types';

// ── Token resolver (client-side, mirrors resolveTemplateTokens) ──────────────

function resolveTokens(text: string, businessInfo: BusinessInfo): string {
  if (!text) return '';
  return text
    .replace(/\{\{business_name\}\}/g, businessInfo.business_name || '')
    .replace(/\{\{city\}\}/g, businessInfo.city || '')
    .replace(/\{\{phone\}\}/g, businessInfo.phone || '')
    .replace(/\{\{business_type\}\}/g, businessInfo.business_type || '');
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SiteContentFormProps {
  supportedCopyKeys: Record<string, TemplateCopyKey>;
  initialOverrides: Record<string, string>;
  businessInfo: BusinessInfo;
}

// ── Page tabs ─────────────────────────────────────────────────────────────────

function getPages(keys: Record<string, TemplateCopyKey>): string[] {
  const seen = new Set<string>();
  const pages: string[] = [];
  for (const def of Object.values(keys)) {
    const page = def.page || 'General';
    if (!seen.has(page)) { seen.add(page); pages.push(page); }
  }
  return pages;
}

// ── Save status indicator ─────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Main form component ───────────────────────────────────────────────────────

export default function SiteContentForm({
  supportedCopyKeys,
  initialOverrides,
  businessInfo,
}: SiteContentFormProps) {

  const [values, setValues]       = useState<Record<string, string>>(initialOverrides);
  const [activeTab, setActiveTab] = useState<string>(() => getPages(supportedCopyKeys)[0] ?? 'General');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isPending, startTransition] = useTransition();

  const pages = getPages(supportedCopyKeys);

  const keysForPage = (page: string) =>
    Object.entries(supportedCopyKeys).filter(
      ([, def]) => (def.page || 'General') === page
    );

  const handleChange = useCallback((key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setSaveStatus('idle');
  }, []);

  const handleSave = () => {
    // Strip empty strings — blanks mean "use template default"
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v && v.trim() !== '')
    );

    setSaveStatus('saving');
    startTransition(async () => {
      const res = await updateCopyOverrides(cleaned);
      setSaveStatus(res.success ? 'saved' : 'error');
      if (res.success) {
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    });
  };

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (pages.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-10 text-center text-muted-foreground">
        <p className="font-medium">No editable text fields defined.</p>
        <p className="text-sm mt-1">
          The active template has no copy slots configured. Ask your template
          builder to add <code className="text-xs bg-card px-1 py-0.5 rounded border border-border">supportedCopyKeys</code> to the template manifest.
        </p>
      </div>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Tabs ── */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {pages.map(page => (
            <button
              key={page}
              id={`tab-${page.toLowerCase().replace(/\s+/g, '-')}`}
              role="tab"
              aria-selected={activeTab === page}
              onClick={() => setActiveTab(page)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === page
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
              }`}
            >
              {page}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Fields for active tab ── */}
      <div className="space-y-6">
        {keysForPage(activeTab).map(([key, def]) => {
          const currentValue   = values[key] ?? '';
          const previewValue   = resolveTokens(currentValue || def.default || '', businessInfo);

          return (
            <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

              {/* Left column — editable TokenInput */}
              <TokenInput
                id={`copy-${key}`}
                label={def.label}
                hint={def.hint}
                multiline={def.type === 'textarea'}
                value={currentValue}
                onChange={val => handleChange(key, val)}
                placeholder={def.default}
                tokens={AVAILABLE_TOKENS}
              />

              {/* Right column — live Preview */}
              <div className="flex flex-col gap-1 pt-5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Preview
                </span>
                <p
                  className={`text-sm text-foreground leading-relaxed min-h-[38px] ${
                    def.type === 'textarea' ? 'whitespace-pre-wrap' : ''
                  }`}
                >
                  {previewValue || (
                    <span className="text-muted-foreground italic">No default set</span>
                  )}
                </p>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Save button + status ── */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className={`text-sm font-medium transition-colors ${
          saveStatus === 'saved' ? 'text-success'
          : saveStatus === 'error' ? 'text-destructive'
          : 'text-transparent'
        }`}>
          {saveStatus === 'saved' && '✓ Changes saved'}
          {saveStatus === 'error' && 'Error saving — please try again'}
        </span>

        <button
          id="site-content-save"
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save Content'}
        </button>
      </div>

    </div>
  );
}
