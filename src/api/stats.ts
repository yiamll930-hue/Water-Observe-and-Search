import { api } from './client'
import type { DashboardStats } from '../types'

export function fetchStats(region: string): Promise<DashboardStats> {
  return api.get<DashboardStats>('/stats', { params: { region } })
}
