// Mock 处理器 — 按支撑材料中的 FastAPI v1 契约模拟：
// 算法列表、同步多时相分析、分析记录查询与健康检查；结果标记 is_mock，面积为 null

import type { ApiError, QueryValue, RequestOptions } from '../api/client'
import type {
  Algorithm,
  Analysis,
  AnalysisInput,
  AnalysisPage,
  AnalysisResult,
  SceneInput,
  ValidationDetail,
} from '../types'

const ALGORITHMS: Algorithm[] = [
  { id: 'mock_change', description: '多时相水体变化模拟算法', implementation: 'mock' },
  { id: 'camfnet_change', description: 'CAMFNet 多时相水体分析（待接入）', implementation: 'unavailable' },
]

const RECORDS: Analysis[] = [] // 会话内保存创建的分析记录，刷新页面后清空

// 构造带状态码、错误码与字段明细的 Mock 错误
function mockError(
  status: number,
  message: string,
  code = String(status),
  details?: ValidationDetail[]
): ApiError {
  const error = new Error(message) as ApiError
  error.name = 'ApiError'
  error.status = status
  error.code = code
  error.details = details
  return error
}

// 读取查询参数中的数值
function numericParam(params: RequestOptions['params'], key: string, fallback: number): number {
  const value: QueryValue | undefined = params?.[key]
  if (value === undefined || value === null || value === '') return fallback
  return Number(value)
}

// 校验资源地址：https / s3 / gs，不含账号密码
function validateUri(uri: string): string | null {
  try {
    const parsed = new URL(uri)
    if (!['https:', 's3:', 'gs:'].includes(parsed.protocol)) {
      return '影像地址必须是完整的 https、s3 或 gs 资源地址'
    }
    if (!parsed.hostname || parsed.pathname.replaceAll('/', '') === '') {
      return '影像地址必须是完整的 https、s3 或 gs 资源地址'
    }
    if (parsed.username || parsed.password) return '地址不能包含用户名或密码'
    return null
  } catch {
    return '影像地址必须是完整的 https、s3 或 gs 资源地址'
  }
}

// 校验时区标记：Z 或 ±HH:MM
function hasTimezone(value: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
}

// 按后端规则校验并规范化 AnalysisInput，返回校验明细
function validateInput(body: unknown): {
  input: AnalysisInput | null
  details: ValidationDetail[]
} {
  const details: ValidationDetail[] = []
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      input: null,
      details: [{ field: ['body'], message: '请求体必须是 JSON 对象' }],
    }
  }

  const raw = body as Record<string, unknown>
  const allowed = new Set(['algorithm_id', 'scenes', 'parameters'])
  Object.keys(raw).forEach((key) => {
    if (!allowed.has(key)) {
      details.push({ field: [key], message: 'Extra inputs are not permitted' }) // 后端拒绝未知字段
    }
  })

  const algorithmId = typeof raw.algorithm_id === 'string' ? raw.algorithm_id : ''
  if (!algorithmId || algorithmId.length > 100) {
    details.push({ field: ['algorithm_id'], message: '算法标识长度必须在 1–100 字符之间' })
  }

  let threshold = 0.5
  if (raw.parameters !== undefined) {
    if (!raw.parameters || typeof raw.parameters !== 'object' || Array.isArray(raw.parameters)) {
      details.push({ field: ['parameters'], message: 'parameters 必须是对象' })
    } else {
      const params = raw.parameters as Record<string, unknown>
      Object.keys(params).forEach((key) => {
        if (key !== 'threshold') {
          details.push({ field: ['parameters', key], message: 'Extra inputs are not permitted' })
        }
      })
      if (params.threshold !== undefined) {
        if (typeof params.threshold !== 'number' || !Number.isFinite(params.threshold)) {
          details.push({ field: ['parameters', 'threshold'], message: '阈值必须是数字' })
        } else if (params.threshold < 0 || params.threshold > 1) {
          details.push({ field: ['parameters', 'threshold'], message: '阈值必须位于 0–1 之间' })
        } else {
          threshold = params.threshold
        }
      }
    }
  }

  const scenesRaw = raw.scenes
  const scenes: SceneInput[] = []
  if (!Array.isArray(scenesRaw)) {
    details.push({ field: ['scenes'], message: 'scenes 必须是数组' })
  } else {
    if (scenesRaw.length < 2 || scenesRaw.length > 100) {
      details.push({ field: ['scenes'], message: '时相数量必须为 2–100 个' })
    }
    scenesRaw.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        details.push({ field: ['scenes', index], message: '时相必须是对象' })
        return
      }
      const scene = item as Record<string, unknown>
      Object.keys(scene).forEach((key) => {
        if (!['timestamp', 'uri', 'format'].includes(key)) {
          details.push({ field: ['scenes', index, key], message: 'Extra inputs are not permitted' })
        }
      })

      const timestamp = typeof scene.timestamp === 'string' ? scene.timestamp : ''
      if (!timestamp) {
        details.push({ field: ['scenes', index, 'timestamp'], message: '缺少时相时间' })
      } else if (!hasTimezone(timestamp) || Number.isNaN(Date.parse(timestamp))) {
        details.push({
          field: ['scenes', index, 'timestamp'],
          message: '时间必须包含时区，例如 2024-01-24T00:00:00Z',
        })
      }

      const uri = typeof scene.uri === 'string' ? scene.uri : ''
      if (!uri) {
        details.push({ field: ['scenes', index, 'uri'], message: '缺少影像资源地址' })
      } else {
        const uriError = validateUri(uri)
        if (uriError) details.push({ field: ['scenes', index, 'uri'], message: uriError })
      }

      if (scene.format !== undefined && scene.format !== 'geotiff') {
        details.push({ field: ['scenes', index, 'format'], message: '目前只支持 geotiff' })
      }

      if (timestamp && !Number.isNaN(Date.parse(timestamp)) && uri) {
        scenes.push({
          timestamp: new Date(timestamp).toISOString(),
          uri,
          format: 'geotiff',
        })
      }
    })

    for (let index = 1; index < scenes.length; index += 1) {
      if (Date.parse(scenes[index - 1].timestamp) >= Date.parse(scenes[index].timestamp)) {
        details.push({
          field: ['scenes', index, 'timestamp'],
          message: '时相必须按时间严格递增，不允许重复',
        })
      }
    }
  }

  if (details.length > 0 || !algorithmId) {
    return { input: null, details }
  }

  return {
    input: {
      algorithm_id: algorithmId,
      scenes,
      parameters: { threshold },
    },
    details: [],
  }
}

// 计算模拟结果 — 与后端 mock_change 完全一致，不生成面积数值
function buildMockResult(input: AnalysisInput): AnalysisResult {
  return {
    is_mock: true,
    message: '模拟结果，仅供接口联调；未读取影像或执行模型推理。',
    scene_count: input.scenes.length,
    timestamps: input.scenes.map((scene) => scene.timestamp),
    water_area_km2: null,
    expansion_km2: null,
    shrinkage_km2: null,
    artifacts: [],
  }
}

// Mock 主路由 — 路径与真实服务一致（不含 /api/v1 前缀）
export async function mockHandler<T>(
  method: string,
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 180 + Math.random() * 140)) // 模拟网络延迟

  if (method === 'GET' && path === '/health') {
    return { status: 'ok' } as T
  }

  if (method === 'GET' && path === '/algorithms') {
    return { items: ALGORITHMS } as T
  }

  if (method === 'GET' && path === '/analyses') {
    const limit = numericParam(opts.params, 'limit', 20)
    const offset = numericParam(opts.params, 'offset', 0)
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw mockError(422, '请求参数不合法', 'VALIDATION_ERROR', [
        { field: ['query', 'limit'], message: 'limit 必须位于 1–100 之间' },
      ])
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw mockError(422, '请求参数不合法', 'VALIDATION_ERROR', [
        { field: ['query', 'offset'], message: 'offset 不能为负数' },
      ])
    }
    const page: AnalysisPage = {
      items: RECORDS.slice(offset, offset + limit),
      limit,
      offset,
    }
    return page as T
  }

  const detailMatch = path.match(/^\/analyses\/([^/]+)$/)
  if (method === 'GET' && detailMatch) {
    const id = decodeURIComponent(detailMatch[1])
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw mockError(422, '请求参数不合法', 'VALIDATION_ERROR', [
        { field: ['path', 'analysis_id'], message: '值不是合法的 UUID' },
      ])
    }
    const record = RECORDS.find((item) => item.id === id)
    if (!record) throw mockError(404, '分析记录不存在')
    return record as T
  }

  if (method === 'POST' && path === '/analyses') {
    const { input, details } = validateInput(opts.body)
    if (!input) {
      throw mockError(422, '请求参数不合法', 'VALIDATION_ERROR', details)
    }
    const algorithm = ALGORITHMS.find((item) => item.id === input.algorithm_id)
    if (!algorithm) throw mockError(404, '算法不存在')
    if (algorithm.implementation === 'unavailable') {
      throw mockError(501, '算法尚未接入，请使用 mock_change 进行联调')
    }

    const record: Analysis = {
      id: crypto.randomUUID(),
      status: 'succeeded',
      algorithm_id: algorithm.id,
      created_at: new Date().toISOString(),
      input,
      result: buildMockResult(input),
    }
    RECORDS.unshift(record)
    return record as T
  }

  throw mockError(404, `Mock: 未实现的接口 ${method} ${path}`)
}
