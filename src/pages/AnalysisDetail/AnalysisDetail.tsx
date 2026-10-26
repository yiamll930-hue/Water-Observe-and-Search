import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Copy,
  Plus,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader/PageHeader'
import Panel from '../../components/Panel/Panel'
import Loading from '../../components/Loading/Loading'
import AnalysisResult from '../../components/AnalysisResult/AnalysisResult'
import { useApi } from '../../hooks/useApi'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAppStore } from '../../store/app'
import { fetchAnalysis } from '../../api/analyses'
import { formatDateTime, formatInteger } from '../../utils/format'
import styles from './AnalysisDetail.module.css'

// 分析记录详情 — 展示输入、结果与原始字段
export default function AnalysisDetail() {
  const { id = '' } = useParams()
  const location = useLocation()
  const apiKey = useAppStore((state) => state.apiKey)
  const query = useApi(() => fetchAnalysis(id), [id, apiKey], { enabled: Boolean(id) })
  const record = query.data
  const created = Boolean((location.state as { created?: boolean } | null)?.created)
  const [copied, setCopied] = useState(false)

  useDocumentTitle(record ? '分析记录详情' : '分析记录')

  // 复制成功提示自动复位
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  // 复制记录 UUID
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (query.loading && !record) {
    return (
      <div className="page">
        <PageHeader
          title="分析记录"
          actions={
            <Link to="/analyses" className="btn btn-secondary btn-sm">
              <ArrowLeft size={12} aria-hidden="true" />
              返回记录列表
            </Link>
          }
        />
        <Panel>
          <Loading text="正在读取分析记录" />
        </Panel>
      </div>
    )
  }

  if (query.error || !record) {
    return (
      <div className="page">
        <PageHeader
          title="分析记录"
          description="按 UUID 查询单条同步分析结果。"
          actions={
            <>
              <Link to="/analyses" className="btn btn-secondary btn-sm">
                <ArrowLeft size={12} aria-hidden="true" />
                返回记录列表
              </Link>
              <button type="button" className="btn btn-primary btn-sm" onClick={query.refresh}>
                <RefreshCw size={12} aria-hidden="true" />
                重试
              </button>
            </>
          }
        />
        <div className={`callout callout-danger ${styles.errorCallout}`} role="alert">
          <TriangleAlert size={14} aria-hidden="true" />
          <div>
            <strong>无法读取该分析记录</strong>
            <p>{query.error ?? '记录标识缺失或记录不存在。'}</p>
            <p className={styles.errorHint}>
              记录可能不存在，或当前 API Key 无权访问。若为 401，请用顶栏钥匙按钮配置 X-API-Key。
            </p>
          </div>
        </div>
      </div>
    )
  }

  const scenes = record.input.scenes
  const threshold = record.input.parameters?.threshold ?? 0.5
  const isMock = record.result.is_mock === true

  return (
    <div className="page">
      <PageHeader
        title="分析记录详情"
        description="同步分析返回的完整输入与结果；未计算字段保持 null。"
        meta={
          <>
            <span>ID <code>{record.id}</code></span>
            <span className="sep">·</span>
            <span>创建 {formatDateTime(record.created_at)}</span>
            <span className="sep">·</span>
            <span>{isMock ? '模拟结果' : '未标记模拟'}</span>
          </>
        }
        actions={
          <>
            <Link to="/analyses" className="btn btn-secondary btn-sm">
              <ArrowLeft size={12} aria-hidden="true" />
              返回列表
            </Link>
            <button type="button" className="btn btn-secondary btn-sm" onClick={copyId}>
              {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
              {copied ? '已复制 ID' : '复制 ID'}
            </button>
            <Link to="/analyze" className="btn btn-primary btn-sm">
              <Plus size={12} aria-hidden="true" />
              新建分析
            </Link>
          </>
        }
      />

      {created && (
        <div className={`callout callout-water ${styles.createdNote}`} role="status">
          <Check size={14} aria-hidden="true" />
          分析已同步完成并保存为记录；结果标记为 {isMock ? '模拟（is_mock=true）' : '非模拟'}。
        </div>
      )}

      <AnalysisResult result={record.result} />

      <div className={styles.layout}>
        <Panel
          title="时相输入"
          subtitle={`${scenes.length} 景`}
          flush
        >
          <div className="table-wrap">
            <table className={`data-table ${styles.sceneTable}`}>
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>时相（原始 ISO 8601）</th>
                  <th>本地时间</th>
                  <th>影像 URI</th>
                  <th>格式</th>
                </tr>
              </thead>
              <tbody>
                {scenes.map((scene, index) => (
                  <tr key={`${scene.timestamp}-${index}`}>
                    <td className="num muted">{String(index + 1).padStart(2, '0')}</td>
                    <td><code className={styles.timestamp}>{scene.timestamp}</code></td>
                    <td className={styles.localTime}>{formatDateTime(scene.timestamp)}</td>
                    <td><code className={styles.uri} title={scene.uri}>{scene.uri}</code></td>
                    <td><span className="badge badge-muted">{scene.format}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="请求参数" subtitle="Input">
          <dl className="kv-list">
            <div className="kv-row">
              <dt>algorithm_id</dt>
              <dd><code className={styles.paramCode}>{record.algorithm_id}</code></dd>
            </div>
            <div className="kv-row">
              <dt>threshold</dt>
              <dd className="mono">{threshold.toFixed(2)}</dd>
            </div>
            <div className="kv-row">
              <dt>scenes</dt>
              <dd>{formatInteger(scenes.length)} 景</dd>
            </div>
            <div className="kv-row">
              <dt>format</dt>
              <dd className="mono">geotiff</dd>
            </div>
            <div className="kv-row">
              <dt>status</dt>
              <dd><span className="badge badge-success">{record.status}</span></dd>
            </div>
            <div className="kv-row">
              <dt>result.is_mock</dt>
              <dd className="mono">{String(isMock)}</dd>
            </div>
            <div className="kv-row">
              <dt>created_at</dt>
              <dd>{formatDateTime(record.created_at)}</dd>
            </div>
            <div className="kv-row">
              <dt>id</dt>
              <dd className={styles.idValue}>{record.id}</dd>
            </div>
          </dl>

          <div className={styles.paramActions}>
            <Link to={`/analyze?algorithm=${encodeURIComponent(record.algorithm_id)}`} className="btn btn-secondary btn-sm btn-block">
              以此算法新建分析
            </Link>
            <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={query.refresh}>
              <RefreshCw size={12} aria-hidden="true" />
              重新读取记录
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
