// RESTful API 客户端 — 多时序算法服务 v1
// 支持 X-API-Key、统一错误信封、limit/offset 分页与 Mock 模式

import type { ApiErrorBody, ValidationDetail } from '../types'

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/$/, '') // 可选后端源，例如 http://localhost:8000
const API_BASE_PATH = import.meta.env.VITE_API_BASE_URL ?? '/api/v1' // 业务接口根路径
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' // 默认连接真实后端，显式设为 true 才启用 Mock
const DEFAULT_TIMEOUT = 20000 // 默认请求超时（毫秒）
const API_KEY_STORAGE = 'ww-api-key' // 本地保存的 API Key

export type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  params?: Record<string, QueryValue>
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  timeout?: number
}

export interface ApiError extends Error {
  status: number
  code: string
  details?: ValidationDetail[]
}

// 构造带状态码与字段明细的错误对象 — 使用函数以兼容 erasableSyntaxOnly
function createApiError(
  status: number,
  message: string,
  code = 'API_ERROR',
  details?: ValidationDetail[]
): ApiError {
  const error = new Error(message) as ApiError
  error.name = 'ApiError'
  error.status = status
  error.code = code
  error.details = details
  return error
}

// 判断是否为统一错误对象
export function isApiError(value: unknown): value is ApiError {
  return value instanceof Error && value.name === 'ApiError'
}

// 读取本地保存的 API Key
export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

// 保存 API Key；空字符串表示清除
export function setStoredApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(API_KEY_STORAGE, key)
    else localStorage.removeItem(API_KEY_STORAGE)
  } catch {
    // 隐私模式下 localStorage 不可用时保持内存态
  }
}

// 判断是否处于 Mock 模式
export function isMockMode(): boolean {
  return USE_MOCK
}

// 业务接口根地址，供文档页展示
export function getApiBaseUrl(): string {
  return `${API_ORIGIN}${API_BASE_PATH}`
}

// 健康检查地址 — /health 不位于 /api/v1 下
export function getHealthUrl(): string {
  return `${API_ORIGIN}/health`
}

// 后端根地址 — 未配置 VITE_API_ORIGIN 时为空，走同源或开发代理
export function getApiOrigin(): string {
  return API_ORIGIN || window.location.origin
}

// Swagger UI 地址
export function getDocsUrl(): string {
  return `${API_ORIGIN || ''}/docs`
}

// OpenAPI 契约地址
export function getOpenApiUrl(): string {
  return `${API_ORIGIN || ''}/openapi.json`
}

// 将查询参数序列化为 URLSearchParams
function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return ''
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

// 解析 422 校验明细中的字段路径
export function describeValidationField(field: ValidationDetail['field']): string {
  const parts = Array.isArray(field) ? field : [field]
  return parts
    .filter((part) => part !== 'body')
    .map((part) => String(part))
    .join('.')
}

// 组合错误提示与校验明细，供表单与页面展示
export function formatErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return error instanceof Error ? error.message : '请求失败'
  }
  if (!error.details || error.details.length === 0) return error.message
  const details = error.details.map((item) => {
    const field = describeValidationField(item.field)
    return field ? `${field}: ${item.message}` : item.message
  })
  return `${error.message}（${details.join('；')}）`
}

// 解析错误响应体 — { error: { code, message, details } }
async function parseError(response: Response): Promise<ApiError> {
  let message = `HTTP ${response.status} ${response.statusText}`.trim()
  let code = String(response.status)
  let details: ValidationDetail[] | undefined
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body.error) {
      code = body.error.code ?? code
      message = body.error.message ?? message
      details = body.error.details
    }
  } catch {
    // 非 JSON 错误响应保持 HTTP 文案
  }
  return createApiError(response.status, message, code, details)
}

// 合并外部 signal 与超时控制
function withTimeout(
  signal: AbortSignal | undefined,
  timeout: number
): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const forwardAbort = () => controller.abort()
  signal?.addEventListener('abort', forwardAbort, { once: true })
  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', forwardAbort)
    },
  }
}

// 统一请求入口 — base 为空时走业务根路径
async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {},
  base: 'api' | 'root' = 'api'
): Promise<T> {
  if (USE_MOCK) {
    const { mockHandler } = await import('../mock/handler') // 按需加载 Mock，避免生产包体积
    return mockHandler<T>(method, path, opts)
  }

  const prefix = base === 'root' ? API_ORIGIN : `${API_ORIGIN}${API_BASE_PATH}` // 请求前缀
  const url = `${prefix}${path}${buildQuery(opts.params)}`
  const timeout = opts.timeout ?? DEFAULT_TIMEOUT
  const controller = withTimeout(opts.signal, timeout)
  const apiKey = getStoredApiKey() // 每次请求读取最新密钥

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        ...opts.headers,
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    })

    if (!response.ok) throw await parseError(response)
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createApiError(408, '请求超时或已取消', 'REQUEST_ABORTED')
    }
    if (error instanceof TypeError) {
      throw createApiError(
        0,
        '无法连接后端服务，请确认服务已启动，且 Vite 代理或 VITE_API_ORIGIN 配置正确。',
        'NETWORK_ERROR'
      )
    }
    throw error
  } finally {
    controller.clear()
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts),
  // 根路径接口（/health）
  rootGet: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts, 'root'),
}
