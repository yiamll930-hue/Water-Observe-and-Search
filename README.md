# Water-Observe-and-Search

# WaterWatch 水体遥感监测平台 — 前端

基于 **React 19 + TypeScript + Vite** 的水体遥感监测平台前端界面,提供水体变化监测、时序分析、信息提取与任务管理等核心功能。

## ✨ 功能特性

- **工作台 (Workspace)** — 总体概览,统计卡片与可视化图表
- **水体信息提取 (Extract)** — 分步向导式水体信息提取流程,支持文件上传
- **地图监测 (Map)** — Leaflet 交互式地图,水体监测区域展示
- **时序分析 (TimeSeries)** — ECharts 时间序列图表,时间滑块联动
- **任务管理 (Tasks)** — 监测任务表格与状态管理
- **关于 (About)** — 项目说明页

## 🛠️ 技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | React 19、TypeScript |
| 构建 | Vite 8 |
| 路由 | react-router-dom |
| 状态管理 | Zustand |
| 图表 | ECharts + echarts-for-react |
| 地图 | Leaflet + react-leaflet |
| 图标 | lucide-react |

## 📁 目录结构

```
waterwatch-frontend/
├── src/
│   ├── api/          # API 客户端与接口封装(anomalies/stats/timeseries/meteo/watermap/inference)
│   ├── components/   # 通用组件(Chart/MapView/TaskTable/StepWizard/TopBar 等,每组件含 .tsx + .module.css)
│   ├── hooks/        # 自定义 hooks(useApi/useRegion)
│   ├── mock/         # 内置 Mock 数据(mock handler,可通过 VITE_USE_MOCK 切换真实 API)
│   ├── pages/        # 页面(Workspace/Extract/Map/TimeSeries/Tasks/About)
│   ├── store/        # Zustand 状态管理(应用状态/地图状态)
│   ├── styles/       # 全局样式与 CSS 变量(支持暗色主题)
│   ├── types/        # 全局类型定义
│   ├── App.tsx       # 路由入口
│   └── main.tsx      # 应用入口
├── public/           # 静态资源(favicon)
├── index.html
├── package.json
├── tsconfig*.json    # TypeScript 配置
└── vite.config.ts    # Vite 配置
```

## 🚀 快速开始

```bash
# 安装依赖(pnpm 推荐)
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建产物
pnpm preview

# 代码检查
pnpm lint
```

## 🔧 环境说明

- 默认使用内置 **Mock 数据**运行(`USE_MOCK = true`),无需后端即可预览完整界面
- 在 `src/api/client.ts` 中设置 `VITE_USE_MOCK=false`(或 `USE_MOCK` 变量)可切换为真实后端 API(`/api/v1`)

## 📄 协议

尚未指定开源协议,仅供学习参考。
