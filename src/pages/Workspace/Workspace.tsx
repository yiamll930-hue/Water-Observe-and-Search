import { Link } from 'react-router-dom'
import { Droplets, Map as MapIcon, TrendingUp, Layers, ListTodo } from 'lucide-react'
import StatCard from '../../components/StatCard/StatCard'
import EmptyState from '../../components/EmptyState/EmptyState'
import { useAppStore } from '../../store/app'
import { REGION_LABELS, type Region } from '../../types'
import styles from './Workspace.module.css'

const REGIONS: Region[] = ['poyang', 'dongting', 'guangxi']

const QUICK_ACTIONS = [
  { to: '/extract', icon: Droplets, title: '水体提取', desc: '运行无监督水体提取模型' },
  { to: '/map', icon: MapIcon, title: '地图浏览', desc: '查看水体分布与时空变化' },
  { to: '/timeseries', icon: TrendingUp, title: '时序分析', desc: '水体面积趋势与气象关联分析' },
]

export default function Workspace() {
  const currentRegion = useAppStore((s) => s.currentRegion)
  const setRegion = useAppStore((s) => s.setRegion)

  return (
    <div className={styles.page}>
      <div className="page-title">
        <h2>工作台</h2>
        <p>WaterWatch 遥感数据处理平台</p>
      </div>

      {/* 区域切换 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-xl)' }}>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            style={{
              padding: '5px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12.5, fontWeight: currentRegion === r ? 650 : 450,
              color: currentRegion === r ? 'var(--color-accent-light)' : 'var(--color-text-secondary)',
              background: currentRegion === r ? 'var(--color-accent-bg)' : 'var(--color-surface)',
              border: `1px solid ${currentRegion === r ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
              transition: 'all var(--transition-fast)',
            }}
          >
            {REGION_LABELS[r]}
          </button>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}><span className={styles.sectionTitle}>快捷操作</span></div>
        <div className={styles.quickActions}>
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className={styles.actionCard}>
              <div className={styles.actionIcon}><a.icon size={20} /></div>
              <div>
                <div className={styles.actionTitle}>{a.title}</div>
                <div className={styles.actionDesc}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}><span className={styles.sectionTitle}>数据概览</span></div>
        <div className={styles.stats}>
          <StatCard label="影像总数" value="—" icon={<Layers size={16} />} color="primary" footer="暂无数据" />
          <StatCard label="水体面积" value="—" unit="km²" icon={<Droplets size={16} />} color="water" footer="暂无数据" />
          <StatCard label="活跃预警" value="—" unit="条" icon={<TrendingUp size={16} />} color="danger" footer="—" />
          <StatCard label="处理任务" value="—" unit="项" icon={<ListTodo size={16} />} color="primary" footer="暂无数据" />
        </div>
      </div>

      {/* 最近任务 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>最近任务</span>
          <Link to="/tasks" style={{ fontSize: 12.5, color: 'var(--color-accent)' }}>查看全部 →</Link>
        </div>
        <div className="surface" style={{ overflow: 'hidden' }}>
          <EmptyState icon={<ListTodo size={28} />} title="暂无任务" description="拼接或提取任务完成后将显示在此处" />
        </div>
      </div>
    </div>
  )
}
