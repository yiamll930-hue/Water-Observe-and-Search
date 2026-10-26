import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader/PageHeader'
import PipelineRail from '../../components/PipelineRail/PipelineRail'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import styles from './About.module.css'

const OBJECTIVES = [
  {
    code: 'O1',
    title: '可复现基线',
    text: '固定输入、预处理与验证样本，复现 UUCP 初始伪标签与精度基线。',
  },
  {
    code: 'O2',
    title: '时序标签优化',
    text: '以时序邻域与状态转移抑制噪声，保护洪涝造成的真实突变。',
  },
  {
    code: 'O3',
    title: '泛化验证',
    text: '在跨传感器、跨区域条件下检验时序感知模型的稳定性。',
  },
]

const METHODS = [
  {
    name: 'UUCP',
    stage: 'L2',
    role: '初始伪标签',
    mechanism: '多指数判定 · 多段自适应阈值',
    output: '初始标签、基准精度',
  },
  {
    name: 'TPLR',
    stage: 'L3',
    role: '时序优化',
    mechanism: '时序邻域 · 状态转移 · 突变保护',
    output: '优化标签、修正记录',
  },
  {
    name: 'CAMFNet',
    stage: 'L4–L5',
    role: '时序感知提取',
    mechanism: '多光谱空间编码 · 时序差分',
    output: '模型权重、逐时相产品',
  },
]

const EXPERIMENTS = [
  { name: '主对比', setup: 'UUCP / + TPLR / CAMFNet', metrics: 'OA · Kappa · F1 · IoU' },
  { name: 'TPLR 消融', setup: '移除 / 保留 TPLR', metrics: 'F1 · Precision · Recall · 噪声率' },
  { name: '时序分支消融', setup: '无时序差分 / 全量模型', metrics: 'OA · Kappa · 洪涝类 F1' },
  { name: '跨传感器', setup: 'Sentinel-2 → Landsat 8/9', metrics: 'OA · Kappa · IoU' },
  { name: '跨区域', setup: '鄱阳湖 / 洞庭湖 / 广西', metrics: 'F1 · IoU · 面积序列一致性' },
]

const DELIVERABLES = [
  'L1–L6 可复现流程与实验配置',
  '三研究区逐时相水体产品与面积序列',
  '基线、消融与跨传感器精度报告',
  'RESTful 接口、研究原型与论文',
]

// 项目简介 — 研究设计、方法、评估协议与系统边界
export default function About() {
  useDocumentTitle('项目简介')

  return (
    <div className="page">
      <PageHeader
        title="项目简介"
        description="无监督多时相水体提取：UUCP 基线、TPLR 时序伪标签优化与 CAMFNet。"
        meta={
          <>
            <span>大学生创新训练计划</span>
            <span className="sep">·</span>
            <span>中国地质大学（武汉）</span>
            <span className="sep">·</span>
            <span>2026—2027</span>
          </>
        }
        actions={
          <>
            <Link to="/api" className="btn btn-secondary btn-sm">
              API 文档
              <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
            <Link to="/analyze" className="btn btn-primary btn-sm">
              新建分析
              <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </>
        }
      />

      <article className={styles.article}>
        <section className={styles.abstract} aria-labelledby="abstract-title">
          <div className={styles.abstractHead}>
            <span className={styles.abstractLabel} id="abstract-title">摘要 / ABSTRACT</span>
            <span className={styles.abstractRule} aria-hidden="true" />
          </div>
          <p>
            缺少像素级标注时，如何利用多时相影像的时间一致性生成监督信号，
            并在洪涝突变处保持面积响应？WaterWatch 以 UUCP 生成初始伪标签，
            TPLR 优化时序标签，CAMFNet 学习时空特征，并在鄱阳湖、洞庭湖与广西试点评估。
          </p>
          <div className={styles.keywords}>
            <span>无监督水体提取</span>
            <span>多时相遥感</span>
            <span>伪标签优化</span>
            <span>洪涝动态</span>
          </div>
        </section>

        <section className={styles.section} id="question">
          <div className={styles.sectionHead}>
            <span className={styles.sectionNo}>01</span>
            <h2>研究问题</h2>
            <span className={styles.sectionEn}>RESEARCH QUESTION</span>
          </div>
          <p>
            单时相阈值或变化检测生成的伪标签易受云影、阴影、浑浊水体与季相差异干扰；
            相邻时相的水陆连续性可修正噪声，也可能抹平洪涝扩张。核心问题：
          </p>
          <blockquote>
            如何构建时序伪标签优化机制，在降低标签噪声的同时保留真实水体突变，
            并以可复现的精度评估验证其跨传感器、跨区域有效性？
          </blockquote>
          <ol className={styles.objectives}>
            {OBJECTIVES.map((item) => (
              <li key={item.code}>
                <span className={styles.objectiveCode}>{item.code}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className={`callout ${styles.scopeNote}`}>
            <strong>研究边界：</strong>
            方法研究与算法验证，不提供洪水风险判断或公共安全预警。
          </p>
        </section>

        <section className={styles.section} id="method">
          <div className={styles.sectionHead}>
            <span className={styles.sectionNo}>02</span>
            <h2>方法与数据</h2>
            <span className={styles.sectionEn}>METHOD &amp; DATA</span>
          </div>
          <p>
            L1–L6 共用同一时相、研究区与坐标口径：UUCP 生成初始标签，TPLR 优化，
            CAMFNet 训练，随后进入产品验证与动态分析。
          </p>
          <div className={styles.railWrap}>
            <PipelineRail compact />
          </div>
          <div className={styles.methodList}>
            {METHODS.map((method) => (
              <div key={method.name} className={styles.methodRow}>
                <div className={styles.methodHead}>
                  <span className={styles.methodName}>{method.name}</span>
                  <span className={styles.methodStage}>{method.stage}</span>
                  <span className={styles.methodRole}>{method.role}</span>
                </div>
                <span className={styles.methodMechanism}>{method.mechanism}</span>
                <span className={styles.methodOutput}>{method.output}</span>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            数据为 Sentinel-2 MSI 与 Landsat 8/9 OLI，统一执行云掩膜、大气校正、几何配准与重采样。
            鄱阳湖为主研究区，洞庭湖检验时序一致性，广西检验跨气候泛化。
          </p>
        </section>

        <section className={styles.section} id="evaluation">
          <div className={styles.sectionHead}>
            <span className={styles.sectionNo}>03</span>
            <h2>评估设计</h2>
            <span className={styles.sectionEn}>EVALUATION</span>
          </div>
          <p>
            像素级混淆矩阵；固定人工解译样本与随机种子，保留逐时相、逐区域结果。
            指标为 OA、Kappa、F1 / Dice、Precision、Recall 与 IoU。
          </p>
          <ul className={styles.experimentList}>
            {EXPERIMENTS.map((experiment) => (
              <li key={experiment.name}>
                <strong>{experiment.name}</strong>
                <span>{experiment.setup}</span>
                <em>{experiment.metrics}</em>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            以上为评估协议，非实验结论。当前后端 v1 未提供精度评估接口，
            页面不展示 OA、Kappa、F1 或 IoU 数值，也不以模拟结果代替评估。
          </p>
        </section>

        <section className={styles.section} id="system">
          <div className={styles.sectionHead}>
            <span className={styles.sectionNo}>04</span>
            <h2>系统与边界</h2>
            <span className={styles.sectionEn}>SYSTEM</span>
          </div>
          <p>
            前端只负责浏览、提交与展示，不承担推理。当前支撑后端提供 REST v1：
            <code>GET /health</code>、<code>GET /api/v1/algorithms</code>、同步执行的
            <code>POST /api/v1/analyses</code> 及记录查询。创建成功直接返回
            <code>201</code>，当前没有 <code>202 + Job</code>、任务轮询或取消接口。
          </p>
          <p>
            业务接口可通过 <code>X-API-Key</code> 鉴权；未计算或不可用的科学量保持
            <code>null</code>，界面显示「—」，不填 0。主要风险仍是伪标签误差传播与真实突变被平滑；
            以 TPLR 消融、事件级验证、跨传感器测试与逐时相误差作为验证手段。
          </p>
          <div className={styles.deliverables}>
            <span className={styles.deliverablesLabel}>v1 现状</span>
            <ol>
              <li>已实现健康检查、算法注册、同步多时相分析与 SQLite 记录查询。</li>
              <li><code>mock_change</code> 只校验参数，返回 <code>is_mock=true</code> 且面积为 null。</li>
              <li><code>camfnet_change</code> 已注册但未接入，调用返回 501，不会自动降级。</li>
              <li>真实影像读取、模型权重、产品生成与精度评估接口尚未接入。</li>
            </ol>
          </div>
          <div className={styles.deliverables}>
            <span className={styles.deliverablesLabel}>计划交付</span>
            <ol>
              {DELIVERABLES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          <p className={`callout ${styles.scopeNote}`}>
            <strong>当前进展：</strong>
            本页描述研究设计与方法路线，不是实验结论；后端 v1 可联调，但只返回显式模拟结果。
            研究区边界、水体产品、时序、洪涝与评估页面均未保留，因为 v1 没有对应接口。
          </p>
        </section>

        <footer className={styles.footer}>
          <span>WaterWatch · 研究原型</span>
          <span>中国地质大学（武汉） · 2026—2027</span>
          <span>API /api/v1</span>
        </footer>
      </article>
    </div>
  )
}
