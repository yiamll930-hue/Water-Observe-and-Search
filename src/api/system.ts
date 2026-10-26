// 系统状态接口 — /health（不在 /api/v1 下，且不鉴权）
import { api } from './client'
import type { Health } from '../types'

// 获取服务健康状态
export function fetchHealth(): Promise<Health> {
  return api.rootGet<Health>('/health')
}
