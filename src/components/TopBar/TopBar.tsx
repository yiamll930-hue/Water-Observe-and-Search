import { Sun, Moon, Droplets } from 'lucide-react'
import { useAppStore } from '../../store/app'
import styles from './TopBar.module.css'

export default function TopBar() {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <Droplets size={18} />
        <span>WaterWatch</span>
      </div>

      <div className={styles.spacer} />

      <button className={styles.themeBtn} onClick={toggleTheme} title="切换主题">
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </header>
  )
}
