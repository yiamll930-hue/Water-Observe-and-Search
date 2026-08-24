import { create } from 'zustand'
import type { MapLayer } from '../types'

interface MapState {
  layers: MapLayer[]
  selectedPosition: [number, number] | null
  baseMap: 'osm' | 'satellite'
  toggleLayer: (id: string) => void
  setBaseMap: (map: 'osm' | 'satellite') => void
  setSelectedPosition: (pos: [number, number] | null) => void
}

const DEFAULT_LAYERS: MapLayer[] = [
  { id: 'water-mask', name: '水体掩膜', visible: true, type: 'water-mask' },
  { id: 'anomaly', name: '异常区域', visible: true, type: 'anomaly' },
  { id: 'boundary', name: '研究区边界', visible: false, type: 'boundary' },
]

export const useMapStore = create<MapState>((set) => ({
  layers: DEFAULT_LAYERS,
  selectedPosition: null,
  baseMap: 'osm',
  toggleLayer: (id) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    })),
  setBaseMap: (baseMap) => set({ baseMap }),
  setSelectedPosition: (pos) => set({ selectedPosition: pos }),
}))
