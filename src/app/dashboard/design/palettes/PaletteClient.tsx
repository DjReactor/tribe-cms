'use client'

import { useState } from 'react'
import { ColorPalette, ColorPaletteColors, COLOR_SLOTS, SWATCH_DISPLAY_ORDER, ColorSlotKey, DEFAULT_PALETTE_COLORS } from '@/types/color-palette'
import { activatePalette, createPalette, updatePalette, deletePalette } from './actions'

export function PaletteClient({ palettes: initialPalettes, activePaletteId: initialActiveId }: { palettes: ColorPalette[], activePaletteId: string }) {
  const [palettes, setPalettes] = useState(initialPalettes)
  const [activePaletteId, setActivePaletteId] = useState(initialActiveId)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editPalette, setEditPalette] = useState<Partial<ColorPalette> | null>(null)
  
  const handleActivate = async (id: string) => {
    setActivePaletteId(id)
    await activatePalette(id)
  }

  const handleDelete = async (id: string) => {
    if (id === activePaletteId) return alert('Cannot delete the active palette')
    if (confirm('Delete this palette?')) {
      await deletePalette(id)
      setPalettes(palettes.filter(p => p.id !== id))
    }
  }

  const openCreate = () => {
    setEditPalette({
      name: 'New Palette',
      colors: DEFAULT_PALETTE_COLORS
    })
    setIsEditing(true)
  }

  const openEdit = (palette: ColorPalette) => {
    setEditPalette(palette)
    setIsEditing(true)
  }

  const savePalette = async () => {
    if (!editPalette || !editPalette.name || !editPalette.colors) return
    
    if (editPalette.id) {
      await updatePalette(editPalette.id, editPalette.name, editPalette.colors)
      setPalettes(palettes.map(p => p.id === editPalette.id ? { ...p, ...editPalette } as ColorPalette : p))
    } else {
      const res = await createPalette(editPalette.name, editPalette.colors)
      if (res.success && res.id) {
        setPalettes([...palettes, { ...editPalette, id: res.id } as ColorPalette])
      }
    }
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Card */}
        <div 
          onClick={openCreate}
          className="border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center p-8 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition min-h-[250px]"
        >
          <span className="font-medium text-slate-600">+ Create New Palette</span>
        </div>

        {/* Palette Cards */}
        {palettes.map(p => {
          const isActive = p.id === activePaletteId
          
          return (
            <div key={p.id} className={`border rounded-xl overflow-hidden bg-white ${isActive ? 'ring-2 ring-blue-500' : 'hover:shadow-md transition-shadow'}`}>
              <div className="flex flex-col h-24">
                <div className="flex h-12">
                  {SWATCH_DISPLAY_ORDER.slice(0, 5).map(key => (
                    <div key={key} className="flex-1 group relative" style={{ backgroundColor: p.colors[key] }} title={`${COLOR_SLOTS[key].label}: ${p.colors[key]}`} />
                  ))}
                </div>
                <div className="flex h-12">
                  {SWATCH_DISPLAY_ORDER.slice(5, 10).map(key => (
                    <div key={key} className="flex-1 group relative" style={{ backgroundColor: p.colors[key] }} title={`${COLOR_SLOTS[key].label}: ${p.colors[key]}`} />
                  ))}
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-slate-600 px-2 py-1">Edit</button>
                  <button onClick={() => handleDelete(p.id)} disabled={isActive} className="text-slate-400 hover:text-red-600 disabled:opacity-50 px-2 py-1">Del</button>
                </div>
              </div>
              <div className="px-4 pb-4">
                {isActive ? (
                  <div className="w-full py-2 bg-blue-50 text-blue-700 text-center font-medium rounded-lg">✓ Active</div>
                ) : (
                  <button onClick={() => handleActivate(p.id)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition">Activate</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      {isEditing && editPalette && editPalette.colors && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-semibold">Edit Palette</h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 border-r">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Palette Name</label>
                  <input 
                    type="text" 
                    value={editPalette.name} 
                    onChange={e => setEditPalette({...editPalette, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                
                <div className="space-y-4">
                  {(Object.keys(COLOR_SLOTS) as ColorSlotKey[]).map(key => (
                    <div key={key} className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={editPalette.colors![key]} 
                        onChange={e => setEditPalette({
                          ...editPalette, 
                          colors: { ...editPalette.colors!, [key]: e.target.value }
                        })}
                        className="w-10 h-10 rounded cursor-pointer shrink-0"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{COLOR_SLOTS[key].label}</div>
                        <div className="text-xs text-slate-500">{COLOR_SLOTS[key].description}</div>
                      </div>
                      <input 
                        type="text" 
                        value={editPalette.colors![key]} 
                        onChange={e => {
                          const val = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                             setEditPalette({
                              ...editPalette, 
                              colors: { ...editPalette.colors!, [key]: val }
                            })
                          }
                        }}
                        className="w-24 border rounded px-2 py-1 text-sm uppercase"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center">
                <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg transition-colors" style={{ backgroundColor: editPalette.colors.bg, color: editPalette.colors.text }}>
                  <div className="p-6 transition-colors" style={{ backgroundColor: editPalette.colors.surface }}>
                    <h3 className="text-xl font-bold mb-2 transition-colors" style={{ color: editPalette.colors.heading }}>Preview Heading</h3>
                    <p className="mb-4 text-sm transition-colors" style={{ color: editPalette.colors.text }}>
                      This is what the body text looks like on a surface component.
                    </p>
                    <p className="mb-4 text-xs transition-colors" style={{ color: editPalette.colors.text_muted }}>
                      This is muted helper text.
                    </p>
                    <div className="h-px w-full my-4 transition-colors" style={{ backgroundColor: editPalette.colors.border }}></div>
                    <button className="px-4 py-2 rounded font-medium transition-colors" style={{ backgroundColor: editPalette.colors.brand, color: editPalette.colors.brand_text }}>
                      Primary Button
                    </button>
                    <button className="ml-2 px-4 py-2 rounded font-medium border transition-colors" style={{ borderColor: editPalette.colors.accent, color: editPalette.colors.accent }}>
                      Secondary
                    </button>
                  </div>
                  <div className="p-4 text-sm transition-colors" style={{ backgroundColor: editPalette.colors.surface_alt }}>
                    Alternate surface area (e.g. footer or dark section)
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button onClick={savePalette} className="px-6 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium">Save Palette</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
