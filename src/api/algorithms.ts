// 算法注册表接口 — /api/v1/algorithms
import { api } from './client'
import type { Algorithm, AlgorithmList } from '../types'

// 获取全部算法及实现状态
export async function fetchAlgorithms(): Promise<Algorithm[]> {
  const page = await api.get<AlgorithmList>('/algorithms')
  return page.items
}
