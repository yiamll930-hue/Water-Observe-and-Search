// 分析输入工具 — 将前端时相草稿转换为 v1 契约要求的 AnalysisInput
import type { AnalysisInput, SceneDraft, SceneInput } from '../types'
import { formatDate } from './format'

export const MIN_SCENES = 2 // 后端要求的最少时相数
export const MAX_SCENES = 100 // 后端允许的最多时相数
export const DEFAULT_THRESHOLD = 0.5 // 后端默认阈值

export interface SceneIssue {
  timestamp?: string
  uri?: string
}

export interface DraftValidationResult {
  input: AnalysisInput | null
  issues: Record<string, SceneIssue> // 按行标识保存字段级错误
  errors: string[]
}

// 把 datetime-local 本地时间转换为带 Z 的 UTC ISO 8601
export function localToIsoTimestamp(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

// 把 ISO 8601 时间转换为 datetime-local 输入值
export function isoToLocalInput(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 校验影像地址 — 与后端一致的 https / s3 / gs 完整资源地址
export function validateResourceUri(uri: string): string | null {
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

// 校验并组装 POST /analyses 请求体
export function buildAnalysisInput(
  algorithmId: string,
  drafts: SceneDraft[],
  threshold: number
): DraftValidationResult {
  const issues: Record<string, SceneIssue> = {}
  const errors: string[] = []

  if (!algorithmId) errors.push('请选择一个可用的算法')
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    errors.push('阈值必须位于 0–1 之间')
  }
  if (drafts.length < MIN_SCENES || drafts.length > MAX_SCENES) {
    errors.push(`时相数量必须为 ${MIN_SCENES}–${MAX_SCENES} 个`)
  }

  const scenes: SceneInput[] = []
  drafts.forEach((draft) => {
    const issue: SceneIssue = {}
    const timestamp = localToIsoTimestamp(draft.timestamp)
    const uri = draft.uri.trim()

    if (!draft.timestamp) issue.timestamp = '请选择时相时间'
    else if (!timestamp) issue.timestamp = '时间格式不合法'

    if (!uri) issue.uri = '请填写影像资源地址'
    else {
      const uriError = validateResourceUri(uri)
      if (uriError) issue.uri = uriError
    }

    if (Object.keys(issue).length > 0) issues[draft.id] = issue
    if (timestamp) {
      scenes.push({ timestamp, uri, format: 'geotiff' }) // geotiff 为 v1 唯一支持格式
    }
  })

  if (Object.keys(issues).length > 0) {
    errors.push('请修正时相序列中标注的字段')
  } else if (scenes.length === drafts.length) {
    for (let index = 1; index < scenes.length; index += 1) {
      if (Date.parse(scenes[index - 1].timestamp) >= Date.parse(scenes[index].timestamp)) {
        errors.push(`第 ${index + 1} 个时相必须晚于第 ${index} 个时相，且不能重复`)
        issues[drafts[index].id] = { timestamp: '必须晚于上一时相' }
      }
    }
  }

  if (errors.length > 0 || Object.keys(issues).length > 0) {
    return { input: null, issues, errors }
  }

  return {
    input: {
      algorithm_id: algorithmId,
      scenes,
      parameters: { threshold },
    },
    issues: {},
    errors: [],
  }
}

// 生成记录列表中的时相范围文案
export function formatSceneRange(scenes: Array<{ timestamp: string }> | null | undefined): string {
  if (!scenes || scenes.length === 0) return '—'
  const first = formatDate(scenes[0].timestamp)
  const last = formatDate(scenes[scenes.length - 1].timestamp)
  return first === last ? first : `${first} — ${last}`
}
