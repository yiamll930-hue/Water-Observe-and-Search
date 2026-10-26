import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { PIPELINE_STAGES } from '../../config/pipeline'
import styles from './PipelineRail.module.css'

interface PipelineRailProps {
  compact?: boolean
  activeCode?: string | null
}

// 六级流水线 — 展示从数据立方体到动态监测的科研流程
export default function PipelineRail({ compact = false, activeCode = null }: PipelineRailProps) {
  return (
    <ol className={`${styles.rail} ${compact ? styles.compact : ''}`} aria-label="六级水体监测流水线">
      {PIPELINE_STAGES.map((stage) => {
        const active = activeCode === stage.code
        return (
          <li key={stage.code} className={`${styles.stage} ${active ? styles.active : ''}`}>
            <div className={styles.marker}>
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.code}>{stage.code}</span>
            </div>
            <div className={styles.content}>
              <Link to={stage.to} className={styles.title}>
                {stage.title}
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
              {!compact && <p className={styles.summary}>{stage.summary}</p>}
              <div className={styles.output}>
                <span className={styles.outputLabel}>输出</span>
                <span>{stage.output}</span>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
