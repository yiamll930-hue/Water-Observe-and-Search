import { useState, useEffect, useCallback, useRef } from 'react'
import { formatErrorMessage } from '../api/client'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

// 通用 API Hook — 处理加载、错误与手动刷新
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: { enabled?: boolean } = {}
): UseApiState<T> {
  const { enabled = true } = options
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  // 手动刷新 — 递增版本号触发重新请求
  const refresh = useCallback(() => setVersion((value) => value + 1), [])

  useEffect(() => {
    if (!enabled) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let alive = true
    setLoading(true)
    setError(null)

    fetcherRef.current()
      .then((result) => {
        if (alive) setData(result)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setError(formatErrorMessage(err))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, version, ...deps])

  return { data, loading, error, refresh }
}
