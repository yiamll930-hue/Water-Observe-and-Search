// 研究区元数据 — 前端地理参照配置，不属于后端 v1 资源
import type { MapLabel, Region, RegionInfo, RegionRole, SatelliteType } from '../types'

export const REGION_ORDER: Region[] = ['poyang', 'dongting', 'guangxi']

// 研究区基础信息 — 与《计划书》中的鄱阳湖—洞庭湖研究区一致
export const REGIONS: RegionInfo[] = [
  {
    id: 'poyang',
    name: '鄱阳湖',
    shortName: '鄱阳湖',
    province: '江西省',
    role: 'lake',
    center: [29.05, 116.15],
    bbox: [115.72, 28.35, 116.78, 30.02],
    zoom: 9,
    sensors: ['sentinel-2', 'landsat-8', 'landsat-9'],
    description: '中国最大淡水湖；季节性水陆交替显著，核心研究区。',
  },
  {
    id: 'dongting',
    name: '洞庭湖',
    shortName: '洞庭湖',
    province: '湖南省',
    role: 'lake',
    center: [29.32, 112.85],
    bbox: [111.72, 28.42, 113.42, 29.88],
    zoom: 9,
    sensors: ['sentinel-2', 'landsat-8', 'landsat-9'],
    description: '长江中游吞吐型湖泊；丰枯差异大，用于检验时序一致性与突变保留。',
  },
  {
    id: 'guangxi',
    name: '广西典型水域',
    shortName: '广西',
    province: '广西壮族自治区',
    role: 'regional-pilot',
    center: [23.83, 108.79],
    bbox: [104.45, 20.90, 112.10, 26.40],
    zoom: 7,
    sensors: ['sentinel-2', 'landsat-8', 'landsat-9'],
    description: '跨气候与地表覆被的泛化试点。',
  },
]

export const REGION_LABELS: Record<Region, string> = {
  poyang: '鄱阳湖',
  dongting: '洞庭湖',
  guangxi: '广西',
}

export const REGION_ROLE_LABELS: Record<RegionRole, string> = {
  lake: '典型湖泊研究区',
  'lake-group': '湖群研究区',
  'regional-pilot': '跨区域泛化试点',
}

export const REGION_CENTERS: Record<Region, [number, number]> = {
  poyang: [29.05, 116.15],
  dongting: [29.32, 112.85],
  guangxi: [23.83, 108.79],
}

export const SENSOR_LABELS: Record<SatelliteType, string> = {
  'sentinel-2': 'Sentinel-2',
  'landsat-8': 'Landsat 8',
  'landsat-9': 'Landsat 9',
}

// 真实地名标注 — 仅用于地图定位，不代表监测产品范围
export const REGION_LABELS_MAP: Record<Region, MapLabel[]> = {
  poyang: [
    { id: 'poyang-lake', name: '鄱阳湖', kind: 'lake', position: [29.06, 116.18] },
    { id: 'nanchang', name: '南昌', kind: 'city', position: [28.68, 115.86] },
    { id: 'jiujiang', name: '九江', kind: 'city', position: [29.71, 116.00] },
    { id: 'duchang', name: '都昌', kind: 'city', position: [29.27, 116.20] },
    { id: 'hukou', name: '湖口', kind: 'city', position: [29.74, 116.23] },
    { id: 'yugan', name: '余干', kind: 'city', position: [28.70, 116.69] },
  ],
  dongting: [
    { id: 'dongting-lake', name: '洞庭湖', kind: 'lake', position: [29.32, 112.86] },
    { id: 'yueyang', name: '岳阳', kind: 'city', position: [29.36, 113.13] },
    { id: 'changde', name: '常德', kind: 'city', position: [29.03, 111.70] },
    { id: 'yiyang', name: '益阳', kind: 'city', position: [28.55, 112.36] },
    { id: 'yuanjiang', name: '沅江', kind: 'city', position: [28.84, 112.36] },
    { id: 'miluo', name: '汨罗', kind: 'city', position: [28.81, 113.08] },
  ],
  guangxi: [
    { id: 'nanning', name: '南宁', kind: 'city', position: [22.82, 108.32] },
    { id: 'guilin', name: '桂林', kind: 'city', position: [25.27, 110.29] },
    { id: 'liuzhou', name: '柳州', kind: 'city', position: [24.33, 109.42] },
    { id: 'hechi', name: '河池', kind: 'city', position: [24.70, 108.06] },
    { id: 'baise', name: '百色', kind: 'city', position: [23.90, 106.62] },
  ],
}
