import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, KeyRound, Moon, Sun } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { fetchHealth } from '../../api/system'
import { getHealthUrl, isMockMode } from '../../api/client'
import { useAppStore } from '../../store/app'
import ApiKeyForm from '../ApiKeyForm/ApiKeyForm'
import styles from './TopBar.module.css'

type StatusTone = 'pending' | 'live' | 'mock' | 'warn'

// 顶栏 — 品牌、服务状态、API 密钥入口与主题切换
export default function TopBar() {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const apiKey = useAppStore((s) => s.apiKey)
  const mockMode = isMockMode()
  const keyDetailsRef = useRef<HTMLDetailsElement>(null)
  const healthQuery = useApi(() => fetchHealth(), [apiKey])
  const { data: health, loading, error, refresh } = healthQuery

  // 每分钟刷新健康状态
  useEffect(() => {
    const timer = window.setInterval(refresh, 60_000) // 后台静默刷新
    return () => window.clearInterval(timer)
  }, [refresh])

  // 点击密钥浮层外部或按 Esc 时关闭
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const details = keyDetailsRef.current
      if (details?.open && !details.contains(event.target as Node)) details.open = false
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && keyDetailsRef.current?.open) keyDetailsRef.current.open = false
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  let label = '检查服务'
  let tone: StatusTone = 'pending'
  let title = `正在检查 GET ${getHealthUrl()}`

  if (mockMode) {
    label = 'Mock 联调'
    tone = 'mock'
    title = '浏览器内 Mock 模式：不连接真实后端，结果仅为契约联调数据。点击查看算法服务。'
  } else if (error) {
    label = '服务不可达'
    tone = 'warn'
    title = `${getHealthUrl()} 查询失败：${error}`
  } else if (health) {
    if (health.status === 'ok') {
      label = '服务在线'
      tone = 'live'
      title = `GET ${getHealthUrl()} 正常${apiKey ? ' · 请求将携带 X-API-Key' : ' · 未配置 API Key'}`
    } else {
      label = `服务 ${health.status}`
      tone = 'warn'
      title = `健康检查返回状态 ${health.status}`
    }
  } else if (!loading) {
    label = '状态未知'
    tone = 'warn'
    title = '未获得健康检查结果，点击查看算法服务。'
  }

  const toneClass =
    tone === 'live'
      ? styles.live
      : tone === 'mock'
        ? styles.mock
        : tone === 'warn'
          ? styles.warn
          : styles.pending
  const dotClass = tone === 'live' ? 'dot live' : tone === 'pending' ? 'dot' : 'dot offline'

  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.brand} aria-label="WaterWatch 多时相分析工作台">
        <span className={styles.brandMark}>
          <Droplets size={15} aria-hidden="true" />
        </span>
        <span className={styles.brandText}>
          <strong>WaterWatch</strong>
          <span className={styles.brandSub}>多时相水体遥感监测</span>
        </span>
      </Link>

      <div className={styles.spacer} />

      <Link
        to="/algorithms"
        className={`${styles.statusPill} ${toneClass}`}
        title={title}
        aria-live="polite"
        aria-label={`${label}，查看算法服务与连接状态`}
      >
        <span className={dotClass} aria-hidden="true" />
        <span>{label}</span>
      </Link>

      <span className={styles.apiVersion} title="多时序算法服务 v1">API v1</span>

      <details ref={keyDetailsRef} className={styles.keyDetails}>
        <summary
          className={`${styles.keyBtn} ${apiKey ? styles.keyConfigured : ''}`}
          title={apiKey ? 'API Key 已配置，点击修改' : '配置 X-API-Key'}
        >
          <KeyRound size={15} aria-hidden="true" />
          <span className="sr-only">API 密钥设置</span>
          {apiKey && <span className={styles.keyDot} aria-hidden="true" />}
        </summary>
        <div className={styles.keyPopover}>
          <div className={styles.keyPopoverHead}>
            <span>请求鉴权</span>
            <code>X-API-Key</code>
          </div>
          <ApiKeyForm
            compact
            onSaved={() => {
              if (keyDetailsRef.current) keyDetailsRef.current.open = false
            }}
          />
        </div>
      </details>

      <button
        type="button"
        className={styles.themeBtn}
        onClick={toggleTheme}
        title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
        aria-label={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </header>
  )
}
