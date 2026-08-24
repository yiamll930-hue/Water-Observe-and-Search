import { useAppStore } from '../store/app'
import type { Region } from '../types'

export function useRegion() {
  const currentRegion = useAppStore((s) => s.currentRegion)
  const setRegion = useAppStore((s) => s.setRegion)
  return { currentRegion, setRegion }
}

export type { Region }
