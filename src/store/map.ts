import { create } from 'zustand'
import type { BaseMapType } from '../types'

interface MapState {
  baseMap: BaseMapType
  labelsVisible: boolean
  selectedPosition: [number, number] | null
  setBaseMap: (baseMap: BaseMapType) => void
  toggleLabels: () => void
  setSelectedPosition: (position: [number, number] | null) => void
}

// 地图全局状态 — 底图与研究区标注跨页面保持
export const useMapStore = create<MapState>((set) => ({
  baseMap: 'street',
  labelsVisible: true,
  selectedPosition: null,
  setBaseMap: (baseMap) => set({ baseMap }),
  toggleLabels: () => set((state) => ({ labelsVisible: !state.labelsVisible })),
  setSelectedPosition: (selectedPosition) => set({ selectedPosition }),
}))
