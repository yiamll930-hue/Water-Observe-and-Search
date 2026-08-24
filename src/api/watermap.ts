import { api } from './client'
import type { WaterMapData } from '../types'

export function fetchWaterMap(params?: {
  from?: string
  to?: string
}): Promise<WaterMapData> {
  return api.get<WaterMapData>('/water-map', { params })
}
