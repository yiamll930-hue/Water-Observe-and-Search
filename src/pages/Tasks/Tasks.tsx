import { useState, useMemo } from 'react'
import { Layers } from 'lucide-react'
import TaskTable, { type TaskRow } from '../../components/TaskTable/TaskTable'
import EmptyState from '../../components/EmptyState/EmptyState'
import { type TaskStatus } from '../../types'
import styles from './Tasks.module.css'

// 任务数据 — 暂无真实数据源
const ALL_TASKS: TaskRow[] = []
const STATUSES: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'running', label: '运行中' },
  { key: 'pending', label: '等待中' },
  { key: 'done', label: '已完成' },
  { key: 'fail', label: '失败' },
]
const TYPES: { key: TaskRow['type'] | 'all'; label: string }[] = [
  { key: 'all', label: '全部类型' },
  { key: 'extract', label: '提取' },
]

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<TaskRow['type'] | 'all'>('all')

  const filtered = useMemo(() => {
    return ALL_TASKS.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      return true
    })
  }, [statusFilter, typeFilter])

  return (
    <div className={styles.page}>
      <div className="page-title">
        <h2>任务管理</h2>
        <p>查看与管理水体提取任务</p>
      </div>

      {/* 筛选栏 */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>状态</span>
          <div className={styles.chips}>
            {STATUSES.map((s) => (
              <button
                key={s.key}
                className={`${styles.chip} ${statusFilter === s.key ? styles.chipActive : ''}`}
                onClick={() => setStatusFilter(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>类型</span>
          <div className={styles.chips}>
            {TYPES.map((t) => (
              <button
                key={t.key}
                className={`${styles.chip} ${typeFilter === t.key ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 任务表格 */}
      <div className="surface" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState icon={<Layers size={28} />} title="没有匹配的任务" />
        ) : (
          <TaskTable tasks={filtered} />
        )}
      </div>
    </div>
  )
}
