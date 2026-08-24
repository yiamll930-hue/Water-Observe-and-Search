import { useState, useMemo } from 'react'
import Chart, { echarts } from '../../components/Chart/Chart'
import Loading from '../../components/Loading/Loading'
import EmptyState from '../../components/EmptyState/EmptyState'
import { useApi } from '../../hooks/useApi'
import { fetchTimeSeries } from '../../api/timeseries'
import { fetchMeteoCorrelation } from '../../api/meteo'
import { REGION_LABELS, type Region } from '../../types'
import styles from './TimeSeries.module.css'

const REGIONS: Region[] = ['poyang', 'dongting', 'guangxi']
const COLORS = ['#0ea5e9', '#34d399', '#fbbf24']

export default function TimeSeries() {
  const [selected, setSelected] = useState<Set<Region>>(new Set(['poyang']))
  const [corrRegion, setCorrRegion] = useState<Region>('poyang')

  const toggle = (r: Region) => setSelected((prev) => { const n = new Set(prev); if (n.has(r) && n.size > 1) n.delete(r); else n.add(r); return n })

  const tsResults = REGIONS.map((r) => {
    const enabled = selected.has(r)
    const { data, loading } = useApi(() => fetchTimeSeries(r), [r]) // eslint-disable-line react-hooks/rules-of-hooks
    return { region: r, enabled, data, loading }
  })

  const { data: corrData, loading: corrLoading } = useApi(() => fetchMeteoCorrelation(corrRegion), [corrRegion])

  const anyData = tsResults.some((r) => r.enabled && r.data && r.data.points.length > 0)
  const anyLoading = tsResults.some((r) => r.enabled && r.loading)

  const areaOption: echarts.EChartsCoreOption = useMemo(() => {
    if (!anyData) return { title: { text: '暂无数据', subtext: '接入遥感影像数据源后查看', left: 'center', top: 'center', textStyle: { color: '#64748b', fontSize: 14 }, subtextStyle: { color: '#475569', fontSize: 11 } }, xAxis: { show: false }, yAxis: { show: false }, series: [] }
    const series = tsResults.filter((r) => r.enabled && r.data && r.data.points.length > 0).map((r, i) => ({ name: REGION_LABELS[r.region], type: 'line' as const, data: r.data!.points.map((p) => p.waterArea), smooth: true, symbol: 'circle', symbolSize: 4, lineStyle: { color: COLORS[i], width: 2 }, itemStyle: { color: COLORS[i] } }))
    const xData = tsResults.find((r) => r.data && r.data.points.length > 0)?.data?.points.map((p) => p.date) ?? []
    return { tooltip: { trigger: 'axis' }, legend: { data: series.map((s) => s.name), bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } }, grid: { left: 48, right: 24, top: 12, bottom: 36 }, xAxis: { type: 'category', data: xData, axisLabel: { color: '#64748b', fontSize: 10 } }, yAxis: { type: 'value', name: 'km²', nameTextStyle: { color: '#64748b', fontSize: 10 }, axisLabel: { color: '#64748b', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } } }, series }
  }, [tsResults, anyData])

  const dualOption: echarts.EChartsCoreOption = useMemo(() => {
    if (!corrData || corrData.monthlyData.length === 0) return { title: { text: '暂无气象数据', left: 'center', top: 'center', textStyle: { color: '#64748b', fontSize: 14 } }, xAxis: { show: false }, yAxis: { show: false }, series: [] }
    return { tooltip: { trigger: 'axis' }, legend: { data: ['降雨量','水体面积'], bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 } }, grid: { left: 48, right: 48, top: 12, bottom: 36 }, xAxis: { type: 'category', data: corrData.monthlyData.map((d) => d.month), axisLabel: { color: '#64748b', fontSize: 10 } }, yAxis: [{ type: 'value', name: 'mm', nameTextStyle: { color: '#64748b', fontSize: 10 }, axisLabel: { color: '#64748b', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } } }, { type: 'value', name: 'km²', nameTextStyle: { color: '#64748b', fontSize: 10 }, axisLabel: { color: '#64748b', fontSize: 10 }, splitLine: { show: false } }], series: [{ name: '降雨量', type: 'bar', yAxisIndex: 0, data: corrData.monthlyData.map((d) => d.precipitation), itemStyle: { color: '#0ea5e9', borderRadius: [4,4,0,0] }, barWidth: 18 }, { name: '水体面积', type: 'line', yAxisIndex: 1, data: corrData.monthlyData.map((d) => d.waterArea), smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { color: '#34d399', width: 2 }, itemStyle: { color: '#34d399' } }] }
  }, [corrData])

  return (
    <div className={styles.page}>
      <div className="page-title">
        <h2>时序分析</h2>
        <p>水体面积长时序变化分析，支持多区域叠加对比</p>
      </div>

      <div className={styles.regionChips}>
        {REGIONS.map((r, i) => (
          <button key={r} className={`${styles.chip} ${selected.has(r) ? styles.selected : ''}`} onClick={() => toggle(r)}>
            <span className={styles.chipDot} style={{ background: COLORS[i] }} />{REGION_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="surface" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <h4 style={{ marginBottom: 'var(--space-md)', fontWeight: 600 }}>水体面积时间序列</h4>
        {anyLoading ? <Loading /> : <Chart option={areaOption} height={320} />}
      </div>

      <div className={styles.grid}>
        <div className="surface" style={{ padding: 'var(--space-lg)' }}>
          <h4 style={{ marginBottom: 'var(--space-md)', fontWeight: 600 }}>降雨-水体响应</h4>
          <div className={styles.regionChips} style={{ marginBottom: 'var(--space-md)' }}>
            {REGIONS.map((r) => (
              <button key={r} className={`${styles.chip} ${corrRegion === r ? styles.selected : ''}`} onClick={() => setCorrRegion(r)}>{REGION_LABELS[r]}</button>
            ))}
          </div>
          {corrLoading ? <Loading /> : corrData && corrData.monthlyData.length > 0 ? <><p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>相关系数: {corrData.correlation.toFixed(3)} | 滞后: {corrData.lagDays} 天</p><Chart option={dualOption} height={280} /></> : <EmptyState title="暂无数据" description="接入降雨数据后展示" />}
        </div>

        <div className="surface" style={{ padding: 'var(--space-lg)' }}>
          <h4 style={{ marginBottom: 'var(--space-md)', fontWeight: 600 }}>季度统计</h4>
          <EmptyState title="暂无数据" description="数据就绪后自动汇总" />
        </div>
      </div>
    </div>
  )
}
