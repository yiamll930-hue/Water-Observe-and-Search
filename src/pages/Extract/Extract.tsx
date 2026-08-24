import { useState, useCallback } from 'react'
import { Play } from 'lucide-react'
import FileUpload from '../../components/FileUpload/FileUpload'
import SplitPane from '../../components/SplitPane/SplitPane'
import Loading from '../../components/Loading/Loading'
import styles from './Extract.module.css'

export default function Extract() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [satellite, setSatellite] = useState('sentinel-2')
  const [threshold, setThreshold] = useState(50)
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setDone(false)
  }, [])

  const handleExtract = async () => {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setProcessing(false)
    setDone(true)
  }

  return (
    <div className={styles.page}>
      <div className="page-title">
        <h2>水体提取</h2>
        <p>选择影像，运行无监督水体提取模型，查看并下载结果</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <FileUpload onFile={handleFile} accept="image/*,.tif,.tiff" hint="拖拽或点击上传遥感影像" preview={preview} />
        <div className="surface" style={{ padding: 'var(--space-lg)' }}>
          <h4 style={{ marginBottom: 'var(--space-md)' }}>提取参数</h4>
          <div className={styles.params} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.field}>
              <label>传感器</label>
              <select value={satellite} onChange={(e) => setSatellite(e.target.value)}>
                <option value="sentinel-2">Sentinel-2 (10m)</option>
                <option value="landsat-8">Landsat 8 (30m)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>置信度阈值 ({threshold}%)</label>
              <input type="range" min={10} max={90} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
            </div>
          </div>
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleExtract} disabled={!file || processing}>
              {processing ? '提取中...' : <><Play size={14} /> 开始提取</>}
            </button>
          </div>
          {processing && <Loading text="正在运行水体提取模型..." />}
        </div>
      </div>

      {done && (
        <SplitPane
          left={{ title: '原始影像', children: preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <p>—</p> }}
          right={{ title: '水体提取结果', children: <p>数据就绪后展示</p> }}
        />
      )}
    </div>
  )
}
