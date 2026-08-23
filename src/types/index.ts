// 研究区
export type Region = 'poyang' | 'dongting' | 'guangxi'

export const REGION_LABELS: Record<Region, string> = {
  poyang: '鄱阳湖',
  dongting: '洞庭湖',
  guangxi: '广西',
}

// 任务状态
export type TaskStatus = 'pending' | 'running' | 'done' | 'fail'

// 传感器类型
export type SatelliteType = 'sentinel-2' | 'landsat-8'

// Dashboard 统计
export interface DashboardStats {
  totalWaterArea: number
  areaUnit: string
  monthlyChange: number
  activeAlerts: number
  dataCoverage: number
  lastUpdated: string
}

// 时序数据点
export interface TimeSeriesPoint {
  date: string
  waterArea: number
  precipitation?: number
}

// 时序数据集
export interface TimeSeriesData {
  region: Region
  label: string
  points: TimeSeriesPoint[]
}

// 异常事件
export type AnomalyType = 'flood' | 'drought'
export type Severity = 'low' | 'medium' | 'high'

export interface AnomalyEvent {
  id: string
  type: AnomalyType
  severity: Severity
  region: Region
  detectedTime: string
  affectedArea: number
  description: string
  center: [number, number]
}

// 水体分布 GeoJSON
export interface WaterMapData {
  type: 'FeatureCollection'
  features: GeoJSON.Feature[]
}

// 气象相关性
export interface MeteoCorrelation {
  region: Region
  lagDays: number
  correlation: number
  monthlyData: { month: string; precipitation: number; waterArea: number }[]
}

// 推理任务
export interface InferenceTask {
  taskId: string
  status: TaskStatus
  progress: number
  inputUrl?: string
  resultUrl?: string
  waterMaskUrl?: string
  stats?: { waterArea: number; waterPercent: number }
  error?: string
}

// 地图图层
export interface MapLayer {
  id: string
  name: string
  visible: boolean
  type: 'water-mask' | 'anomaly' | 'boundary'
}
