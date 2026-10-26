import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers, LoaderCircle, Satellite, TriangleAlert, ZoomIn, ZoomOut } from 'lucide-react'
import { useMapStore } from '../../store/map'
import type { MapLabel } from '../../types'
import styles from './MapView.module.css'

// 底图配置 — 高德街道图与 Esri 卫星影像，仅作地理参照
const BASEMAPS = {
  street: {
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    subdomains: ['1', '2', '3', '4'],
    attribution:
      '&copy; <a href="https://www.amap.com/" target="_blank" rel="noreferrer">高德地图</a>',
    maxZoom: 18,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
} as const

// 卫星影像地名注记 — 叠加 Esri 参考图层，保留行政地名
const SATELLITE_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

interface MapViewProps {
  center: [number, number]
  zoom?: number
  labels?: MapLabel[]
  onMapClick?: (latlng: [number, number]) => void
  className?: string
}

// 转义地名，避免动态 HTML 注入
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// 地图视图 — 真实底图、地名标注与坐标读取，不绘制任何监测图层
export default function MapView({
  center,
  zoom = 9,
  labels = [],
  onMapClick,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const labelGroupRef = useRef<L.LayerGroup | null>(null)
  const onMapClickRef = useRef(onMapClick)
  const previousCenterRef = useRef<[number, number] | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [tileState, setTileState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retryKey, setRetryKey] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(zoom)
  const baseMap = useMapStore((state) => state.baseMap)
  const labelsVisible = useMapStore((state) => state.labelsVisible)
  const setBaseMap = useMapStore((state) => state.setBaseMap)
  const toggleLabels = useMapStore((state) => state.toggleLabels)
  const setSelectedPosition = useMapStore((state) => state.setSelectedPosition)

  // 保持点击回调为最新引用，避免重建地图实例
  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  // 初始化地图与固定控件
  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    const map = L.map(container, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
      minZoom: 3,
      maxZoom: 19,
      preferCanvas: true,
    })
    map.attributionControl.setPrefix(false)
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false, maxWidth: 130 }).addTo(map)

    labelGroupRef.current = L.layerGroup().addTo(map)

    map.on('click', (event: L.LeafletMouseEvent) => {
      const position: [number, number] = [event.latlng.lat, event.latlng.lng]
      setSelectedPosition(position)
      onMapClickRef.current?.(position)
    })
    map.on('zoomend', () => setZoomLevel(map.getZoom()))

    mapRef.current = map
    previousCenterRef.current = center
    setZoomLevel(map.getZoom())
    setMapReady(true)

    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }))
    observer.observe(container)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      labelGroupRef.current = null
    }
    // 中心与缩放仅在挂载时取初值，后续由独立 effect 处理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 切换研究区时平滑定位
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const previous = previousCenterRef.current
    if (previous && previous[0] === center[0] && previous[1] === center[1]) return
    previousCenterRef.current = center
    map.flyTo(center, zoom, { duration: 0.8 })
  }, [center, zoom, mapReady])

  // 底图与影像注记 — 底图切换或重试时重建瓦片
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    setTileState('loading')
    let loaded = false
    let errorCount = 0
    const config = BASEMAPS[baseMap]
    const addedLayers: L.TileLayer[] = []

    const baseLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      // Leaflet 读取 getTileUrl 时始终访问 subdomains.length，卫星底图无 {s} 也必须保留默认值
      subdomains: 'subdomains' in config ? [...config.subdomains] : 'abc',
      maxZoom: config.maxZoom,
      crossOrigin: false,
      detectRetina: false,
    }).addTo(map)
    addedLayers.push(baseLayer)

    if (baseMap === 'satellite') {
      const labelLayer = L.tileLayer(SATELLITE_LABELS, {
        maxZoom: config.maxZoom,
        opacity: 0.9,
      }).addTo(map)
      addedLayers.push(labelLayer)
    }

    baseLayer.on('tileload', () => {
      if (loaded) return
      loaded = true
      setTileState('ready')
    })
    baseLayer.on('tileerror', () => {
      errorCount += 1
      if (!loaded && errorCount >= 2) setTileState('error')
    })

    // 超时兜底：长时间无成功瓦片则提示底图异常
    const timeout = window.setTimeout(() => {
      if (!loaded) setTileState('error')
    }, 7000)

    return () => {
      window.clearTimeout(timeout)
      addedLayers.forEach((layer) => layer.remove())
    }
  }, [baseMap, mapReady, retryKey])

  // 研究区真实地名标注 — 城市、湖泊，不含任何监测数值
  useEffect(() => {
    const group = labelGroupRef.current
    if (!group || !mapReady) return
    group.clearLayers()
    if (!labelsVisible) return

    labels.forEach((label) => {
      const kindClass = label.kind === 'lake' ? 'ww-map-label--lake' : 'ww-map-label--city'
      const icon = L.divIcon({
        className: 'ww-map-label-host',
        html: `<span class="ww-map-label ${kindClass}"><span class="ww-map-label-dot"></span>${escapeHtml(label.name)}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })
      L.marker(label.position, { icon, interactive: false, keyboard: false }).addTo(group)
    })
  }, [labels, labelsVisible, mapReady])

  // 回到当前研究区中心
  const focusCenter = () => {
    mapRef.current?.flyTo(center, zoom, { duration: 0.7 })
  }

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <div ref={containerRef} className={styles.map} aria-label="研究区地理参照地图" />

      <div className={styles.controlStack}>
        <div className={styles.baseSwitch} role="group" aria-label="底图类型">
          <button
            type="button"
            className={`${styles.baseButton} ${baseMap === 'street' ? styles.baseActive : ''}`}
            aria-pressed={baseMap === 'street'}
            onClick={() => setBaseMap('street')}
          >
            街道
          </button>
          <button
            type="button"
            className={`${styles.baseButton} ${baseMap === 'satellite' ? styles.baseActive : ''}`}
            aria-pressed={baseMap === 'satellite'}
            onClick={() => setBaseMap('satellite')}
            title="卫星影像底图"
          >
            <Satellite size={12} aria-hidden="true" />
            影像
          </button>
        </div>

        <button
          type="button"
          className={`${styles.layerToggle} ${labelsVisible ? styles.layerToggleActive : ''}`}
          aria-pressed={labelsVisible}
          onClick={toggleLabels}
          title={labelsVisible ? '隐藏城市与湖泊地名' : '显示城市与湖泊地名'}
        >
          <Layers size={13} aria-hidden="true" />
          地名
        </button>
      </div>

      <div className={styles.zoomControls} role="group" aria-label="地图缩放">
        <button type="button" className={styles.zoomButton} onClick={() => mapRef.current?.zoomIn()} title="放大" aria-label="放大">
          <ZoomIn size={14} />
        </button>
        <span className={styles.zoomLevel} aria-hidden="true">Z{String(zoomLevel).padStart(2, '0')}</span>
        <button type="button" className={styles.zoomButton} onClick={() => mapRef.current?.zoomOut()} title="缩小" aria-label="缩小">
          <ZoomOut size={14} />
        </button>
        <button type="button" className={styles.zoomButton} onClick={focusCenter} title="回到研究区中心" aria-label="回到研究区中心">
          <span className={styles.resetDot} />
        </button>
      </div>

      {tileState === 'loading' && (
        <div className={styles.tileState} role="status">
          <LoaderCircle size={16} className={styles.spin} aria-hidden="true" />
          正在加载底图
        </div>
      )}

      {tileState === 'error' && (
        <div className={styles.tileError} role="alert">
          <TriangleAlert size={15} aria-hidden="true" />
          <span>底图加载失败，请检查网络。</span>
          <button type="button" className={styles.retryButton} onClick={() => setRetryKey((key) => key + 1)}>
            重试
          </button>
        </div>
      )}
    </div>
  )
}
