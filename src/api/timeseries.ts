import { api } from './client'
import type { TimeSeriesData } from '../types'

export function fetchTimeSeries(region: string): Promise<TimeSeriesData> {
  return api.get<TimeSeriesData>(`/timeseries/${region}`)
}
