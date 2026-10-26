import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Cpu,
  History,
  Info,
  KeyRound,
  Map as MapIcon,
  PlayCircle,
  Plus,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader/PageHeader'
import Panel from '../../components/Panel/Panel'
import PipelineRail from '../../components/PipelineRail/PipelineRail'
import Loading from '../../components/Loading/Loading'
import EmptyState from '../../components/EmptyState/EmptyState'
import { useApi } from '../../hooks/useApi'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAppStore } from '../../store/app'
import { fetchHealth } from '../../api/system'
import { fetchAlgorithms } from '../../api/algorithms'
import { fetchAnalyses } from '../../api/analyses'
import { getApiBaseUrl, getHealthUrl, isMockMode } from '../../api/client'
import { formatDateTime, formatInteger, formatShortDateTime } from '../../utils/format'
import styles from './Workspace.module.css'

const MODULES = [
  {
    to: '/analyze',
    icon: PlayCircle,
    title: '新建多时相分析',
    description: '选择算法，提交 2–100 景影像引用并同步执行。',
  },
  {
    to: '/analyses',
    icon: History,
    title: '分析记录',
    description: '按创建时间倒序查询记录，查看输入与原始结果。',
  },
  {
    to: '/algorithms',
    icon: Cpu,
    title: '算法服务',
    description: '读取注册表与实现状态，配置 X-API-Key。',
  },
  {
    to: '/map',
    icon: MapIcon,
    title: '研究区地图',
    description: '鄱阳湖、洞庭湖与广西试点的地理参照。',
  },
]

// 监测工作台 — 真实服务状态、最近记录与研究路线
export default function Workspace() {
  useDocumentTitle('监测工作台')
  const apiKey = useAppStore((state) => state.apiKey)
  const mockMode = isMockMode()
  const healthQuery = useApi(() => fetchHealth(), [apiKey])
  const algorithmsQuery = useApi(() => fetchAlgorithms(), [apiKey])
  const recentQuery = useApi(() => fetchAnalyses({ limit: 5, offset: 0 }), [apiKey])

  const health = healthQuery.data
  const algorithms = algorithmsQuery.data ?? []
  const availableCount = algorithms.filter((item) => item.implementation !== 'unavailable').length
  const unavailableCount = algorithms.filter((item) => item.implementation === 'unavailable').length
  const recent = recentQuery.data?.items ?? []
  const latest = recent[0]

  const healthLabel = mockMode
    ? 'Mock 联调'
    : healthQuery.loading && !health
      ? '检查中'
      : healthQuery.error
        ? '不可达'
        : health
          ? health.status === 'ok' ? '在线' : health.status
          : '未知'
  const healthTone = mockMode
    ? styles.toneWarn
    : healthQuery.error
      ? styles.toneDanger
      : health?.status === 'ok'
        ? styles.toneLive
        : styles.toneMuted
  const healthNote = mockMode
    ? '浏览器内响应，不连接真实后端'
    : healthQuery.error
      ? healthQuery.error
      : health
        ? `GET ${getHealthUrl()}`
        : '正在读取 /health'

  const integrityNotice = mockMode
    ? '当前为浏览器内 Mock：请求不离开浏览器，记录仅保留本次会话；结果明确标记 is_mock=true，科学量为 null。'
    : algorithms.some((item) => item.implementation === 'mock') && unavailableCount > 0
      ? `后端 v1 的模拟算法只校验参数并返回 is_mock=true，水体面积等科学量为 null；另有 ${unavailableCount} 个算法未接入，调用返回 501，不会自动降级。`
      : algorithms.some((item) => item.implementation === 'mock')
        ? '后端 v1 的模拟算法只校验参数并返回 is_mock=true，水体面积等科学量为 null，不能作为监测结论。'
        : unavailableCount > 0
          ? `有 ${unavailableCount} 个算法已注册但未接入，调用将返回 501，不会自动降级为模拟算法。`
          : null

  // 同时刷新运行概览与最近记录
  const refreshAll = () => {
    healthQuery.refresh()
    algorithmsQuery.refresh()
    recentQuery.refresh()
  }

  return (
    <div className="page">
      <PageHeader
        title="监测工作台"
        description="对接多时序算法服务 v1：查看服务状态、提交同步分析、检索历史记录。"
        meta={
          <>
            <span>Base URL <code>{getApiBaseUrl()}</code></span>
            <span className="sep">·</span>
            <span>{mockMode ? '浏览器内 Mock' : '真实后端'}</span>
            <span className="sep">·</span>
            <span>API v1</span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={refreshAll}
              disabled={healthQuery.loading || algorithmsQuery.loading || recentQuery.loading}
            >
              <RefreshCw
                size={12}
                className={healthQuery.loading || algorithmsQuery.loading || recentQuery.loading ? 'spin' : undefined}
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

      {integrityNotice && (
        <div className={`callout callout-warning ${styles.notice}`} role="note">
          <Info size={14} aria-hidden="true" />
          <span>
            {integrityNotice}
            <Link to="/api#boundaries" className={styles.noticeLink}>查看实现边界</Link>
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

      <section className={styles.statusStrip} aria-label="运行概览">
        <div className={styles.statusCell}>
          <span className={styles.cellLabel}>服务连接</span>
          <span className={`${styles.cellValue} ${healthTone}`} title={healthNote}>
            <span
              className={`dot ${
                healthQuery.error ? 'offline' : !mockMode && health?.status === 'ok' ? 'live' : ''
              }`}
              aria-hidden="true"
            />
            {healthLabel}
          </span>
          <span className={styles.cellNote} title={healthNote}>{healthNote}</span>
        </div>

        <div className={styles.statusCell}>
          <span className={styles.cellLabel}>算法注册</span>
          <span className={styles.cellValue}>
            {algorithmsQuery.loading && algorithms.length === 0 ? '—' : formatInteger(algorithms.length)}
            <em>个</em>
          </span>
          <span className={styles.cellNote}>
            {algorithmsQuery.error
              ? '注册表读取失败'
              : `${availableCount} 个可执行 · ${unavailableCount} 个未接入`}
          </span>
        </div>

        <div className={styles.statusCell}>
          <span className={styles.cellLabel}>最近分析</span>
          <span className={`${styles.cellValue} ${styles.timeValue}`}>
            {recentQuery.loading && !recentQuery.data
              ? '查询中'
              : latest
                ? formatShortDateTime(latest.created_at)
                : '暂无记录'}
          </span>
          <span className={styles.cellNote}>
            {recentQuery.error
              ? '记录查询失败'
              : latest
                ? `${latest.algorithm_id} · ${latest.input.scenes.length} 景`
                : '创建分析后在此显示最新记录'}
          </span>
        </div>

        <div className={styles.statusCell}>
          <span className={styles.cellLabel}>API 鉴权</span>
          <span className={`${styles.cellValue} ${apiKey ? styles.toneLive : ''}`}>
            <KeyRound size={14} aria-hidden="true" />
            {mockMode ? 'Mock 模式' : apiKey ? '已配置' : '未配置'}
          </span>
          <span className={styles.cellNote}>
            {mockMode ? 'Mock 不需要密钥' : apiKey ? '请求携带 X-API-Key，仅存本地' : '后端启用 API_KEY 时必须配置'}
          </span>
        </div>
      </section>

      <div className={styles.mainGrid}>
        <Panel
          title="最近分析"
          subtitle="最新 5 条 · 倒序"
          icon={<History size={14} aria-hidden="true" />}
          flush
          className={styles.recentPanel}
          tools={
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={recentQuery.refresh}
                disabled={recentQuery.loading}
              >
                <RefreshCw
                  size={12}
                  className={recentQuery.loading ? 'spin' : undefined}
                  aria-hidden="true"
                />
                刷新
              </button>
              <Link to="/analyses" className="btn btn-ghost btn-sm">
                全部记录
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            </>
          }
        >
          {recentQuery.loading && !recentQuery.data ? (
            <div className={styles.loadingWrap}>
              <Loading text="正在查询分析记录" />
            </div>
          ) : recentQuery.error ? (
            <div className={styles.panelError}>
              <div className={`callout callout-danger ${styles.inlineCallout}`} role="alert">
                <TriangleAlert size={14} aria-hidden="true" />
                <span>最近记录查询失败：{recentQuery.error}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={recentQuery.refresh}>
                  重试
                </button>
              </div>
            </div>
          ) : recent.length === 0 ? (
            <div className={styles.emptyWrap}>
              <EmptyState
                compact
                icon={<History size={18} aria-hidden="true" />}
                title="暂无分析记录"
                description="提交第一条多时相分析后，最新记录会显示在这里。"
                hint="GET /api/v1/analyses?limit=5&offset=0"
                action={
                  <Link to="/analyze" className="btn btn-primary btn-sm">
                    <Plus size={12} aria-hidden="true" />
                    新建分析
                  </Link>
                }
              />
            </div>
          ) : (
            <div className={`table-wrap ${recentQuery.loading ? styles.loadingTable : ''}`}>
              <table className={`data-table ${styles.recentTable}`}>
                <thead>
                  <tr>
                    <th>创建时间</th>
                    <th>算法</th>
                    <th className="num">时相</th>
                    <th>结果</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((record) => (
                    <tr key={record.id}>
                      <td className="mono" title={record.created_at}>
                        {formatDateTime(record.created_at)}
                      </td>
                      <td><code className={styles.algorithmCode}>{record.algorithm_id}</code></td>
                      <td className="num">{formatInteger(record.input.scenes.length)}</td>
                      <td>
                        {record.result?.is_mock ? (
                          <span className="badge badge-warning">模拟结果</span>
                        ) : (
                          <span className="badge badge-muted">未标记 is_mock</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/analyses/${record.id}`} className={styles.viewLink}>查看</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="快捷入口" subtitle="Console" flush>
          <div className={styles.moduleList}>
            {MODULES.map(({ to, icon: Icon, title, description }) => (
              <Link key={to} to={to} className={styles.moduleRow}>
                <span className={styles.moduleIcon}>
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className={styles.moduleText}>
                  <span className={styles.moduleTitle}>{title}</span>
                  <span className={styles.moduleDesc}>{description}</span>
                </span>
                <ArrowUpRight size={13} className={styles.moduleArrow} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="研究流水线"
        subtitle="L1 → L6"
        bodyClassName={styles.pipelineBody}
        footer="L1–L6 为研究路线；当前后端 v1 只实现算法注册、同步分析与记录查询，模拟算法不产生科学量。"
      >
        <PipelineRail compact />
      </Panel>
    </div>
  )
}
