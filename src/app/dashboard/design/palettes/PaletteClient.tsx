'use client'

import { useState } from 'react'
import {
  ColorPaletteColors,
  COLOR_SLOTS,
  ColorSlotKey,
  SWATCH_DISPLAY_ORDER,
} from '@/types/color-palette'
import type { PaletteState } from './actions'
import {
  setPaletteSource,
  saveTemplateOverrides,
  resetTemplateOverrides,
  saveCmsPalette,
  activateCmsPalette,
} from './actions'

interface PaletteClientProps {
  templateName: string
  templateDefaultPalette: ColorPaletteColors
  initialState: PaletteState
}

// Reusable live-preview card — driven entirely by inline styles so it reacts in real time.
function PreviewCard({ colors }: { colors: ColorPaletteColors }) {
  return (
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg transition-colors"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <div className="p-6 transition-colors" style={{ backgroundColor: colors.surface }}>
        <h3 className="text-xl font-bold mb-2 transition-colors" style={{ color: colors.heading }}>
          Preview Heading
        </h3>
        <p className="mb-3 text-sm transition-colors" style={{ color: colors.text }}>
          This is what the body text looks like on a surface component.
        </p>
        <p className="mb-4 text-xs transition-colors" style={{ color: colors.text_muted }}>
          This is muted helper text.
        </p>
        <div className="h-px w-full my-4 transition-colors" style={{ backgroundColor: colors.border }} />
        <button
          className="px-4 py-2 rounded font-medium transition-colors"
          style={{ backgroundColor: colors.brand, color: colors.brand_text }}
        >
          Primary Button
        </button>
        <button
          className="ml-2 px-4 py-2 rounded font-medium border transition-colors"
          style={{ borderColor: colors.accent, color: colors.accent }}
        >
          Secondary
        </button>
      </div>
      <div
        className="p-4 text-sm transition-colors"
        style={{ backgroundColor: colors.surface_alt, color: colors.text_on_alt }}
      >
        Alternate surface area (e.g. footer or dark section)
      </div>
    </div>
  )
}

export function PaletteClient({ templateName, templateDefaultPalette, initialState }: PaletteClientProps) {
  const [activeTab, setActiveTab] = useState<'template' | 'cms'>('template')
  const [source, setSource] = useState<'template' | 'cms'>(initialState.source)
  const [templateOverrides, setTemplateOverrides] = useState<Partial<ColorPaletteColors>>(
    initialState.templateOverrides
  )
  // Fall back to the template palette so the CMS editor is never empty.
  const [cmsPaletteColors, setCmsPaletteColors] = useState<ColorPaletteColors>(
    initialState.cmsPalette ?? templateDefaultPalette
  )
  const [isSaving, setIsSaving] = useState(false)

  const effectiveTemplatePalette: ColorPaletteColors = { ...templateDefaultPalette, ...templateOverrides }

  // ── Template tab handlers ──────────────────────────────────────────────────
  const handleTemplateColorChange = (key: ColorSlotKey, value: string) => {
    setTemplateOverrides(prev => ({ ...prev, [key]: value }))
  }

  const handleResetSlot = async (key: ColorSlotKey) => {
    const next = { ...templateOverrides }
    delete next[key]
    setTemplateOverrides(next)
    setIsSaving(true)
    await saveTemplateOverrides(next)
    setSource('template')
    setIsSaving(false)
  }

  const handleSaveTemplateOverrides = async () => {
    setIsSaving(true)
    await saveTemplateOverrides(templateOverrides)
    setSource('template')
    setIsSaving(false)
  }

  const handleResetAllOverrides = async () => {
    setIsSaving(true)
    await resetTemplateOverrides()
    setTemplateOverrides({})
    setSource('template')
    setIsSaving(false)
  }

  const handleUseTemplatePalette = async () => {
    setIsSaving(true)
    await setPaletteSource('template')
    setSource('template')
    setIsSaving(false)
  }

  // ── Custom (CMS) tab handlers ──────────────────────────────────────────────
  const handleCmsColorChange = (key: ColorSlotKey, value: string) => {
    setCmsPaletteColors(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveCms = async () => {
    setIsSaving(true)
    await saveCmsPalette(cmsPaletteColors)
    setIsSaving(false)
  }

  const handleActivateCms = async () => {
    setIsSaving(true)
    await activateCmsPalette(cmsPaletteColors)
    setSource('cms')
    setIsSaving(false)
  }

  const handleBackToTemplate = async () => {
    setIsSaving(true)
    await setPaletteSource('template')
    setSource('template')
    setIsSaving(false)
  }

  const tabClass = (tab: 'template' | 'cms') =>
    `px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
      activeTab === tab
        ? 'border-slate-900 text-slate-900'
        : 'border-transparent text-slate-500 hover:text-slate-700'
    }`

  return (
    <div>
      {/* Tab bar — the green dot marks the currently-active source, not the open tab */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <button onClick={() => setActiveTab('template')} className={tabClass('template')}>
          {source === 'template' && <span className="text-green-500 mr-1.5">●</span>}
          Template Palette
        </button>
        <button onClick={() => setActiveTab('cms')} className={tabClass('cms')}>
          {source === 'cms' && <span className="text-green-500 mr-1.5">●</span>}
          Custom Palette
        </button>
      </div>

      {/* ── Tab 1: Template Palette ─────────────────────────────────────────── */}
      {activeTab === 'template' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{templateName} — Default Colors</h3>
            {source === 'template' && (
              <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Active
              </span>
            )}
          </div>

          {source === 'cms' && (
            <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">Custom Palette is currently active.</p>
              <button
                onClick={handleUseTemplatePalette}
                disabled={isSaving}
                className="shrink-0 px-3 py-1.5 text-sm font-medium bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 disabled:opacity-50"
              >
                Use Template Palette
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor */}
            <div>
              <div className="space-y-3">
                {SWATCH_DISPLAY_ORDER.map(key => {
                  const isOverridden = templateOverrides[key] !== undefined
                  const value = templateOverrides[key] ?? templateDefaultPalette[key]
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={value}
                        onChange={e => handleTemplateColorChange(key, e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900 text-sm">{COLOR_SLOTS[key].label}</span>
                          {isOverridden && (
                            <>
                              <span className="text-amber-500" title="Overridden">●</span>
                              <button
                                onClick={() => handleResetSlot(key)}
                                disabled={isSaving}
                                className="text-xs text-slate-400 hover:text-slate-700 underline disabled:opacity-50"
                              >
                                Reset
                              </button>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{COLOR_SLOTS[key].description}</div>
                      </div>
                      <input
                        type="text"
                        value={value}
                        onChange={e => {
                          const v = e.target.value
                          if (/^#[0-9A-Fa-f]{0,8}$/.test(v)) handleTemplateColorChange(key, v)
                        }}
                        className="w-24 border rounded px-2 py-1 text-sm uppercase shrink-0"
                      />
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveTemplateOverrides}
                  disabled={isSaving}
                  className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={handleResetAllOverrides}
                  disabled={isSaving || Object.keys(templateOverrides).length === 0}
                  className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium disabled:opacity-50"
                >
                  Reset All Overrides
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-start justify-center self-start lg:sticky lg:top-6">
              <PreviewCard colors={effectiveTemplatePalette} />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Custom Palette ───────────────────────────────────────────── */}
      {activeTab === 'cms' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Custom Palette</h3>
            {source === 'cms' && (
              <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Active
              </span>
            )}
          </div>

          {source === 'template' ? (
            <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600">Template palette is currently active.</p>
              <button
                onClick={handleActivateCms}
                disabled={isSaving}
                className="shrink-0 px-3 py-1.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                Activate Custom Palette
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <button
                onClick={handleBackToTemplate}
                disabled={isSaving}
                className="text-sm text-slate-500 hover:text-slate-800 disabled:opacity-50"
              >
                ← Back to template palette
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor */}
            <div>
              <div className="space-y-3">
                {SWATCH_DISPLAY_ORDER.map(key => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={cmsPaletteColors[key]}
                      onChange={e => handleCmsColorChange(key, e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm">{COLOR_SLOTS[key].label}</div>
                      <div className="text-xs text-slate-500 truncate">{COLOR_SLOTS[key].description}</div>
                    </div>
                    <input
                      type="text"
                      value={cmsPaletteColors[key]}
                      onChange={e => {
                        const v = e.target.value
                        if (/^#[0-9A-Fa-f]{0,8}$/.test(v)) handleCmsColorChange(key, v)
                      }}
                      className="w-24 border rounded px-2 py-1 text-sm uppercase shrink-0"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveCms}
                  disabled={isSaving}
                  className="px-5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={handleActivateCms}
                  disabled={isSaving}
                  className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium disabled:opacity-50"
                >
                  Save &amp; Activate
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-start justify-center self-start lg:sticky lg:top-6">
              <PreviewCard colors={cmsPaletteColors} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
