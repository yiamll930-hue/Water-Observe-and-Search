import {
  emptyStats,
  emptyTimeSeries,
  emptyAnomalies,
  emptyMeteo,
  createEmptyTask,
} from './data'
import { poyangStats, poyangTimeSeries, poyangWaterMap } from './poyangSample'

// Mock 处理器 — 返回空数据/占位数据，不臆造任何数值
export async function mockHandler<T>(
  method: string,
  path: string,
  opts: { params?: Record<string, string | number | undefined>; body?: unknown }
): Promise<T> {
  // 模拟网络延迟
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 200))

  const p = opts.params ?? {}

  // GET /api/v1/stats
  if (method === 'GET' && path === '/stats') {
    return (p.region === 'poyang' ? poyangStats : emptyStats) as T
  }

  // GET /api/v1/timeseries/:region
  const tsMatch = path.match(/^\/timeseries\/(.+)$/)
  if (method === 'GET' && tsMatch) {
    const region = tsMatch[1]
    if (region === 'poyang') return poyangTimeSeries as T
    const labels: Record<string, string> = { poyang: '鄱阳湖', dongting: '洞庭湖', guangxi: '广西' }
    return emptyTimeSeries(region, labels[region] ?? region) as T
  }

  // GET /api/v1/anomalies
  if (method === 'GET' && path === '/anomalies') {
    return emptyAnomalies as T
  }

  // GET /api/v1/water-map
  if (method === 'GET' && path === '/water-map') {
    return poyangWaterMap as T
  }

  // GET /api/v1/meteo/correlation
  if (method === 'GET' && path === '/meteo/correlation') {
    const region = (p.region as string) ?? 'poyang'
    return emptyMeteo(region) as T
  }

  // POST /api/v1/inference/single
  if (method === 'POST' && path === '/inference/single') {
    const taskId = `TASK-${Date.now()}`
    const task = createEmptyTask(taskId)
    // 模拟推理流程（不返回伪造结果数据）
    setTimeout(() => {
      task.status = 'done'
      task.progress = 100
    }, 2000)
    return task as T
  }

  // POST /api/v1/inference/batch
  if (method === 'POST' && path === '/inference/batch') {
    const taskId = `BATCH-${Date.now()}`
    return createEmptyTask(taskId) as T
  }

  // GET /api/v1/results/:task_id
  const resMatch = path.match(/^\/results\/(.+)$/)
  if (method === 'GET' && resMatch) {
    const taskId = resMatch[1]
    const progress = Math.min(100, Math.floor(Math.random() * 30) + 60)
    return {
      taskId,
      status: progress >= 100 ? ('done' as const) : ('running' as const),
      progress,
    } as T
  }

  throw new Error(`Mock: unknown endpoint ${method} ${path}`)
}
