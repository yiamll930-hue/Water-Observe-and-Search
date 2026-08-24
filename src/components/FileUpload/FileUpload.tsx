import { useState, useRef, useCallback } from 'react'
import { Upload } from 'lucide-react'
import styles from './FileUpload.module.css'

interface FileUploadProps {
  onFile: (file: File) => void
  accept?: string
  hint?: string
  preview?: string | null
}

export default function FileUpload({
  onFile,
  accept = 'image/*,.tif,.tiff,.geotiff',
  hint = '拖拽文件到此处，或点击上传',
  preview,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  return (
    <div
      className={`${styles.wrapper} ${dragging ? styles.dragging : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      {preview ? (
        <div className={styles.preview}>
          <img src={preview} alt="预览" />
        </div>
      ) : (
        <>
          <div className={styles.icon}>
            <Upload size={36} />
          </div>
          <div className={styles.title}>上传影像</div>
          <div className={styles.hint}>{hint}</div>
        </>
      )}
    </div>
  )
}
