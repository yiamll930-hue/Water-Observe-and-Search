// 六级流水线元数据 — 与《计划书》开发架构一致
export interface PipelineStageMeta {
  code: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'
  title: string
  summary: string
  output: string
  to: string
}

export const PIPELINE_STAGES: PipelineStageMeta[] = [
  {
    code: 'L1',
    title: '多源数据预处理',
    summary: '云掩膜、大气校正、几何配准与重采样，构建时空立方体。',
    output: '标准化影像、指数图层',
    to: '/map',
  },
  {
    code: 'L2',
    title: 'UUCP 初始伪标签',
    summary: '多段自适应阈值与多指数判定，生成初始伪标签。',
    output: '初始伪标签、基准精度',
    to: '/about',
  },
  {
    code: 'L3',
    title: 'TPLR 时序优化',
    summary: '时序邻域与状态转移修正噪声，保护真实洪涝突变。',
    output: '优化伪标签、修正记录',
    to: '/about',
  },
  {
    code: 'L4',
    title: 'CAMFNet 模型训练',
    summary: '多光谱空间编码 + 时序差分，以优化伪标签训练。',
    output: '模型权重、消融结果',
    to: '/algorithms',
  },
  {
    code: 'L5',
    title: '产品生成与验证',
    summary: '逐时相推理、像元级精度评定与跨传感器测试。',
    output: '水体产品、精度报告',
    to: '/analyses',
  },
  {
    code: 'L6',
    title: '动态监测与归因',
    summary: '长时序面积曲线、洪涝/干旱事件与降雨响应。',
    output: '面积曲线、异常图斑、事件报告',
    to: '/about',
  },
]
