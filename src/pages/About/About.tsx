import {
  Droplets, Brain, Satellite, BarChart3, AlertTriangle,
} from 'lucide-react'
import styles from './About.module.css'

// 项目亮点卡片
const HIGHLIGHTS = [
  {
    icon: Satellite, title: '多源遥感影像',
    desc: '支持 Sentinel-2 和 Landsat 多时相影像，覆盖鄱阳湖、洞庭湖、广西等关键水域，实现大范围水体动态监测。',
  },
  {
    icon: Brain, title: '无监督深度学习',
    desc: '基于 UUCP 与 CAMFNet 等无监督模型，无需人工标注即可实现高精度水体分割，显著降低数据准备成本。',
  },
  {
    icon: BarChart3, title: '时空序列分析',
    desc: '多维度时序图表展示水体面积变化趋势，结合降雨量等气象数据进行相关性分析，揭示水文变化规律。',
  },
  {
    icon: AlertTriangle, title: '异常预警',
    desc: '自动识别洪涝与干旱异常事件，按严重等级分级告警，为防灾减灾决策提供及时的数据支撑。',
  },
]

// 技术栈标签
const TECH_STACK = [
  'React 19', 'TypeScript', 'Vite', 'ECharts 6', 'Leaflet',
  'Zustand', 'CSS Modules', 'Python', 'PyTorch', 'FastAPI',
  'PostgreSQL', 'PostGIS', 'Redis', 'Celery', 'Sentinel-2',
  'Landsat', 'Docker',
]

export default function About() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroIcon}>
          <Droplets size={28} />
        </div>
        <h2 className={styles.heroTitle}>WaterWatch</h2>
        <p className={styles.heroSub}>
          无监督多时相水体动态监测与预警平台，中国地质大学（武汉）2026—2027
          年大学生创新训练计划项目。在不依赖人工标注的条件下，利用多时相遥感影像实现高精度水体动态监测。
        </p>
      </div>

      {/* 亮点卡片 */}
      <div className={styles.grid}>
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className={styles.card}>
            <div className={styles.cardIcon}>
              <h.icon size={18} />
            </div>
            <div className={styles.cardTitle}>{h.title}</div>
            <div className={styles.cardDesc}>{h.desc}</div>
          </div>
        ))}
      </div>

      {/* 技术栈 */}
      <div className={styles.techSection}>
        <div className={styles.techSectionTitle}>技术栈</div>
        <div className={styles.techTags}>
          {TECH_STACK.map((t) => (
            <span key={t} className={styles.tag}>{t}</span>
          ))}
        </div>
      </div>

      {/* 页脚 */}
      <div className={styles.footer}>
        WaterWatch © 2026—2027 中国地质大学（武汉）
      </div>
    </div>
  )
}
