import type { ReactNode } from 'react'
import styles from './SplitPane.module.css'

interface SplitPaneProps {
  left: { title: string; children: ReactNode }
  right: { title: string; children: ReactNode }
}

export default function SplitPane({ left, right }: SplitPaneProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.pane}>
        <div className={styles.paneHeader}>{left.title}</div>
        <div className={styles.paneBody}>{left.children}</div>
      </div>
      <div className={styles.pane}>
        <div className={styles.paneHeader}>{right.title}</div>
        <div className={styles.paneBody}>{right.children}</div>
      </div>
    </div>
  )
}
