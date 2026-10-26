import { useEffect } from 'react'

// 设置页面标题 — 页面切换时同步浏览器标签
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · WaterWatch`
    return () => {
      document.title = previous
    }
  }, [title])
}
