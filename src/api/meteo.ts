import { api } from './client'
import type { MeteoCorrelation, Region } from '../types'

export function fetchMeteoCorrelation(
  region: Region
): Promise<MeteoCorrelation> {
  return api.get<MeteoCorrelation>('/meteo/correlation', {
    params: { region },
  })
}
