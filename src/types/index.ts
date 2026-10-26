// 全局类型定义 — 与支撑材料中的多时序算法服务 v1 契约保持一致

// ───────────────────────────── 研究区（前端配置，非后端资源）─────────────────────────────

export type Region = 'poyang' | 'dongting' | 'guangxi'
export type SatelliteType = 'sentinel-2' | 'landsat-8' | 'landsat-9'
export type RegionRole = 'lake' | 'lake-group' | 'regional-pilot'

// 研究区元数据 — 仅用于地理参照与项目介绍
export interface RegionInfo {
  id: Region
  name: string
  shortName: string
  province: string
  role: RegionRole
  center: [number, number] // 纬度、经度
  bbox: [number, number, number, number] // 西、南、东、北
  zoom: number // 地图默认缩放级别
  sensors: SatelliteType[]
  description: string
}

// 地图标注 — 真实地名，仅用于定位
export interface MapLabel {
  id: string
  name: string
  kind: 'region' | 'city' | 'lake' | 'station'
  position: [number, number]
}

// 地图底图类型
export type BaseMapType = 'street' | 'satellite'

// ───────────────────────────── 多时序算法服务 v1 ─────────────────────────────

// 算法注册项 — GET /api/v1/algorithms
export interface Algorithm {
  id: string
  description: string
  implementation: string // mock / unavailable / 其他后端自定义实现标识
}

export interface AlgorithmList {
  items: Algorithm[]
}

// 时相输入 — POST /api/v1/analyses
export interface SceneInput {
  timestamp: string // 带时区的 ISO 8601
  uri: string // https / s3 / gs 资源地址
  format: 'geotiff'
}

// 前端表单中的时相草稿 — timestamp 为 datetime-local 本地值
export interface SceneDraft {
  id: string // 行标识，不提交后端
  timestamp: string
  uri: string
}

export interface AnalysisParameters {
  threshold: number // 0–1，默认 0.5
}

export interface AnalysisInput {
  algorithm_id: string
  scenes: SceneInput[] // 2–100 个，按时间严格递增
  parameters: AnalysisParameters
}

// 算法结果 — 当前 v1 只返回模拟结果，科学量为 null
export interface AnalysisResult {
  is_mock?: boolean
  message?: string
  scene_count?: number
  timestamps?: string[]
  water_area_km2?: number | null
  expansion_km2?: number | null
  shrinkage_km2?: number | null
  artifacts?: unknown[]
  [key: string]: unknown
}

// 分析记录 — POST /api/v1/analyses 与 GET /api/v1/analyses/{id}
export interface Analysis {
  id: string
  status: 'succeeded'
  algorithm_id: string
  created_at: string
  input: AnalysisInput
  result: AnalysisResult
}

// 分页记录 — GET /api/v1/analyses?limit=&offset=
export interface AnalysisPage {
  items: Analysis[]
  limit: number
  offset: number
}

// 健康检查 — GET /health
export interface Health {
  status: string
}

// 422 校验错误明细 — 后端 details[].field 为 Pydantic loc 数组
export interface ValidationDetail {
  field: string | number | Array<string | number>
  message: string
}

// 统一错误响应 — { error: { code, message, details? } }
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: ValidationDetail[]
  }
}
