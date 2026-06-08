import fs from 'fs'
import path from 'path'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090')

async function seedPalettes() {
  const adminEmail = process.env.PB_ADMIN_EMAIL || 'admin@admin.com'
  const adminPassword = process.env.PB_ADMIN_PASSWORD || 'admin12345'
  
  try {
    await pb.admins.authWithPassword(adminEmail, adminPassword)
    console.log('Authenticated as admin.')
  } catch (err) {
    console.error('Failed to authenticate with PocketBase. Ensure it is running and admin credentials are correct.', err)
    process.exit(1)
  }

  const palettesPath = path.join(process.cwd(), 'src', 'data', 'default-palettes.json')
  let defaultPalettes = []
  
  try {
    const data = fs.readFileSync(palettesPath, 'utf-8')
    defaultPalettes = JSON.parse(data)
  } catch (err) {
    console.error('Failed to read default-palettes.json', err)
    process.exit(1)
  }

  let firstPaletteId = null

  for (const palette of defaultPalettes) {
    try {
      // Check if palette exists
      const existing = await pb.collection('color_palettes').getFirstListItem(`name="${palette.name}"`)
      console.log(`Palette "${palette.name}" already exists.`)
      if (!firstPaletteId) firstPaletteId = existing.id
    } catch (err) {
      // Doesn't exist, create
      try {
        const created = await pb.collection('color_palettes').create(palette)
        console.log(`Created palette: "${palette.name}"`)
        if (!firstPaletteId) firstPaletteId = created.id
      } catch (createErr) {
        console.error(`Failed to create palette: "${palette.name}"`, createErr)
      }
    }
  }

  try {
    const settingsList = await pb.collection('settings').getList(1, 1)
    if (settingsList.items.length > 0) {
      const settings = settingsList.items[0]
      if (!settings.active_palette_id && firstPaletteId) {
        await pb.collection('settings').update(settings.id, {
          active_palette_id: firstPaletteId
        })
        console.log('Set initial active_palette_id to the first default palette.')
      } else {
         console.log('active_palette_id is already set.')
      }
    }
  } catch (err) {
    console.error('Failed to update settings with active_palette_id', err)
  }

  console.log('Palettes seeding completed.')
}

seedPalettes()
