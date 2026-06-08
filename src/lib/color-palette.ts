import { ColorPaletteColors, COLOR_SLOTS, DEFAULT_PALETTE_COLORS } from '@/types/color-palette'
import { getPocketBaseClient } from './pocketbase'

export function generatePaletteCss(colors: ColorPaletteColors): string {
  const vars = Object.entries(COLOR_SLOTS)
    .map(([key, meta]) => `  ${meta.cssVar}: ${colors[key as keyof ColorPaletteColors]};`)
    .join('\n')
  return `:root {\n${vars}\n}`
}

export async function getActivePalette(): Promise<{ colors: ColorPaletteColors }> {
  try {
    const pb = await getPocketBaseClient();
    const settingsList = await pb.collection('settings').getList(1, 1)
    if (settingsList.items.length > 0) {
      const settings = settingsList.items[0]
      if (settings.active_palette_id) {
        const palette = await pb.collection('color_palettes').getOne(settings.active_palette_id)
        if (palette && palette.colors) {
          // Assuming structure is correct, type casting for simplicity
          return { colors: palette.colors as unknown as ColorPaletteColors }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching active palette:', error)
  }
  
  return { colors: DEFAULT_PALETTE_COLORS }
}
