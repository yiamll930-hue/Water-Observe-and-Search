import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Layers, Satellite } from 'lucide-react'
import { useMapStore } from '../../store/map'
import { fetchWaterMap } from '../../api/watermap'
import styles from './MapView.module.css'

// 默认中心：鄱阳湖
const DEFAULT_CENTER: [number, number] = [29.05, 116.15]
const DEFAULT_ZOOM = 9

// 底图 URL
const TILE_URLS = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
}

const TILE_ATTR: Record<string, string> = {
  osm: '&copy; OpenStreetMap contributors',
  satellite:
    '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
}

interface MapViewProps {
  height?: number
  center?: [number, number]       // 地图中心，变化时 flyTo
  showLayerPanel?: boolean
  onMapClick?: (latlng: [number, number]) => void
}

export default function MapView({
  height,
  center,
  showLayerPanel = true,
  onMapClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const waterLayerRef = useRef<L.GeoJSON | null>(null)
  const layers = useMapStore((s) => s.layers)
  const baseMap = useMapStore((s) => s.baseMap)
  const setBaseMap = useMapStore((s) => s.setBaseMap)

  // 初始化地图
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    })

    const tile = L.tileLayer(TILE_URLS[baseMap], {
      attribution: TILE_ATTR[baseMap],
    }).addTo(map)

    mapRef.current = map
    tileRef.current = tile

    // 点击事件
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick?.([e.latlng.lat, e.latlng.lng])
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 切换底图
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return
    tileRef.current.remove()
    const tile = L.tileLayer(TILE_URLS[baseMap], {
      attribution: TILE_ATTR[baseMap],
    }).addTo(mapRef.current)
    tileRef.current = tile
  }, [baseMap])

  // 区域变更时飞行定位
  useEffect(() => {
    if (!mapRef.current || !center) return
    mapRef.current.flyTo(center, DEFAULT_ZOOM, { duration: 1.2 })
  }, [center])

  useEffect(() => {
    if (!mapRef.current) return
    let cancelled = false
    fetchWaterMap()
      .then((data) => {
        if (cancelled || !mapRef.current) return
        const layer = L.geoJSON(data as GeoJSON.GeoJsonObject, {
          style: {
            color: '#22d3ee',
            weight: 1,
            fillColor: '#0ea5e9',
            fillOpacity: 0.42,
          },
        })
        waterLayerRef.current = layer
        if (layer.getBounds().isValid()) {
          mapRef.current.fitBounds(layer.getBounds().pad(0.2))
        }
        if (useMapStore.getState().layers.find((item) => item.id === 'water-mask')?.visible) {
          layer.addTo(mapRef.current)
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      waterLayerRef.current?.remove()
      waterLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const layer = waterLayerRef.current
    const visible = layers.find((item) => item.id === 'water-mask')?.visible ?? false
    if (!layer || !mapRef.current) return
    if (visible) layer.addTo(mapRef.current)
    else layer.removeFrom(mapRef.current)
  }, [layers])

  // GeoJSON 数据层 — 由后端 API 提供真实数据后叠加
  // 当前无数据时不渲染任何伪造图层

  return (
    <div className={styles.wrapper} style={height ? { height, minHeight: 0 } : undefined}>
      <div ref={containerRef} className={styles.map} />

      {/* 右上角控制按钮 */}
      <div className={styles.controls}>
        <button
          className={`${styles.controlBtn} ${baseMap === 'osm' ? styles.active : ''}`}
          title="街道地图"
          onClick={() => setBaseMap('osm')}
        >
          <Layers size={16} />
        </button>
        <button
          className={`${styles.controlBtn} ${baseMap === 'satellite' ? styles.active : ''}`}
          title="卫星影像"
          onClick={() => setBaseMap('satellite')}
        >
          <Satellite size={16} />
        </button>
      </div>

      {/* 图层控制面板 */}
      {showLayerPanel && (
        <div className={styles.layerPanel}>
          <div className={styles.layerTitle}>图层</div>
          {layers.map((layer) => (
            <label
              key={layer.id}
              className={`${styles.layerItem} ${styles[layer.type]}`}
            >
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => useMapStore.getState().toggleLayer(layer.id)}
              />
              <span className={styles.colorDot} />
              {layer.name}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
