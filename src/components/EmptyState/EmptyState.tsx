import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  description?: string
  hint?: string
  action?: ReactNode
  compact?: boolean
}

// 空态占位 — 说明缺少什么数据、由哪个接口提供，避免只有「暂无数据」
export default function EmptyState({
  icon,
  title = '暂无数据',
  description,
  hint,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`} role="status">
      <div className={styles.icon}>{icon ?? <Inbox size={compact ? 18 : 22} />}</div>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {hint && <code className={styles.hint}>{hint}</code>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
