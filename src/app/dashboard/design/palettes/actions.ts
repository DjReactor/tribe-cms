'use server'

import { getPocketBaseClient } from '@/lib/pocketbase'
import type { ColorPaletteColors } from '@/types/color-palette'
import { revalidatePath } from 'next/cache'

export interface PaletteState {
  source: 'template' | 'cms'
  templateOverrides: Partial<ColorPaletteColors>
  cmsPalette: ColorPaletteColors | null
}

async function getSettingsRecord() {
  const pb = await getPocketBaseClient()
  const list = await pb.collection('settings').getList(1, 1)
  if (list.items.length === 0) throw new Error('Settings record not found')
  return { pb, record: list.items[0] }
}

export async function getPaletteState(): Promise<PaletteState> {
  try {
    const { record } = await getSettingsRecord()
    return {
      source: (record.palette_source as 'template' | 'cms') || 'template',
      templateOverrides: (record.template_palette_overrides ?? {}) as Partial<ColorPaletteColors>,
      cmsPalette: (record.cms_palette ?? null) as ColorPaletteColors | null,
    }
  } catch {
    return { source: 'template', templateOverrides: {}, cmsPalette: null }
  }
}

export async function setPaletteSource(
  source: 'template' | 'cms'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { pb, record } = await getSettingsRecord()
    await pb.collection('settings').update(record.id, { palette_source: source })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function saveTemplateOverrides(
  overrides: Partial<ColorPaletteColors>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { pb, record } = await getSettingsRecord()
    await pb.collection('settings').update(record.id, {
      template_palette_overrides: overrides,
      palette_source: 'template',
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function resetTemplateOverrides(): Promise<{ success: boolean; error?: string }> {
  try {
    const { pb, record } = await getSettingsRecord()
    await pb.collection('settings').update(record.id, {
      template_palette_overrides: {},
      palette_source: 'template',
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function saveCmsPalette(
  colors: ColorPaletteColors
): Promise<{ success: boolean; error?: string }> {
  try {
    const { pb, record } = await getSettingsRecord()
    await pb.collection('settings').update(record.id, { cms_palette: colors })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function activateCmsPalette(
  colors: ColorPaletteColors
): Promise<{ success: boolean; error?: string }> {
  try {
    const { pb, record } = await getSettingsRecord()
    await pb.collection('settings').update(record.id, {
      cms_palette: colors,
      palette_source: 'cms',
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
