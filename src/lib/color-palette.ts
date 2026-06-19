import { ColorPaletteColors, COLOR_SLOTS, DEFAULT_PALETTE_COLORS } from '@/types/color-palette'
import { getPocketBaseClient } from './pocketbase'

export function generatePaletteCss(colors: ColorPaletteColors): string {
  const vars = Object.entries(COLOR_SLOTS)
    .map(([key, meta]) => `  ${meta.cssVar}: ${colors[key as keyof ColorPaletteColors]};`)
    .join('\n')
  return `:root {\n${vars}\n}`
}

/**
 * Priority:
 *   palette_source === 'cms'      → settings.cms_palette
 *   palette_source === 'template' → templateDefaultPalette + settings.template_palette_overrides
 *   Fallback (no PocketBase)      → templateDefaultPalette (or global DEFAULT_PALETTE_COLORS)
 */
export async function getActivePalette(
  templateDefaultPalette?: ColorPaletteColors
): Promise<{ colors: ColorPaletteColors }> {
  const base = templateDefaultPalette ?? DEFAULT_PALETTE_COLORS

  try {
    const pb = await getPocketBaseClient()
    const settingsList = await pb.collection('settings').getList(1, 1)
    if (settingsList.items.length > 0) {
      const settings = settingsList.items[0]

      if (settings.palette_source === 'cms' && settings.cms_palette) {
        return { colors: settings.cms_palette as ColorPaletteColors }
      }

      const overrides = (settings.template_palette_overrides ?? {}) as Partial<ColorPaletteColors>
      return { colors: { ...base, ...overrides } }
    }
  } catch {
    // PocketBase unavailable — use template default
  }

  return { colors: base }
}
