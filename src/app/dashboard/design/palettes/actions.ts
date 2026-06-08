'use server'

import { getPocketBaseClient } from '@/lib/pocketbase'
import { ColorPalette, ColorPaletteColors } from '@/types/color-palette'
import { revalidatePath } from 'next/cache'

export async function getPalettes(): Promise<ColorPalette[]> {
  try {
    const pb = await getPocketBaseClient()
    const records = await pb.collection('color_palettes').getFullList({
      sort: 'sort_order,created'
    })
    return records as unknown as ColorPalette[]
  } catch (err) {
    console.error('Error fetching palettes', err)
    return []
  }
}

export async function getActivePaletteId(): Promise<string | null> {
  try {
    const pb = await getPocketBaseClient()
    const settingsList = await pb.collection('settings').getList(1, 1)
    if (settingsList.items.length > 0) {
      return settingsList.items[0].active_palette_id || null
    }
  } catch (err) {
    console.error('Error fetching active palette id', err)
  }
  return null
}

export async function activatePalette(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getPocketBaseClient()
    const settingsList = await pb.collection('settings').getList(1, 1)
    if (settingsList.items.length > 0) {
      const settings = settingsList.items[0]
      await pb.collection('settings').update(settings.id, {
        active_palette_id: id
      })
      revalidatePath('/', 'layout')
      return { success: true }
    }
    return { success: false, error: 'Settings not found' }
  } catch (err: any) {
    console.error('Error activating palette', err)
    return { success: false, error: err.message }
  }
}

export async function createPalette(name: string, colors: ColorPaletteColors): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const pb = await getPocketBaseClient()
    const record = await pb.collection('color_palettes').create({
      name,
      colors,
      sort_order: 10
    })
    return { success: true, id: record.id }
  } catch (err: any) {
    console.error('Error creating palette', err)
    return { success: false, error: err.message }
  }
}

export async function updatePalette(id: string, name: string, colors: ColorPaletteColors): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getPocketBaseClient()
    await pb.collection('color_palettes').update(id, {
      name,
      colors
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('Error updating palette', err)
    return { success: false, error: err.message }
  }
}

export async function deletePalette(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const activeId = await getActivePaletteId()
    if (activeId === id) {
      return { success: false, error: 'Cannot delete the active palette' }
    }
    const pb = await getPocketBaseClient()
    await pb.collection('color_palettes').delete(id)
    return { success: true }
  } catch (err: any) {
    console.error('Error deleting palette', err)
    return { success: false, error: err.message }
  }
}
