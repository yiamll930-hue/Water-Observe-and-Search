# WaterWatch — 多时相水体遥感监测研究原型（前端）

WaterWatch 是大学生创新训练计划的方法研究型前端，对应 **UUCP 伪标签基线 → TPLR 时序伪标签优化 → CAMFNet 时序感知水体提取** 的研究路线。当前界面围绕支撑后端 **多时序算法服务 v1** 重构，提供算法注册、同步多时相分析、分析记录、健康检查与静态研究区参照，不构成公共安全预警。

> **数据原则：不生成科学量。** 后端 `mock_change` 只校验参数，结果显式标记 `is_mock=true`，水体面积、扩张与萎缩均为 `null`；界面显示「— / 未计算」，不填 0，也不把模拟结果当作监测结论。`camfnet_change` 未接入，调用返回 501，不会自动降级。

## 页面

| 路由 | 页面 | 内容 |
| --- | --- | --- |
| `/` | 监测工作台 | 服务状态、算法注册数、最近 5 条分析、快捷入口与 L1–L6 研究路线 |
| `/analyze` | 新建分析 | 选择算法、编辑 2–100 景时相、阈值与前端校验；同步提交 |
| `/analyses` | 分析记录 | `limit/offset` 分页、创建时间倒序、模拟结果标记 |
| `/analyses/:id` | 分析详情 | 完整输入、原始结果、时相表与参数 |
| `/algorithms` | 算法服务 | 注册表与实现状态、健康检查、API 密钥配置 |
| `/map` | 研究区地图 | 静态底图、真实地名与坐标读取；不绘制边界或水体图层 |
| `/api` | API 文档 | v1 端点、请求约束、示例、错误码、接入配置与实现边界 |
| `/about` | 项目简介 | 研究问题、方法、评估协议与 v1 能力边界 |
| `*` | 404 | 路由诊断；说明已移除的旧页面 |

旧入口 `/extract` 与 `/tasks` 分别重定向到 `/analyze` 与 `/analyses`。原时序、洪涝、评估、任务、上传推理等页面因 v1 没有对应接口而移除。

## 后端契约概要

后端为独立的 FastAPI 工程，不包含在本仓库中；前端只使用以下端点：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 存活检查，不鉴权 |
| GET | `/api/v1/algorithms` | 算法注册表：`id / description / implementation` |
| POST | `/api/v1/analyses` | 同步执行；成功 201 + `Location` |
| GET | `/api/v1/analyses` | `limit=1–100`、`offset≥0`，最新在前，无 total |
| GET | `/api/v1/analyses/{id}` | 按 UUID 返回记录 |

关键约束：

- JSON 使用 snake_case；时间采用带时区的 ISO 8601，创建时间为 UTC。
- `scenes` 为 2–100 个，必须严格按时间递增；`uri` 仅接受完整的 https / s3 / gs 资源地址。
- 当前只接收资源引用，不上传、不下载、不验证文件存在性；`format` 仅支持 `geotiff`。
- `threshold` 范围 0–1，默认 0.5；未知字段拒绝接收。
- 错误统一为 `{ "error": { "code", "message", "details"? } }`；状态包括 401、404、422、501、500。
- 业务接口可通过 `X-API-Key` 鉴权；后端未设置 `API_KEY` 时为开放联调模式。无用户隔离。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | React 19、TypeScript |
| 构建 | Vite 8（rolldown） |
| 路由 | react-router-dom 7 |
| 状态 | Zustand 5 |
| 地图 | Leaflet 1.9（静态底图与地名标注） |
| 图标 | lucide-react |
| 样式 | CSS Modules + 全局设计变量 |
| 检查 | oxlint、tsc |

## 目录结构

```
src/
├── api/          # 统一请求入口、算法、分析记录、健康检查
├── components/   # Layout、TopBar、MapView、SceneEditor、AnalysisResult 等
├── config/       # L1–L6 研究路线与静态研究区元数据
├── hooks/        # useApi、useDocumentTitle
├── mock/         # 镜像 v1 契约的浏览器内 Mock（需显式启用）
├── pages/        # 工作台、分析、记录、算法、地图、文档、简介、404
├── store/        # 主题、API Key、当前研究区、地图状态
├── styles/       # 设计变量、全局样式、共享 UI 原语
├── types/        # API 与领域类型
├── utils/        # 分析表单校验与格式化
├── App.tsx       # 路由与懒加载
└── main.tsx      # 应用入口
```

## 快速开始

```bash
pnpm install
pnpm dev        # 开发服务器，默认 http://localhost:5173/
pnpm build      # tsc -b + vite build
pnpm preview    # 预览构建产物
pnpm lint       # oxlint
```

类型检查：

```bash
pnpm exec tsc -p tsconfig.app.json --noEmit
```

根目录的 `tsc --noEmit` 因 `files: []` 不会检查应用源码。

## 后端接入

默认连接真实后端：Vite 将 `/api/v1`、`/health`、`/docs`、`/openapi.json` 代理到 `http://127.0.0.1:8000`。其中 `/api/v1` 才是业务前缀，`/api` 保留给前端文档路由。启动后端后：

```bash
pnpm dev
```

在顶栏钥匙按钮或「算法服务」页填写 `X-API-Key`。密钥保存在浏览器 localStorage 的 `ww-api-key`，每次请求自动携带，不进入构建产物。

修改代理目标（启动 Vite 前设置环境变量）：

```bash
VITE_PROXY_TARGET=http://192.168.1.10:8000 pnpm dev
```

跨源直连或构建部署可在 `.env.local` 中配置（变量清单见根目录 `.env.example`）：

```bash
VITE_API_ORIGIN=http://localhost:8000
VITE_API_BASE_URL=/api/v1
VITE_USE_MOCK=false
```

- `VITE_API_ORIGIN` 为空时使用同源（开发期由代理转发）；设置后同时用于 API、健康和 Swagger 链接。
- 跨源部署须将前端源加入后端 `CORS_ORIGINS`，并在网关提供 HTTPS。
- `VITE_USE_MOCK=true` 时请求不离开浏览器，Mock 镜像 v1 契约、记录仅保留当前会话；用于界面联调，不能证明真实后端可用。

## WSL 说明

项目位于 Windows 挂载目录时，Vite 原生文件监听可能失效，`vite.config.ts` 已启用轮询（`server.watch.usePolling`）。如页面未热更新，可重启开发服务器并删除 `node_modules/.vite`。

## 边界

- 方法研究原型，不是业务化监测、洪水风险判断或公共安全预警系统。
- 后端 v1 只有模拟算法与同步分析；真实影像读取、模型权重、GPU 推理、产品生成和精度评估尚未接入。
- 不提供研究区边界、水体产品、时序、洪涝或精度评估接口；地图与 L1–L6 仅作地理参照和研究路线展示。
- 单密钥、无用户隔离；SQLite 适合单实例，多实例需共享数据库。
- 尚未指定开源协议，仅供学习与研究使用。
