import { Link, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader/PageHeader'
import Panel from '../../components/Panel/Panel'
import Loading from '../../components/Loading/Loading'
import EmptyState from '../../components/EmptyState/EmptyState'
import { useApi } from '../../hooks/useApi'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAppStore } from '../../store/app'
import { fetchAnalyses } from '../../api/analyses'
import { getApiBaseUrl, isMockMode } from '../../api/client'
import { formatSceneRange } from '../../utils/analysis'
import { formatDateTime, formatInteger } from '../../utils/format'
import styles from './Analyses.module.css'

const PAGE_SIZES = [10, 20, 50, 100] // 与后端 limit 1–100 对齐

// 解析分页参数，非法值回退到默认
function parsePaging(searchParams: URLSearchParams): { limit: number; offset: number } {
  const requestedLimit = Number(searchParams.get('limit'))
  const limit = PAGE_SIZES.includes(requestedLimit) ? requestedLimit : 20
  const requestedOffset = Number(searchParams.get('offset'))
  const offset = Number.isInteger(requestedOffset) && requestedOffset >= 0 ? requestedOffset : 0
  return { limit, offset }
}

// 分析记录 — 按创建时间倒序分页查询，后端不返回总数
export default function Analyses() {
  useDocumentTitle('分析记录')
  const [searchParams, setSearchParams] = useSearchParams()
  const { limit, offset } = parsePaging(searchParams)
  const apiKey = useAppStore((state) => state.apiKey)
  const query = useApi(() => fetchAnalyses({ limit, offset }), [limit, offset, apiKey])
  const data = query.data
  const items = data?.items ?? []
  const hasNext = Boolean(data && items.length >= limit) // 无 total，只能按当前页是否满额判断

  // 更新分页查询参数
  const goToPage = (nextLimit: number, nextOffset: number) => {
    setSearchParams(
      { limit: String(nextLimit), offset: String(nextOffset) },
      { replace: true }
    )
  }

  const start = data && items.length > 0 ? data.offset + 1 : offset + 1
  const end = data ? data.offset + items.length : offset

  return (
    <div className="page">
      <PageHeader
        title="分析记录"
        description="查询 v1 服务保存的同步分析记录，最新创建在前。"
        meta={
          <>
            <span>Base URL <code>{getApiBaseUrl()}</code></span>
            <span className="sep">·</span>
            <span>{isMockMode() ? '浏览器内 Mock' : '真实后端'}</span>
            <span className="sep">·</span>
            <span>limit / offset 分页 · 无 total</span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={query.refresh}
              disabled={query.loading}
            >
              <RefreshCw size={12} className={query.loading ? 'spin' : undefined} aria-hidden="true" />
              刷新
            </button>
            <Link to="/analyze" className="btn btn-primary btn-sm">
              <Plus size={12} aria-hidden="true" />
              新建分析
            </Link>
          </>
        }
      />

      {query.error && (
        <div className={`callout callout-danger ${styles.inlineCallout}`} role="alert">
          <TriangleAlert size={14} aria-hidden="true" />
          <span>分析记录查询失败：{query.error}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={query.refresh}>
            重试
          </button>
          <span className={styles.errorHint}>若为 401，请用顶栏钥匙按钮配置 X-API-Key。</span>
        </div>
      )}

      <Panel
        title="记录列表"
        subtitle={data ? `当前页 ${items.length} 条` : undefined}
        icon={<ClipboardList size={14} aria-hidden="true" />}
        flush
        tools={
          <label className={styles.limitLabel}>
            每页
            <select
              className={styles.limitSelect}
              value={limit}
              onChange={(event) => goToPage(Number(event.target.value), 0)}
              disabled={query.loading}
              aria-label="每页记录数"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            条
          </label>
        }
        footer={
          <div className={styles.pagination}>
            <span className={styles.pageState}>
              {items.length > 0
                ? `第 ${start}–${end} 条 · offset ${data?.offset ?? offset}`
                : '当前页无记录'}
              <span className={styles.noTotal}>后端不返回 total，下一页以本页是否满额为界</span>
            </span>
            <div className={styles.pagerButtons}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => goToPage(limit, Math.max(0, offset - limit))}
                disabled={offset === 0 || query.loading}
              >
                <ChevronLeft size={13} aria-hidden="true" />
                上一页
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => goToPage(limit, offset + limit)}
                disabled={!hasNext || query.loading}
              >
                下一页
                <ChevronRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        }
      >
        {query.loading && !data ? (
          <div className={styles.loadingWrap}>
            <Loading text="正在查询分析记录" />
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon={<ClipboardList size={22} aria-hidden="true" />}
              title={offset > 0 ? '当前页没有记录' : '还没有分析记录'}
              description={
                offset > 0
                  ? 'offset 可能已超出记录范围，请返回第一页重新查询。'
                  : '创建一条多时相分析后，记录会按创建时间倒序出现在这里。'
              }
              hint="GET /api/v1/analyses?limit=20&offset=0"
              action={
                offset > 0 ? (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => goToPage(limit, 0)}>
                    返回第一页
                  </button>
                ) : (
                  <Link to="/analyze" className="btn btn-primary btn-sm">
                    <Plus size={12} aria-hidden="true" />
                    新建分析
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className={`table-wrap ${query.loading ? styles.loadingTable : ''}`}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>创建时间</th>
                  <th>算法</th>
                  <th className="num">时相</th>
                  <th>时间范围</th>
                  <th>结果</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((record) => (
                  <tr key={record.id}>
                    <td className="mono" title={record.created_at}>
                      {formatDateTime(record.created_at)}
                      <span className={styles.recordId}>{record.id.slice(0, 8)}…</span>
                    </td>
                    <td>
                      <code className={styles.algorithmId}>{record.algorithm_id}</code>
                    </td>
                    <td className="num">{formatInteger(record.input.scenes.length)}</td>
                    <td className={styles.colRange}>
                      {formatSceneRange(record.input.scenes)}
                    </td>
                    <td>
                      {record.result?.is_mock ? (
                        <span className="badge badge-warning">模拟结果</span>
                      ) : (
                        <span className="badge badge-muted">未标记 is_mock</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/analyses/${record.id}`} className={styles.viewLink}>
                        查看记录
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
