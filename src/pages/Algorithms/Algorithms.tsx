import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Cpu,
  ExternalLink,
  KeyRound,
  Plus,
  RefreshCw,
  Server,
  TriangleAlert,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader/PageHeader'
import Panel from '../../components/Panel/Panel'
import Loading from '../../components/Loading/Loading'
import EmptyState from '../../components/EmptyState/EmptyState'
import ApiKeyForm from '../../components/ApiKeyForm/ApiKeyForm'
import { useApi } from '../../hooks/useApi'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAppStore } from '../../store/app'
import { fetchAlgorithms } from '../../api/algorithms'
import { fetchHealth } from '../../api/system'
import {
  getApiBaseUrl,
  getDocsUrl,
  getHealthUrl,
  getOpenApiUrl,
  isMockMode,
} from '../../api/client'
import styles from './Algorithms.module.css'

// 算法实现状态的中文标签与徽标样式
function implementationMeta(implementation: string): { label: string; className: string } {
  if (implementation === 'mock') return { label: '模拟实现', className: 'badge badge-warning' }
  if (implementation === 'unavailable') return { label: '不可用', className: 'badge badge-danger' }
  return { label: implementation, className: 'badge badge-accent' }
}

// 算法服务 — 展示注册表、服务连接与本地 API 密钥配置
export default function Algorithms() {
  useDocumentTitle('算法服务')
  const apiKey = useAppStore((state) => state.apiKey)
  const mockMode = isMockMode()
  const algorithmsQuery = useApi(() => fetchAlgorithms(), [apiKey])
  const healthQuery = useApi(() => fetchHealth(), [apiKey])
  const algorithms = algorithmsQuery.data ?? []
  const availableCount = algorithms.filter((item) => item.implementation !== 'unavailable').length
  const health = healthQuery.data
  const healthError = healthQuery.error

  const healthLabel = mockMode
    ? 'Mock 联调'
    : healthQuery.loading && !health
      ? '检查中'
      : healthError
        ? '不可达'
        : health
          ? health.status === 'ok' ? '在线' : health.status
          : '未知'
  const healthClass = mockMode
    ? styles.healthMock
    : healthError
      ? styles.healthDown
      : health?.status === 'ok'
        ? styles.healthOk
        : styles.healthUnknown

  // 同时刷新算法与健康状态
  const refreshAll = () => {
    algorithmsQuery.refresh()
    healthQuery.refresh()
  }

  return (
    <div className="page">
      <PageHeader
        title="算法服务"
        description="从后端注册表读取算法及实现状态；不可用算法保留入口，但不自动降级为模拟。"
        meta={
          <>
            <span>Base URL <code>{getApiBaseUrl()}</code></span>
            <span className="sep">·</span>
            <span>{mockMode ? '浏览器内 Mock' : '真实后端'}</span>
            <span className="sep">·</span>
            <span>GET /algorithms</span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={refreshAll}
              disabled={algorithmsQuery.loading || healthQuery.loading}
            >
              <RefreshCw
                size={12}
                className={algorithmsQuery.loading || healthQuery.loading ? 'spin' : undefined}
                aria-hidden="true"
              />
              刷新
            </button>
            <Link to="/analyze" className="btn btn-primary btn-sm">
              <Plus size={12} aria-hidden="true" />
              新建分析
            </Link>
          </>
        }
      />

      {algorithmsQuery.error && (
        <div className={`callout callout-danger ${styles.inlineCallout}`} role="alert">
          <TriangleAlert size={14} aria-hidden="true" />
          <span>算法注册表查询失败：{algorithmsQuery.error}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={algorithmsQuery.refresh}>
            重试
          </button>
        </div>
      )}

      {!mockMode && healthError && (
        <div className={`callout callout-warning ${styles.inlineCallout}`} role="alert">
          <TriangleAlert size={14} aria-hidden="true" />
          <span>健康检查失败：{getHealthUrl()} · {healthError}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={healthQuery.refresh}>
            重试
          </button>
        </div>
      )}

      <div className={styles.layout}>
        <Panel
          title="算法注册表"
          subtitle={algorithms.length > 0 ? `${availableCount} 个可执行` : undefined}
          icon={<Cpu size={14} aria-hidden="true" />}
          flush
        >
          {algorithmsQuery.loading && algorithms.length === 0 ? (
            <div className={styles.loadingWrap}>
              <Loading text="正在读取算法注册表" />
            </div>
          ) : algorithms.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                icon={<Cpu size={22} aria-hidden="true" />}
                title="算法注册表为空"
                description="后端没有返回算法项。请确认服务已启动，且 API Key 配置正确。"
                hint="GET /api/v1/algorithms"
                action={
                  <button type="button" className="btn btn-secondary btn-sm" onClick={algorithmsQuery.refresh}>
                    重新查询
                  </button>
                }
              />
            </div>
          ) : (
            <div className={styles.list}>
              {algorithms.map((algorithm, index) => {
                const meta = implementationMeta(algorithm.implementation)
                const unavailable = algorithm.implementation === 'unavailable'

                return (
                  <article key={algorithm.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <span className={styles.index} aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className={styles.titleGroup}>
                        <code className={styles.algorithmId}>{algorithm.id}</code>
                        <span className={meta.className}>{meta.label}</span>
                      </div>
                      <span className={styles.implValue}>implementation: {algorithm.implementation}</span>
                    </div>

                    <p className={styles.description}>{algorithm.description}</p>
                    <p className={styles.notes}>
                      {algorithm.implementation === 'mock' &&
                        '只校验请求参数并返回显式模拟结构；不读取影像、不执行推理，面积为 null。'}
                      {unavailable &&
                        '注册表保留入口，但 run 为空；调用 POST /analyses 将返回 501，不会自动改用模拟算法。'}
                      {algorithm.implementation !== 'mock' && !unavailable &&
                        '后端声明的其他实现状态；请以实际运行结果为准。'}
                    </p>

                    <div className={styles.cardFoot}>
                      <span className={styles.endpoint}>POST /api/v1/analyses</span>
                      {unavailable ? (
                        <span className={styles.unavailableAction}>当前不可提交</span>
                      ) : (
                        <Link to={`/analyze?algorithm=${encodeURIComponent(algorithm.id)}`} className="btn btn-secondary btn-sm">
                          用它新建分析
                          <ArrowUpRight size={12} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </Panel>

        <aside className={styles.side}>
          <Panel title="服务连接" icon={<Server size={14} aria-hidden="true" />}>
            <div className={styles.healthRow}>
              <span
                className={`dot ${
                  healthError ? 'offline' : !mockMode && health?.status === 'ok' ? 'live' : ''
                }`}
                aria-hidden="true"
              />
              <span className={styles.healthLabel}>健康检查</span>
              <span className={`${styles.healthState} ${healthClass}`}>{healthLabel}</span>
            </div>
            {healthError && <p className={styles.healthError}>{healthError}</p>}

            <dl className={`kv-list ${styles.connection}`}>
              <div className="kv-row">
                <dt>业务基址</dt>
                <dd><code className={styles.urlCode}>{getApiBaseUrl()}</code></dd>
              </div>
              <div className="kv-row">
                <dt>健康检查</dt>
                <dd><code className={styles.urlCode}>{getHealthUrl()}</code></dd>
              </div>
              <div className="kv-row">
                <dt>运行模式</dt>
                <dd>{mockMode ? '浏览器内 Mock' : '真实后端'}</dd>
              </div>
              <div className="kv-row">
                <dt>可执行算法</dt>
                <dd>{algorithmsQuery.loading && algorithms.length === 0 ? '—' : `${availableCount} / ${algorithms.length}`}</dd>
              </div>
              <div className="kv-row">
                <dt>API 密钥</dt>
                <dd>{apiKey ? '已配置' : '未配置'}</dd>
              </div>
            </dl>

            {mockMode && (
              <p className={styles.mockNote}>
                Mock 模式在浏览器内模拟 v1 响应，不连接真实后端，记录仅保留于当前会话。
              </p>
            )}

            <div className={styles.links}>
              <a href={getDocsUrl()} target="_blank" rel="noreferrer">
                Swagger UI
                <ExternalLink size={11} aria-hidden="true" />
              </a>
              <a href={getOpenApiUrl()} target="_blank" rel="noreferrer">
                OpenAPI JSON
                <ExternalLink size={11} aria-hidden="true" />
              </a>
              <Link to="/api">接口文档</Link>
            </div>
          </Panel>

          <Panel title="API 密钥" icon={<KeyRound size={14} aria-hidden="true" />}>
            <ApiKeyForm />
          </Panel>
        </aside>
      </div>
    </div>
  )
}
