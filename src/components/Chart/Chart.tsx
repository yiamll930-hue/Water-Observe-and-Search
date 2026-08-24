import { useRef } from 'react'
// oxlint-disable react/only-export-components
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChart } from './useChart'
import styles from './Chart.module.css'

echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer,
])

interface ChartProps {
  option: echarts.EChartsCoreOption
  height?: number
  className?: string
  onChartReady?: (chart: echarts.ECharts) => void
}

export default function Chart({
  option,
  height = 360,
  className,
  onChartReady,
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useChart(containerRef, option, onChartReady)

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className ?? ''}`}
      style={{ height }}
    />
  )
}

export { echarts }
