'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { CheckCircle2, Loader2, Layers } from 'lucide-react';
import { activateTemplate } from './actions';
import type { TemplateRegistryManifest } from '@/lib/template-registry';

interface DesignClientProps {
  templates: TemplateRegistryManifest[];
  activeTemplateId: string;
}

// ── Confirmation Modal ──────────────────────────────────────────────────────

function ConfirmModal({
  template,
  onConfirm,
  onCancel,
  isPending,
}: {
  template: TemplateRegistryManifest;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2
              id="confirm-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Activate Template
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              This will go live immediately
            </p>
          </div>
        </div>

        <p className="text-slate-700 text-sm leading-relaxed mb-8">
          You are about to switch your website to{' '}
          <span className="font-semibold text-slate-900">{template.name}</span>.
          Your content, services, and SEO settings are preserved — only the
          visual design changes.
        </p>

        <div className="flex gap-3">
          <button
            id="confirm-activate-cancel"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-activate-confirm"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Activating…
              </>
            ) : (
              'Yes, Activate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  isActive,
  onActivate,
}: {
  template: TemplateRegistryManifest;
  isActive: boolean;
  onActivate: (t: TemplateRegistryManifest) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`group relative bg-white rounded-2xl border-2 overflow-hidden transition-all duration-200 flex flex-col ${
        isActive
          ? 'border-blue-500 shadow-lg shadow-blue-500/10'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Active badge */}
      {isActive && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Active
        </div>
      )}

      {/* Preview Image */}
      <div className="relative w-full aspect-[3/2] bg-slate-100 overflow-hidden">
        {!imgError ? (
          <Image
            src={template.preview_image}
            alt={`${template.name} preview`}
            fill
            className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
            <Layers className="w-10 h-10" />
            <span className="text-xs font-medium">No preview</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-base">{template.name}</h3>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            {template.description}
          </p>

          {/* Tags */}
          {template.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        {isActive ? (
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <CheckCircle2 className="w-4 h-4" />
            Currently active
          </div>
        ) : (
          <button
            id={`activate-${template.id}`}
            onClick={() => onActivate(template)}
            className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            Activate
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Client Component ────────────────────────────────────────────────────

export function DesignClient({ templates, activeTemplateId }: DesignClientProps) {
  const [pending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] = useState<TemplateRegistryManifest | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentActive, setCurrentActive] = useState(activeTemplateId);

  function handleActivate(template: TemplateRegistryManifest) {
    if (template.id === currentActive) return;
    setConfirmTarget(template);
  }

  function handleConfirm() {
    if (!confirmTarget) return;
    const target = confirmTarget;

    startTransition(async () => {
      const result = await activateTemplate(target.id);
      setConfirmTarget(null);

      if (result.success) {
        setCurrentActive(target.id);
        setToast({ type: 'success', message: `"${target.name}" is now your active template.` });
      } else {
        setToast({ type: 'error', message: result.error || 'Something went wrong.' });
      }

      // Auto-dismiss toast
      setTimeout(() => setToast(null), 4000);
    });
  }

  return (
    <>
      {/* Template Grid */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
          <Layers className="w-12 h-12 mb-4 opacity-40" />
          <p className="font-medium">No templates found.</p>
          <p className="text-sm mt-1">Add a template to <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">src/templates/</code> to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={template.id === currentActive}
              onActivate={handleActivate}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmTarget && (
        <ConfirmModal
          template={confirmTarget}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
          isPending={pending}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
          role="alert"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <span className="shrink-0">⚠</span>
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}
