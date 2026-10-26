import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, History, Route } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import styles from './NotFound.module.css'

// 404 页面 — 给出请求路径与可用研究入口
export default function NotFound() {
  useDocumentTitle('页面不存在')
  const { pathname } = useLocation()

  return (
    <div className="page">
      <div className={styles.card}>
        <aside className={styles.codePanel} aria-hidden="true">
          <span className={styles.protocol}>HTTP / 404</span>
          <strong className={styles.code}>404</strong>
          <span className={styles.codeNote}>RESOURCE NOT FOUND</span>
        </aside>

        <div className={styles.body}>
          <span className={styles.eyebrow}>
            <Route size={12} aria-hidden="true" />
            导航诊断
          </span>
          <h1>该路径不在当前 v1 前端中</h1>
          <p>
            该路径没有对应页面。旧版时序、洪涝、提取、评估与任务页没有 v1 接口支撑，已从导航中移除。
          </p>

          <div className={styles.request}>
            <span>请求路径</span>
            <code>{pathname}</code>
          </div>

          <div className={styles.actions}>
            <Link to="/" className="btn btn-primary btn-sm">
              <ArrowLeft size={12} aria-hidden="true" />
              返回监测工作台
            </Link>
            <Link to="/analyses" className="btn btn-secondary btn-sm">
              <History size={12} aria-hidden="true" />
              分析记录
            </Link>
            <Link to="/api" className="btn btn-ghost btn-sm">
              API 文档
            </Link>
          </div>
        </div>
      </div>

      <p className={styles.footNote}>
        旧入口 <code>/extract</code> 与 <code>/tasks</code> 已分别重定向至
        <code>/analyze</code> 与 <code>/analyses</code>；其余无接口支撑的页面不再提供。
        如为预期资源，请检查前端路由与 <code>/api/v1</code> 契约。
      </p>
    </div>
  )
}
