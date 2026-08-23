import styles from './Loading.module.css'

export default function Loading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      <span className={styles.text}>{text}</span>
    </div>
  )
}
