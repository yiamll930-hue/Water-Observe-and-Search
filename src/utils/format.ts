// 格式化工具 — 统一空值、数值、日期与坐标文案

const DASH = '—'

// 数值格式化 — null 显示为破折号，避免把「未计算」误读为 0
export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

// 整数格式化
export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH
  return value.toLocaleString('zh-CN')
}

// 日期时间格式化 — 按浏览器本地时区展示
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return DASH
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// 短日期时间 — 用于概览卡片等空间有限的位置
export function formatShortDateTime(value: string | null | undefined): string {
  if (!value) return DASH
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// 日期格式化
export function formatDate(value: string | null | undefined): string {
  if (!value) return DASH
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// 经纬度格式化
export function formatLatLng(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
}

// 拼接 className，过滤空值
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}
