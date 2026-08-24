import { useState, useMemo } from 'react'
import MapView from '../../components/MapView/MapView'
import TimeSlider from '../../components/TimeSlider/TimeSlider'
import { REGION_LABELS, type Region } from '../../types'
import styles from './Map.module.css'

const REGIONS: Region[] = ['poyang', 'dongting', 'guangxi']
const REGION_CENTERS: Record<Region, [number, number]> = {
  poyang: [29.05, 116.15],
  dongting: [29.32, 112.85],
  guangxi: [24.02, 108.15],
}
const MONTHS = ['2024-01','2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12']

export default function MapPage() {
  const [activeRegion, setActiveRegion] = useState<Region>('poyang')
  const [monthIndex, setMonthIndex] = useState(6)
  const [clickedPos, setClickedPos] = useState<[number, number] | null>(null)

  const center = useMemo(() => REGION_CENTERS[activeRegion], [activeRegion])

  return (
    <div className={styles.page}>
      <div>
        <h2 style={{ marginBottom: 2, fontWeight: 650 }}>地图浏览</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>查看水体分布与时空变化</p>
      </div>

      <div className={styles.controls}>
        {REGIONS.map((r) => (
          <button key={r} className={`${styles.regionBtn} ${activeRegion === r ? styles.active : ''}`} onClick={() => setActiveRegion(r)}>
            {REGION_LABELS[r]}
          </button>
        ))}
        {clickedPos && <span className={styles.coordHint}>{clickedPos[0].toFixed(4)}°, {clickedPos[1].toFixed(4)}°</span>}
      </div>

      <div className={styles.mapSection}>
        <MapView showLayerPanel center={center} onMapClick={setClickedPos} />
      </div>

      <TimeSlider labels={MONTHS} current={monthIndex} onChange={setMonthIndex} />
    </div>
  )
}
