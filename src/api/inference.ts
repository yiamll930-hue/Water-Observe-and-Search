import { api } from './client'
import type { InferenceTask, SatelliteType } from '../types'

export function submitSingleInference(params: {
  image: File
  satellite: SatelliteType
  threshold: number
}): Promise<InferenceTask> {
  return api.post<InferenceTask>('/inference/single', { body: params })
}

export function submitBatchInference(params: {
  images: File[]
  satellite: SatelliteType
  threshold: number
}): Promise<InferenceTask> {
  return api.post<InferenceTask>('/inference/batch', { body: params })
}

export function fetchTaskResult(
  taskId: string
): Promise<InferenceTask> {
  return api.get<InferenceTask>(`/results/${taskId}`)
}
