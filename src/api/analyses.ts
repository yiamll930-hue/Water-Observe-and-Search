// 多时相分析资源接口 — /api/v1/analyses
import { api } from './client'
import type { Analysis, AnalysisInput, AnalysisPage } from '../types'

export interface AnalysisQuery {
  limit?: number
  offset?: number
}

// 创建并同步执行多时相分析 — 201 Created
export function createAnalysis(input: AnalysisInput): Promise<Analysis> {
  return api.post<Analysis>('/analyses', { body: input })
}

// 分页获取分析记录 — 最新创建在前
export function fetchAnalyses(params: AnalysisQuery = {}): Promise<AnalysisPage> {
  return api.get<AnalysisPage>('/analyses', {
    params: { limit: params.limit ?? 20, offset: params.offset ?? 0 },
  })
}

// 按 UUID 查询单条分析记录
export function fetchAnalysis(id: string): Promise<Analysis> {
  return api.get<Analysis>(`/analyses/${id}`)
}
