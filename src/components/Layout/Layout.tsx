import { Outlet, NavLink } from 'react-router-dom'
import { Layers, Droplets, Map, TrendingUp, ListTodo, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import TopBar from '../TopBar/TopBar'
import { useAppStore } from '../../store/app'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { to: '/', icon: Layers, label: '工作台' },
  { to: '/extract', icon: Droplets, label: '水体提取' },
  { to: '/map', icon: Map, label: '地图浏览' },
  { to: '/timeseries', icon: TrendingUp, label: '时序分析' },
  { to: '/tasks', icon: ListTodo, label: '任务管理' },
  { to: '/about', icon: Info, label: '项目简介' },
]

export default function Layout() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggle = useAppStore((s) => s.toggleSidebar)

  return (
    <div className={styles.layout}>
      <TopBar />
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.navSection}>功能</div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Icon size={17} />
            <span className={styles.navLabel}>{label}</span>
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={toggle} className={styles.navItem} style={{ opacity: 0.5 }}>
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          <span className={styles.navLabel}>折叠</span>
        </button>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
