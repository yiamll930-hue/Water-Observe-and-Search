import { create } from 'zustand'
import type { Region } from '../types'

type Theme = 'dark' | 'light'

interface AppState {
  theme: Theme
  sidebarCollapsed: boolean
  currentRegion: Region
  timeRange: [string, string]
  toggleTheme: () => void
  toggleSidebar: () => void
  setRegion: (region: Region) => void
  setTimeRange: (range: [string, string]) => void
}

// 从 localStorage 读取主题偏好
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('sw-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'dark'
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('sw-theme', t)
}

applyTheme(getInitialTheme())

export const useAppStore = create<AppState>((set, get) => ({
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  currentRegion: 'poyang',
  timeRange: ['2024-01', '2024-12'],
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setRegion: (region) => set({ currentRegion: region }),
  setTimeRange: (range) => set({ timeRange: range }),
}))
