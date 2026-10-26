import { useEffect, useState, type FormEvent } from 'react'
import { Check, KeyRound, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/app'
import styles from './ApiKeyForm.module.css'

interface ApiKeyFormProps {
  compact?: boolean
  onSaved?: () => void
}

// API 密钥表单 — 保存到浏览器本地，并在后续请求中携带 X-API-Key
export default function ApiKeyForm({ compact = false, onSaved }: ApiKeyFormProps) {
  const apiKey = useAppStore((state) => state.apiKey)
  const setApiKey = useAppStore((state) => state.setApiKey)
  const [draft, setDraft] = useState(apiKey)
  const [saved, setSaved] = useState(false)

  // 外部密钥变化时同步输入框
  useEffect(() => {
    setDraft(apiKey)
    setSaved(false)
  }, [apiKey])

  // 保存成功提示自动复位
  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(false), 1800) // 提示保持 1.8 秒
    return () => window.clearTimeout(timer)
  }, [saved])

  // 提交表单 — 空白值等同于清除密钥
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApiKey(draft)
    setSaved(true)
    onSaved?.()
  }

  // 清除本地保存的密钥
  const handleClear = () => {
    setApiKey('')
    setDraft('')
    setSaved(false)
  }

  return (
    <form className={`${styles.form} ${compact ? styles.compact : ''}`} onSubmit={handleSubmit}>
      <div className={styles.statusRow}>
        <span className={styles.statusLabel}>
          <KeyRound size={12} aria-hidden="true" />
          X-API-Key
        </span>
        <span className={`${styles.state} ${apiKey ? styles.configured : ''}`}>
          {apiKey ? '已配置' : '未配置'}
        </span>
      </div>

      <div className={styles.inputRow}>
        <input
          type="password"
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="粘贴团队 API Key"
          aria-label="API 密钥"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="btn btn-secondary btn-sm">
          保存
        </button>
      </div>

      <div className={styles.footer}>
        <span className={styles.hint}>
          仅保存在本机浏览器；后端设置 API_KEY 后，业务请求必须携带此密钥。
        </span>
        {apiKey && (
          <button type="button" className={styles.clear} onClick={handleClear}>
            <Trash2 size={11} aria-hidden="true" />
            清除
          </button>
        )}
      </div>

      {saved && (
        <span className={styles.saved} role="status">
          <Check size={11} aria-hidden="true" />
          已保存并用于后续请求
        </span>
      )}
    </form>
  )
}
