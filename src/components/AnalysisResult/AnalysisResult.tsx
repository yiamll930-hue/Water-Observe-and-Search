import { useEffect, useState } from 'react'
import { Check, Copy, TriangleAlert } from 'lucide-react'
import Panel from '../Panel/Panel'
import type { AnalysisResult as AnalysisResultData } from '../../types'
import { formatDateTime, formatInteger, formatNumber } from '../../utils/format'
import styles from './AnalysisResult.module.css'

interface AnalysisResultProps {
  result: AnalysisResultData
}

// 分析结果面板 — 明确展示模拟标记、空科学量与原始 JSON
export default function AnalysisResult({ result }: AnalysisResultProps) {
  const [copied, setCopied] = useState(false)
  const isMock = result.is_mock === true // 只有后端明确标记才视为模拟
  const artifactsCount = Array.isArray(result.artifacts) ? result.artifacts.length : null
  const timestamps = Array.isArray(result.timestamps)
    ? result.timestamps.filter((item): item is string => typeof item === 'string')
    : []

  const metrics = [
    { label: '水体面积', value: result.water_area_km2, unit: 'km²' },
    { label: '扩张面积', value: result.expansion_km2, unit: 'km²' },
    { label: '萎缩面积', value: result.shrinkage_km2, unit: 'km²' },
    { label: '结果产物', value: artifactsCount, unit: '项' },
  ]

  // 清空复制提示
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  // 复制完整 result JSON
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Panel
      title="分析结果"
      subtitle={isMock ? 'MOCK' : undefined}
      tools={
        <button type="button" className="btn btn-ghost btn-sm" onClick={copyJson}>
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
          {copied ? '已复制' : '复制 JSON'}
        </button>
      }
    >
      {isMock ? (
        <div className={`callout callout-warning ${styles.mockNote}`} role="note">
          <TriangleAlert size={14} aria-hidden="true" />
          <div>
            <strong>模拟结果，不可作为科学结论。</strong>
            <p>{result.message ?? '后端标记 is_mock=true，未执行真实影像处理或模型推理。'}</p>
          </div>
        </div>
      ) : (
        <div className={styles.resultNote}>
          结果由后端返回；未计算的科学量以 <code>null</code> 表示，界面不作填充。
        </div>
      )}

      <div className={styles.metricStrip}>
        {metrics.map((metric) => {
          const hasValue = typeof metric.value === 'number' && Number.isFinite(metric.value)
          return (
            <div key={metric.label} className={styles.metric}>
              <span className={styles.metricLabel}>{metric.label}</span>
              {hasValue ? (
                <span className={styles.metricValue}>
                  {metric.unit === '项' ? formatInteger(metric.value) : formatNumber(metric.value, 2)}
                  <em>{metric.unit}</em>
                </span>
              ) : (
                <span className={styles.metricValue}>
                  —
                  <em>{metric.label === '结果产物' ? '不可用' : '未计算'}</em>
                </span>
              )}
            </div>
          )
        })}
      </div>

      <dl className={`kv-list ${styles.meta}`}>
        <div className="kv-row">
          <dt>是否模拟</dt>
          <dd>{isMock ? 'true' : result.is_mock === false ? 'false' : '—'}</dd>
        </div>
        <div className="kv-row">
          <dt>时相数量</dt>
          <dd>{formatInteger(result.scene_count)}</dd>
        </div>
        <div className="kv-row">
          <dt>结果产物</dt>
          <dd>{artifactsCount === null ? '—' : `${formatInteger(artifactsCount)} 项`}</dd>
        </div>
      </dl>

      {timestamps.length > 0 && (
        <section className={styles.timeSection} aria-labelledby="result-timestamps">
          <h3 id="result-timestamps" className={styles.subTitle}>
            结果时相 <span>{timestamps.length}</span>
          </h3>
          <div className={styles.timestamps}>
            {timestamps.map((timestamp, index) => (
              <code key={`${timestamp}-${index}`} className={styles.timestamp} title={timestamp}>
                {formatDateTime(timestamp)}
                <span>{timestamp}</span>
              </code>
            ))}
          </div>
        </section>
      )}

      <details className={styles.raw}>
        <summary>
          原始 result JSON
          <span>{Object.keys(result).length} 个字段</span>
        </summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </Panel>
  )
}
