import { useState, useCallback, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import styles from './TimeSlider.module.css'

interface TimeSliderProps {
  labels: string[]          // 时间刻度标签
  current: number           // 当前索引
  onChange: (index: number) => void
  onPlay?: (playing: boolean) => void
}

export default function TimeSlider({
  labels,
  current,
  onChange,
  onPlay,
}: TimeSliderProps) {
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const togglePlay = useCallback(() => {
    if (playing) {
      if (timerRef.current) clearInterval(timerRef.current)
      setPlaying(false)
      onPlay?.(false)
    } else {
      setPlaying(true)
      onPlay?.(true)
      timerRef.current = setInterval(() => {
        onChange((current + 1) % labels.length)
      }, 1200)
    }
  }, [playing, current, labels.length, onChange, onPlay])

  return (
    <div className={styles.wrapper}>
      <div className={styles.slider}>
        <button className={styles.playBtn} onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div className={styles.range}>
          <input
            type="range"
            min={0}
            max={labels.length - 1}
            value={current}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <div className={styles.labels}>
            <span>{labels[0]}</span>
            <span>{labels[labels.length - 1]}</span>
          </div>
        </div>
        <span className={styles.current}>{labels[current]}</span>
      </div>
    </div>
  )
}
