export const COLOR_SLOTS = {
  brand:       { label: 'Brand / Accent',    cssVar: '--sf-brand',       description: 'CTAs, active links, buttons, badges' },
  brand_text:  { label: 'Brand Text',        cssVar: '--sf-brand-text',  description: 'Text/icons on brand-colored surfaces' },
  accent:      { label: 'Secondary Accent',  cssVar: '--sf-accent',      description: 'Hover states, focus rings, secondary highlights' },
  bg:          { label: 'Page Background',   cssVar: '--sf-bg',          description: 'Outermost site background canvas' },
  surface:     { label: 'Surface',           cssVar: '--sf-surface',     description: 'Cards, panels, form backgrounds' },
  surface_alt: { label: 'Alternate Surface', cssVar: '--sf-surface-alt', description: 'Dark/alt sections, split panels, banners' },
  text:        { label: 'Body Text',         cssVar: '--sf-text',        description: 'Primary readable body text' },
  text_muted:  { label: 'Muted Text',        cssVar: '--sf-text-muted',  description: 'Captions, subtitles, helper text' },
  border:      { label: 'Border',            cssVar: '--sf-border',      description: 'Lines, dividers, input borders' },
  heading:     { label: 'Heading Text',      cssVar: '--sf-heading',     description: 'H1–H4 heading color' },
} as const

export type ColorSlotKey = keyof typeof COLOR_SLOTS
// 'brand' | 'brand_text' | 'accent' | 'bg' | 'surface' | 'surface_alt' | 'text' | 'text_muted' | 'border' | 'heading'

export type ColorPaletteColors = Record<ColorSlotKey, string>

export interface ColorPalette {
  id: string
  name: string
  colors: ColorPaletteColors
  sort_order: number
  created: string
  updated: string
}

// Ordered swatch display groups for the UI palette card
// Visual logic: backgrounds → text/utility → brand accents
export const SWATCH_DISPLAY_ORDER: ColorSlotKey[] = [
  'bg', 'surface', 'surface_alt', 'border',
  'text', 'text_muted', 'heading',
  'brand', 'accent', 'brand_text',
]

export const DEFAULT_PALETTE_COLORS: ColorPaletteColors = {
  brand: '#B9FF24',
  brand_text: '#0D1F05',
  accent: '#7CC504',
  bg: '#0D1F05',
  surface: '#162B0B',
  surface_alt: '#1E3810',
  text: '#E5F5D5',
  text_muted: '#7A9E6A',
  border: '#284B16',
  heading: '#FFFFFF',
}
