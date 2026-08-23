// API 客户端 — fetch 封装
// 设置 VITE_USE_MOCK=false 切换为真实 API

const BASE_URL = '/api/v1'
const USE_MOCK = true // 默认使用 mock，后续改为 import.meta.env.VITE_USE_MOCK !== 'false'

interface RequestOptions {
  params?: Record<string, string | number | undefined>
  body?: unknown
  signal?: AbortSignal
}

// ApiError — 使用函数构造而非 class 以兼容 erasableSyntaxOnly
function ApiError(status: number, message: string): Error {
  const err = new Error(message)
  err.name = 'ApiError'
  ;(err as Error & { status: number }).status = status
  return err
}

async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  if (USE_MOCK) {
    const { mockHandler } = await import('../mock/handler')
    return mockHandler<T>(method, path, opts)
  }

  let url = `${BASE_URL}${path}`
  if (opts.params) {
    const search = new URLSearchParams()
    Object.entries(opts.params).forEach(([k, v]) => {
      if (v !== undefined) search.set(k, String(v))
    })
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  })

  if (!res.ok) {
    throw ApiError(res.status, `HTTP ${res.status}: ${res.statusText}`)
  }

  return res.json()
}

// 便捷方法
export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>('GET', path, opts),
  post: <T>(path: string, opts?: RequestOptions) =>
    request<T>('POST', path, opts),
}

export { ApiError }
