import type { ReactNode } from 'react'
import styles from './StatCard.module.css'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  change?: number
  changeLabel?: string
  icon: ReactNode
  color: 'water' | 'success' | 'danger' | 'primary'
  footer?: string
}

export default function StatCard({
  label,
  value,
  unit,
  change,
  changeLabel,
  icon,
  color,
  footer,
}: StatCardProps) {
  const changeClass =
    change === undefined
      ? styles.neutral
      : change > 0
        ? styles.up
        : styles.down

  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.icon} ${styles[color]}`}>{icon}</span>
      </div>
      <div className={styles.value}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {change !== undefined && (
        <div className={`${styles.change} ${changeClass}`}>
          <span className={styles.arrow}>{change > 0 ? '↑' : change < 0 ? '↓' : '→'}</span>
          {Math.abs(change).toFixed(1)}%
          {changeLabel && <span> {changeLabel}</span>}
        </div>
      )}
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}
