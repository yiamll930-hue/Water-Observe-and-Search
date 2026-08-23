import type {
  DashboardStats,
  TimeSeriesData,
  AnomalyEvent,
  WaterMapData,
  MeteoCorrelation,
  InferenceTask,
} from '../types'

// 空数据模板 — 无真实数据时不臆造，全部返回空值或空列表

export const emptyStats: DashboardStats = {
  totalWaterArea: 0,
  areaUnit: 'km²',
  monthlyChange: 0,
  activeAlerts: 0,
  dataCoverage: 0,
  lastUpdated: '—',
}

export const emptyTimeSeries = (region: string, label: string): TimeSeriesData => ({
  region: region as never,
  label,
  points: [],
})

export const emptyAnomalies: AnomalyEvent[] = []

export const emptyWaterMap: WaterMapData = {
  type: 'FeatureCollection',
  features: [],
}

export const emptyMeteo = (region: string): MeteoCorrelation => ({
  region: region as never,
  lagDays: 0,
  correlation: 0,
  monthlyData: [],
})

export function createEmptyTask(taskId: string): InferenceTask {
  return {
    taskId,
    status: 'pending',
    progress: 0,
  }
}
