import { REGION_LABELS, REGION_ORDER } from '../../config/regions'
import type { Region } from '../../types'
import styles from './RegionTabs.module.css'

interface RegionTabsProps {
  value: Region
  onChange: (region: Region) => void
  regions?: Region[]
  label?: string
}

// 研究区切换 — 使用等宽编号与中文名，保持科研标注习惯
export default function RegionTabs({
  value,
  onChange,
  regions = REGION_ORDER,
  label = '研究区',
}: RegionTabsProps) {
  return (
    <div className={styles.wrapper} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <div className={styles.options}>
        {regions.map((region, index) => (
          <button
            key={region}
            type="button"
            className={`${styles.option} ${value === region ? styles.active : ''}`}
            aria-pressed={value === region}
            onClick={() => onChange(region)}
          >
            <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
            {REGION_LABELS[region]}
          </button>
        ))}
      </div>
    </div>
  )
}
