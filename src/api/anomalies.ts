import { api } from './client'
import type { AnomalyEvent, AnomalyType, Severity, Region } from '../types'

export function fetchAnomalies(params?: {
  type?: AnomalyType
  region?: Region
  severity?: Severity
}): Promise<AnomalyEvent[]> {
  return api.get<AnomalyEvent[]>('/anomalies', { params })
}
