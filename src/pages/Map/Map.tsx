import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  Copy,
  Info,
  LocateFixed,
  MapPin,
  MousePointer2,
  PlayCircle,
  X,
} from 'lucide-react'
import MapView from '../../components/MapView/MapView'
import Panel from '../../components/Panel/Panel'
import PageHeader from '../../components/PageHeader/PageHeader'
import RegionTabs from '../../components/RegionTabs/RegionTabs'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAppStore } from '../../store/app'
import { useMapStore } from '../../store/map'
import {
  REGIONS,
  REGION_LABELS_MAP,
  REGION_ROLE_LABELS,
  SENSOR_LABELS,
} from '../../config/regions'
import type { Region, RegionInfo } from '../../types'
import { formatLatLng } from '../../utils/format'
import styles from './Map.module.css'

// 研究区经纬度范围 — WGS 84，西/南/东/北
function formatBbox(info: RegionInfo): string {
  const [west, south, east, north] = info.bbox
  return `${west.toFixed(2)}°–${east.toFixed(2)}°E, ${south.toFixed(2)}°–${north.toFixed(2)}°N`
}

// 研究区地图 — 静态地理参照；v1 不提供边界、产品与监测图层
export default function MapPage() {
  useDocumentTitle('研究区地图')
  const region = useAppStore((state) => state.currentRegion)
  const setRegion = useAppStore((state) => state.setRegion)
  const baseMap = useMapStore((state) => state.baseMap)
  const selectedPosition = useMapStore((state) => state.selectedPosition)
  const setSelectedPosition = useMapStore((state) => state.setSelectedPosition)
  const [copied, setCopied] = useState(false)
  const mapSectionRef = useRef<HTMLDivElement>(null)

  const current = REGIONS.find((item) => item.id === region) ?? REGIONS[0]

  // 复制反馈在 1.6 秒后复位
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  // 切换研究区时清除上一研究区的坐标
  const handleRegionChange = (nextRegion: Region) => {
    setRegion(nextRegion)
    setSelectedPosition(null)
  }

  // 从研究区一览定位 — 切换研究区并回到地图
  const locateRegion = (nextRegion: Region) => {
    handleRegionChange(nextRegion)
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // 复制当前坐标 — WGS 84 十进制度
  const copyPosition = async () => {
    if (!selectedPosition) return
    const text = `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="研究区地图"
        description="鄱阳湖、洞庭湖与广西试点的地理参照底图；研究区元数据来自前端静态配置。"
        meta={
          <>
            <span>WGS 84 · EPSG:4326</span>
            <span className="sep">·</span>
            <span>底图：高德 / Esri</span>
            <span className="sep">·</span>
            <span>无监测图层</span>
          </>
        }
        actions={
          <>
            <span className="badge badge-muted">地理参照</span>
            <Link to="/analyze" className="btn btn-primary btn-sm">
              <PlayCircle size={12} aria-hidden="true" />
              新建分析
            </Link>
          </>
        }
      />

      <div className={`callout callout-water ${styles.scopeNote}`} role="note">
        <Info size={14} aria-hidden="true" />
        <span>
          <strong>仅作地理参照。</strong>
          支撑后端 v1 未提供研究区边界、水体产品或监测图层接口；本页不绘制研究区边界、水体范围或任何模拟面积，
          坐标读取也不会写入分析请求。
        </span>
      </div>

      <div className={styles.regionBar}>
        <RegionTabs value={region} onChange={handleRegionChange} />
        <span className={styles.regionHint}>
          元数据：前端静态配置 · 底图：{baseMap === 'street' ? '高德街道图' : 'Esri 影像'}
        </span>
      </div>

      <div className={styles.layout} ref={mapSectionRef}>
        <Panel
          title="地图视图"
          subtitle={`${current.name} · ${REGION_ROLE_LABELS[current.role]}`}
          icon={<MapPin size={14} aria-hidden="true" />}
          className={styles.mapPanel}
          bodyClassName={styles.mapBody}
          flush
          footer={
            <div className={styles.mapFooter}>
              <div className={styles.legend} aria-label="地图内容说明">
                <span className={styles.legendItem}>
                  <span className={styles.legendSwatch} aria-hidden="true" />
                  城市与湖泊地名
                </span>
                <span className={styles.legendMuted}>未绘制边界 / 水体图层</span>
              </div>
              <span className={styles.mapSource}>
                {baseMap === 'street' ? '高德街道图' : 'Esri 影像'} · 仅作参照
              </span>
            </div>
          }
        >
          <div className={styles.mapCanvas}>
            <MapView
              center={current.center}
              zoom={current.zoom}
              labels={REGION_LABELS_MAP[region]}
            />
          </div>
        </Panel>

        <aside className={styles.side}>
          <Panel
            title="研究区信息"
            subtitle={current.shortName}
            icon={<MapPin size={14} aria-hidden="true" />}
          >
            <p className={styles.description}>{current.description}</p>
            <dl className="kv-list">
              <div className="kv-row">
                <dt>省份 / 区域</dt>
                <dd>{current.province}</dd>
              </div>
              <div className="kv-row">
                <dt>研究类型</dt>
                <dd>{REGION_ROLE_LABELS[current.role]}</dd>
              </div>
              <div className="kv-row">
                <dt>中心点</dt>
                <dd>{formatLatLng(current.center[0], current.center[1])}</dd>
              </div>
              <div className="kv-row">
                <dt>默认缩放</dt>
                <dd>Z{String(current.zoom).padStart(2, '0')}</dd>
              </div>
              <div className={`kv-row ${styles.bboxRow}`}>
                <dt>地理范围</dt>
                <dd>{formatBbox(current)}</dd>
              </div>
              <div className="kv-row">
                <dt>参考影像</dt>
                <dd className={styles.sensorList}>
                  {current.sensors.map((sensor) => SENSOR_LABELS[sensor]).join('、')}
                </dd>
              </div>
            </dl>
            <p className={styles.metaNote}>
              中心点、范围与缩放用于地图定位；不是后端返回的研究区边界。
            </p>
          </Panel>

          <Panel title="坐标读取" icon={<MousePointer2 size={14} aria-hidden="true" />}>
            {selectedPosition ? (
              <>
                <div className={styles.coordValue}>
                  {formatLatLng(selectedPosition[0], selectedPosition[1])}
                </div>
                <div className={styles.coordMeta}>WGS 84 十进制度 · 单击地图更新</div>
                <div className={styles.coordActions}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={copyPosition}>
                    {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                    {copied ? '已复制' : '复制坐标'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedPosition(null)}
                  >
                    <X size={12} aria-hidden="true" />
                    清除
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.coordEmpty}>
                <MousePointer2 size={15} aria-hidden="true" />
                <div>
                  <div className={styles.coordEmptyTitle}>单击地图任意位置</div>
                  <p>读取经纬度，仅用于定位，不参与分析请求。</p>
                </div>
              </div>
            )}
          </Panel>
        </aside>
      </div>

      <Panel
        title="研究区一览"
        subtitle={`${REGIONS.length} 个静态配置`}
        flush
      >
        <div className="table-wrap">
          <table className={`data-table ${styles.regionTable}`}>
            <thead>
              <tr>
                <th>研究区</th>
                <th>省份 / 区域</th>
                <th>研究类型</th>
                <th>中心点</th>
                <th>地理范围</th>
                <th>参考影像</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((info, index) => {
                const active = info.id === region
                return (
                  <tr key={info.id} className={active ? styles.rowActive : undefined}>
                    <td>
                      <span className={styles.regionName}>
                        <span className={styles.regionIndex}>{String(index + 1).padStart(2, '0')}</span>
                        {info.name}
                        {active && <span className="badge badge-accent">当前</span>}
                      </span>
                    </td>
                    <td>{info.province}</td>
                    <td>{REGION_ROLE_LABELS[info.role]}</td>
                    <td className="mono">{formatLatLng(info.center[0], info.center[1])}</td>
                    <td className="mono">{formatBbox(info)}</td>
                    <td className={styles.sensorList}>
                      {info.sensors.map((sensor) => SENSOR_LABELS[sensor]).join('、')}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => locateRegion(info.id)}
                        disabled={active}
                        title={active ? '当前研究区' : `定位到${info.name}`}
                      >
                        <LocateFixed size={12} aria-hidden="true" />
                        {active ? '当前' : '定位'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
