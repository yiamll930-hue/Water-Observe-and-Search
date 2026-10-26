import { create } from 'zustand'
import { getStoredApiKey, setStoredApiKey } from '../api/client'
import type { Region } from '../types'

type Theme = 'dark' | 'light'

interface AppState {
  theme: Theme
  sidebarCollapsed: boolean
  currentRegion: Region
  apiKey: string
  toggleTheme: () => void
  toggleSidebar: () => void
  setRegion: (region: Region) => void
  setApiKey: (key: string) => void
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
  apiKey: getStoredApiKey(),
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setRegion: (region) => set({ currentRegion: region }),
  setApiKey: (key) => {
    const next = key.trim()
    setStoredApiKey(next)
    set({ apiKey: next })
  },
}))
