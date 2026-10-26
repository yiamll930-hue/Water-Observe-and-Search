import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Cpu,
  Info,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  Send,
  TriangleAlert,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader/PageHeader'
import Panel from '../../components/Panel/Panel'
import Loading from '../../components/Loading/Loading'
import EmptyState from '../../components/EmptyState/EmptyState'
import SceneEditor, { createEmptyScene } from '../../components/SceneEditor/SceneEditor'
import { useApi } from '../../hooks/useApi'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAppStore } from '../../store/app'
import { fetchAlgorithms } from '../../api/algorithms'
import { createAnalysis } from '../../api/analyses'
import {
  formatErrorMessage,
  getApiBaseUrl,
  isApiError,
  isMockMode,
} from '../../api/client'
import {
  buildAnalysisInput,
  DEFAULT_THRESHOLD,
  MAX_SCENES,
  type SceneIssue,
} from '../../utils/analysis'
import type { SceneDraft } from '../../types'
import styles from './Analyze.module.css'

interface SubmitError {
  message: string
  status: number
}

// 算法实现状态的中文标签与徽标样式
function implementationMeta(implementation: string): { label: string; className: string } {
  if (implementation === 'mock') return { label: '模拟实现', className: 'badge badge-warning' }
  if (implementation === 'unavailable') return { label: '不可用', className: 'badge badge-danger' }
  return { label: implementation, className: 'badge badge-accent' }
}

// 新建多时相分析 — 选择算法、录入 2–100 景时相并同步提交
export default function Analyze() {
  useDocumentTitle('新建分析')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedAlgorithm = searchParams.get('algorithm') ?? ''
  const apiKey = useAppStore((state) => state.apiKey)
  const mockMode = isMockMode()

  const algorithmsQuery = useApi(() => fetchAlgorithms(), [apiKey])
  const algorithms = algorithmsQuery.data ?? []
  const availableAlgorithms = algorithms.filter((item) => item.implementation !== 'unavailable')

  const [algorithmId, setAlgorithmId] = useState(requestedAlgorithm)
  const [scenes, setScenes] = useState<SceneDraft[]>(() => [createEmptyScene(), createEmptyScene()])
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [issues, setIssues] = useState<Record<string, SceneIssue>>({})
  const [errors, setErrors] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<SubmitError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedAlgorithm = algorithms.find((item) => item.id === algorithmId)

  // 算法列表到达后，校正链接预选或回退到首个可执行算法
  useEffect(() => {
    if (!algorithmsQuery.data) return
    setAlgorithmId((current) => {
      const validCurrent = algorithmsQuery.data?.find(
        (item) => item.id === current && item.implementation !== 'unavailable'
      )
      if (validCurrent) return current
      const validRequested = algorithmsQuery.data?.find(
        (item) => item.id === requestedAlgorithm && item.implementation !== 'unavailable'
      )
      if (validRequested) return validRequested.id
      return algorithmsQuery.data?.find((item) => item.implementation !== 'unavailable')?.id ?? ''
    })
  }, [algorithmsQuery.data, requestedAlgorithm])

  // 切换算法时清除上一轮校验与提交错误
  const handleAlgorithmChange = (id: string) => {
    setAlgorithmId(id)
    setIssues({})
    setErrors([])
    setSubmitError(null)
  }

  // 时相变化后清除旧错误，等待再次提交时重新校验
  const handleScenesChange = (nextScenes: SceneDraft[]) => {
    setScenes(nextScenes)
    setIssues({})
    setErrors([])
    setSubmitError(null)
  }

  // 提交同步分析 — 成功后跳转到记录详情
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setSubmitError(null)

    if (!selectedAlgorithm || selectedAlgorithm.implementation === 'unavailable') {
      setErrors(['请选择一个可用的算法'])
      return
    }

    const validation = buildAnalysisInput(algorithmId, scenes, threshold)
    setIssues(validation.issues)
    setErrors(validation.errors)
    if (!validation.input) return

    setSubmitting(true)
    try {
      const record = await createAnalysis(validation.input)
      navigate(`/analyses/${record.id}`, { state: { created: true } })
    } catch (error) {
      setSubmitError({
        message: formatErrorMessage(error),
        status: isApiError(error) ? error.status : 0,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = Boolean(algorithmId) && !submitting && !algorithmsQuery.error

  return (
    <div className="page">
      <PageHeader
        title="新建多时相分析"
        description="选择注册算法，提交 2–100 景按时间严格递增的影像引用；v1 为同步执行。"
        meta={
          <>
            <span>Base URL <code>{getApiBaseUrl()}</code></span>
            <span className="sep">·</span>
            <span>{mockMode ? '浏览器内 Mock' : '真实后端'}</span>
            <span className="sep">·</span>
            <span>POST /analyses</span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={algorithmsQuery.refresh}
              disabled={algorithmsQuery.loading}
            >
              <RefreshCw
                size={12}
                className={algorithmsQuery.loading ? 'spin' : undefined}
                aria-hidden="true"
              />
              刷新算法
            </button>
            <Link to="/api" className="btn btn-ghost btn-sm">接口文档</Link>
          </>
        }
      />

      {mockMode && (
        <div className={`callout ${styles.modeNote}`} role="note">
          <Info size={14} aria-hidden="true" />
          <span>
            当前由浏览器内 Mock 响应，结构与 v1 契约一致但记录仅保存在本次会话；
            结果会明确标记 <code>is_mock=true</code>，科学量为 null。
          </span>
        </div>
      )}

      {algorithmsQuery.error && (
        <div className={`callout callout-danger ${styles.inlineCallout}`} role="alert">
          <TriangleAlert size={14} aria-hidden="true" />
          <span>算法注册表查询失败：{algorithmsQuery.error}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={algorithmsQuery.refresh}>
            重试
          </button>
        </div>
      )}

      <form className={styles.layout} onSubmit={handleSubmit} noValidate>
        <div className={styles.main}>
          <Panel
            title="算法"
            subtitle={algorithms.length > 0 ? `${availableAlgorithms.length} 个可执行` : undefined}
            icon={<Cpu size={14} aria-hidden="true" />}
          >
            {algorithmsQuery.loading && algorithms.length === 0 ? (
              <Loading text="正在读取算法注册表" />
            ) : algorithms.length === 0 ? (
              <EmptyState
                icon={<Cpu size={20} aria-hidden="true" />}
                title="没有可用算法"
                description="后端 GET /api/v1/algorithms 未返回任何算法。请确认服务与 API Key 配置。"
                action={
                  <button type="button" className="btn btn-secondary btn-sm" onClick={algorithmsQuery.refresh}>
                    重新查询
                  </button>
                }
              />
            ) : (
              <div className={styles.algorithmGrid} role="radiogroup" aria-label="选择分析算法">
                {algorithms.map((algorithm) => {
                  const meta = implementationMeta(algorithm.implementation)
                  const unavailable = algorithm.implementation === 'unavailable'
                  const selected = algorithm.id === algorithmId

                  return (
                    <label
                      key={algorithm.id}
                      className={`${styles.algorithmCard} ${selected ? styles.selected : ''} ${unavailable ? styles.unavailable : ''}`}
                    >
                      <input
                        type="radio"
                        name="algorithm"
                        className={styles.radio}
                        value={algorithm.id}
                        checked={selected}
                        disabled={unavailable}
                        onChange={() => handleAlgorithmChange(algorithm.id)}
                      />
                      <span className={styles.algorithmHead}>
                        <code className={styles.algorithmId}>{algorithm.id}</code>
                        <span className={meta.className}>{meta.label}</span>
                      </span>
                      <span className={styles.algorithmDesc}>{algorithm.description}</span>
                      <span className={styles.algorithmFoot}>
                        implementation: <code>{algorithm.implementation}</code>
                        {algorithm.implementation === 'mock' && ' · 不读取影像，科学量为 null'}
                        {unavailable && ' · 调用将返回 501，不降级为模拟'}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </Panel>

          <Panel
            title="时相序列"
            subtitle={`${scenes.length} / ${MAX_SCENES} 景`}
            bodyClassName={styles.sceneBody}
          >
            <SceneEditor
              scenes={scenes}
              onChange={handleScenesChange}
              issues={issues}
              disabled={submitting}
            />
          </Panel>

          {errors.length > 0 && (
            <div className={`callout callout-danger ${styles.errorCallout}`} role="alert">
              <div className={styles.errorHead}>
                <TriangleAlert size={14} aria-hidden="true" />
                提交前请修正以下问题
              </div>
              <ul>
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <div className={`callout callout-danger ${styles.errorCallout}`} role="alert">
              <div className={styles.errorHead}>
                <TriangleAlert size={14} aria-hidden="true" />
                分析提交失败
                {submitError.status > 0 && <code>HTTP {submitError.status}</code>}
              </div>
              <p>{submitError.message}</p>
              {submitError.status === 401 && (
                <p className={styles.errorHint}>
                  <KeyRound size={12} aria-hidden="true" />
                  请使用顶栏钥匙按钮配置有效的 X-API-Key 后重试。
                </p>
              )}
              {submitError.status === 501 && (
                <p className={styles.errorHint}>
                  该算法尚未接入真实实现，请选择实际可执行的算法。
                </p>
              )}
            </div>
          )}
        </div>

        <aside className={styles.side}>
          <Panel title="参数" subtitle="Parameters">
            <div className={styles.thresholdHead}>
              <label htmlFor="analysis-threshold">阈值 threshold</label>
              <span className={styles.thresholdValue}>{threshold.toFixed(2)}</span>
            </div>
            <div className={styles.thresholdRow}>
              <input
                id="analysis-threshold"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
                disabled={submitting}
                aria-label="阈值滑杆"
              />
              <input
                type="number"
                className={`input ${styles.numberInput}`}
                min={0}
                max={1}
                step={0.01}
                value={threshold}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isFinite(value)) setThreshold(Math.min(1, Math.max(0, value)))
                }}
                disabled={submitting}
                aria-label="阈值数值"
              />
            </div>
            <p className={styles.fieldHint}>
              取值 0–1，默认 {DEFAULT_THRESHOLD}。模拟算法只校验参数，不执行阈值计算。
            </p>
          </Panel>

          <Panel title="提交" subtitle="Synchronous">
            <dl className={`kv-list ${styles.summary}`}>
              <div className="kv-row">
                <dt>接口</dt>
                <dd className="mono">POST /analyses</dd>
              </div>
              <div className="kv-row">
                <dt>算法</dt>
                <dd className="mono">{algorithmId || '—'}</dd>
              </div>
              <div className="kv-row">
                <dt>时相</dt>
                <dd>{scenes.length} 景</dd>
              </div>
              <div className="kv-row">
                <dt>鉴权</dt>
                <dd>{mockMode ? 'Mock 无需密钥' : apiKey ? 'X-API-Key 已配置' : '未配置密钥'}</dd>
              </div>
              <div className="kv-row">
                <dt>目标</dt>
                <dd className={styles.target}>{getApiBaseUrl()}</dd>
              </div>
            </dl>

            <button
              type="submit"
              className={`btn btn-primary btn-block ${styles.submit}`}
              disabled={!canSubmit}
            >
              {submitting ? (
                <LoaderCircle size={14} className="spin" aria-hidden="true" />
              ) : (
                <Send size={14} aria-hidden="true" />
              )}
              {submitting ? '正在同步执行…' : '提交分析'}
            </button>

            <p className={styles.fieldHint}>
              提交后等待后端同步返回。成功会保存一条记录并跳转到详情；失败不会创建记录。
            </p>
          </Panel>
        </aside>
      </form>
    </div>
  )
}
