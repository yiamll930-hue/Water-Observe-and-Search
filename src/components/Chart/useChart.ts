import { useEffect, useRef } from 'react'
import { init } from 'echarts/core'
import type { ECharts, EChartsCoreOption } from 'echarts/core'

export function useChart(
  containerRef: React.RefObject<HTMLDivElement | null>,
  option: EChartsCoreOption,
  onReady?: (chart: ECharts) => void
) {
  const chartRef = useRef<ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const instance = init(containerRef.current, undefined, {
      renderer: 'canvas',
    })
    chartRef.current = instance
    onReady?.(instance)

    const handleResize = () => instance.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      instance.dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, true)
    }
  }, [option])

  return { chartRef }
}
