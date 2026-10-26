import { ArrowDownUp, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { SceneDraft } from '../../types'
import type { SceneIssue } from '../../utils/analysis'
import { MAX_SCENES, MIN_SCENES } from '../../utils/analysis'
import styles from './SceneEditor.module.css'

interface SceneEditorProps {
  scenes: SceneDraft[]
  onChange: (scenes: SceneDraft[]) => void
  issues?: Record<string, SceneIssue>
  disabled?: boolean
}

// 生成前端行标识 — 不提交后端
function createDraftId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `scene-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// 创建空时相行
export function createEmptyScene(): SceneDraft {
  return { id: createDraftId(), timestamp: '', uri: '' }
}

// 示例输入 — 仅演示请求结构，不代表真实影像
export function createExampleScenes(): SceneDraft[] {
  return [
    { id: createDraftId(), timestamp: '2024-01-24T00:00', uri: 's3://images/dry.tif' },
    { id: createDraftId(), timestamp: '2024-07-24T00:00', uri: 's3://images/wet.tif' },
  ]
}

// 读取本地时间值，空值或非法值排在末尾
function timestampValue(scene: SceneDraft): number {
  const time = new Date(scene.timestamp).getTime()
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

// 时相编辑器 — 录入时间与资源地址，保持 2–100 景与严格递增
export default function SceneEditor({
  scenes,
  onChange,
  issues = {},
  disabled = false,
}: SceneEditorProps) {
  // 更新指定行的字段
  const updateScene = (id: string, patch: Partial<Pick<SceneDraft, 'timestamp' | 'uri'>>) => {
    onChange(scenes.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)))
  }

  // 追加一个空时相
  const addScene = () => {
    if (scenes.length >= MAX_SCENES) return
    onChange([...scenes, createEmptyScene()])
  }

  // 删除时相 — 至少保留 2 景
  const removeScene = (id: string) => {
    if (scenes.length <= MIN_SCENES) return
    onChange(scenes.filter((scene) => scene.id !== id))
  }

  // 按本地时间升序排序，非法时间保持在末尾
  const sortScenes = () => {
    onChange([...scenes].sort((a, b) => timestampValue(a) - timestampValue(b)))
  }

  // 载入与 README 一致的示例结构
  const loadExample = () => {
    onChange(createExampleScenes())
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.counts}>
          <span className={styles.count}>{scenes.length} / {MAX_SCENES} 景</span>
          <span className={styles.rangeHint}>至少 {MIN_SCENES} 景 · 按时间严格递增</span>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={loadExample}
            disabled={disabled}
            title="填入 README 示例，仅演示结构"
          >
            <Sparkles size={12} aria-hidden="true" />
            示例输入
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={sortScenes} disabled={disabled}>
            <ArrowDownUp size={12} aria-hidden="true" />
            按时间排序
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={addScene}
            disabled={disabled || scenes.length >= MAX_SCENES}
          >
            <Plus size={12} aria-hidden="true" />
            添加时相
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {scenes.map((scene, index) => {
          const issue = issues[scene.id]
          const timeErrorId = `${scene.id}-time-error`
          const uriErrorId = `${scene.id}-uri-error`

          return (
            <div key={scene.id} className={`${styles.row} ${issue ? styles.rowInvalid : ''}`}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className={`${styles.field} ${styles.timeField}`}>
                <label htmlFor={`${scene.id}-time`}>时相时间（本地）</label>
                <input
                  id={`${scene.id}-time`}
                  type="datetime-local"
                  className={`input ${styles.input} ${issue?.timestamp ? styles.invalid : ''}`}
                  value={scene.timestamp}
                  onChange={(event) => updateScene(scene.id, { timestamp: event.target.value })}
                  disabled={disabled}
                  aria-invalid={Boolean(issue?.timestamp)}
                  aria-describedby={issue?.timestamp ? timeErrorId : undefined}
                />
                {issue?.timestamp && (
                  <span id={timeErrorId} className={styles.error}>{issue.timestamp}</span>
                )}
              </div>

              <div className={`${styles.field} ${styles.uriField}`}>
                <label htmlFor={`${scene.id}-uri`}>影像 URI</label>
                <input
                  id={`${scene.id}-uri`}
                  type="text"
                  inputMode="url"
                  className={`input ${styles.input} ${styles.uriInput} ${issue?.uri ? styles.invalid : ''}`}
                  value={scene.uri}
                  onChange={(event) => updateScene(scene.id, { uri: event.target.value })}
                  placeholder="https://… / s3://… / gs://…"
                  disabled={disabled}
                  spellCheck={false}
                  aria-invalid={Boolean(issue?.uri)}
                  aria-describedby={issue?.uri ? uriErrorId : undefined}
                />
                {issue?.uri && (
                  <span id={uriErrorId} className={styles.error}>{issue.uri}</span>
                )}
              </div>

              <span className={`badge badge-muted ${styles.format}`}>GeoTIFF</span>

              <button
                type="button"
                className={`icon-btn ${styles.remove}`}
                onClick={() => removeScene(scene.id)}
                disabled={disabled || scenes.length <= MIN_SCENES}
                title={scenes.length <= MIN_SCENES ? '至少保留 2 景' : '删除该时相'}
                aria-label={`删除第 ${index + 1} 个时相`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

      <p className={styles.note}>
        时间按浏览器本地时区录入，提交时转换为带 <code>Z</code> 的 UTC ISO 8601。
        URI 仅作为资源引用提交，后端不上传、不下载，也不验证文件是否存在；
        当前格式固定为 <code>geotiff</code>。
      </p>
    </div>
  )
}
