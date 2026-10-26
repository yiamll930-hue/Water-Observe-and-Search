import { useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  History,
  Info,
  LayoutDashboard,
  Map,
  PlayCircle,
} from 'lucide-react'
import TopBar from '../TopBar/TopBar'
import { useAppStore } from '../../store/app'
import styles from './Layout.module.css'

const NAV_GROUPS = [
  {
    label: '总览',
    items: [
      { to: '/', icon: LayoutDashboard, label: '监测工作台', shortLabel: '工作台', end: true },
    ],
  },
  {
    label: '多时相分析',
    items: [
      { to: '/analyze', icon: PlayCircle, label: '新建分析', shortLabel: '新建', end: false },
      { to: '/analyses', icon: History, label: '分析记录', shortLabel: '记录', end: false },
      { to: '/algorithms', icon: Cpu, label: '算法服务', shortLabel: '算法', end: false },
    ],
  },
  {
    label: '地理参照',
    items: [
      { to: '/map', icon: Map, label: '研究区地图', shortLabel: '地图', end: false },
    ],
  },
  {
    label: '资料',
    items: [
      { to: '/api', icon: Code2, label: 'API 文档', shortLabel: 'API', end: false },
      { to: '/about', icon: Info, label: '项目简介', shortLabel: '简介', end: false },
    ],
  },
]

// 应用布局 — 固定顶栏、分组导航与内容区
export default function Layout() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggle = useAppStore((s) => s.toggleSidebar)
  const { pathname } = useLocation()

  // 切换页面后回到顶部，避免沿用上一页滚动位置
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className={styles.layout}>
      <a href="#main-content" className="skip-link">跳到主要内容</a>
      <TopBar />
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
        aria-label="主导航"
      >
        <nav className={styles.nav}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              <div className={styles.navSection}>{group.label}</div>
              {group.items.map(({ to, icon: Icon, label, shortLabel, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={label}
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span className={styles.navLabel}>
                    <span className={styles.navLabelFull}>{label}</span>
                    <span className={styles.navLabelShort}>{shortLabel}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={toggle}
            aria-label={collapsed ? '展开导航' : '折叠导航'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <span className={styles.navLabel}>{collapsed ? '展开' : '折叠导航'}</span>
          </button>
          <div className={styles.buildNote}>研究原型 · API v1</div>
        </div>
      </aside>

      <main
        id="main-content"
        tabIndex={-1}
        className={`${styles.content} ${collapsed ? styles.contentCollapsed : ''}`}
      >
        <Outlet />
      </main>
    </div>
  )
}
