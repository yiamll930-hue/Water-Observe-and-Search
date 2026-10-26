import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import PageHeader from '../../components/PageHeader/PageHeader'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAppStore } from '../../store/app'
import {
  getApiBaseUrl,
  getApiOrigin,
  getDocsUrl,
  getHealthUrl,
  getOpenApiUrl,
  isMockMode,
} from '../../api/client'
import styles from './ApiDocs.module.css'

type HttpMethod = 'GET' | 'POST'

interface EndpointDoc {
  method: HttpMethod
  path: string
  summary: string
  params?: string
  status: string
  auth: boolean
}

const ENDPOINTS: EndpointDoc[] = [
  {
    method: 'GET',
    path: '/health',
    summary: '存活检查，返回 { "status": "ok" }',
    params: '不位于 /api/v1 下，不鉴权',
    status: '200',
    auth: false,
  },
  {
    method: 'GET',
    path: '/api/v1/algorithms',
    summary: '读取算法注册表与实现状态',
    params: '返回 { items: [{ id, description, implementation }] }',
    status: '200',
    auth: true,
  },
  {
    method: 'POST',
    path: '/api/v1/analyses',
    summary: '创建并同步执行多时相分析',
    params: 'JSON 请求体；成功返回 201 与 Location 头',
    status: '201',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/v1/analyses',
    summary: '分页查询分析记录，最新创建在前',
    params: 'limit=1–100（默认 20），offset≥0（默认 0）',
    status: '200',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/v1/analyses/{analysis_id}',
    summary: '按 UUID 返回完整输入与结果',
    params: 'analysis_id：UUID；非法 UUID 返回 422',
    status: '200',
    auth: true,
  },
]

const POST_REQUEST_EXAMPLE = `POST /api/v1/analyses
Content-Type: application/json
X-API-Key: <your-key>

{
  "algorithm_id": "mock_change",
  "scenes": [
    {
      "timestamp": "2024-01-24T00:00:00Z",
      "uri": "s3://images/dry.tif",
      "format": "geotiff"
    },
    {
      "timestamp": "2024-07-24T00:00:00Z",
      "uri": "s3://images/wet.tif",
      "format": "geotiff"
    }
  ],
  "parameters": {
    "threshold": 0.5
  }
}`

const CREATED_RESPONSE_EXAMPLE = `HTTP/1.1 201 Created
Location: /api/v1/analyses/<uuid>
Content-Type: application/json

{
  "id": "<uuid>",
  "status": "succeeded",
  "algorithm_id": "mock_change",
  "created_at": "<ISO-8601 UTC>",
  "input": {
    "algorithm_id": "mock_change",
    "scenes": [
      {
        "timestamp": "2024-01-24T00:00:00+00:00",
        "uri": "s3://images/dry.tif",
        "format": "geotiff"
      },
      {
        "timestamp": "2024-07-24T00:00:00+00:00",
        "uri": "s3://images/wet.tif",
        "format": "geotiff"
      }
    ],
    "parameters": { "threshold": 0.5 }
  },
  "result": {
    "is_mock": true,
    "message": "模拟结果，仅供接口联调；未读取影像或执行模型推理。",
    "scene_count": 2,
    "timestamps": [
      "2024-01-24T00:00:00+00:00",
      "2024-07-24T00:00:00+00:00"
    ],
    "water_area_km2": null,
    "expansion_km2": null,
    "shrinkage_km2": null,
    "artifacts": []
  }
}`

const LIST_EXAMPLE = `GET /api/v1/analyses?limit=20&offset=0
X-API-Key: <your-key>

200 OK
{
  "items": ["<Analysis>", "<Analysis>", "..."],
  "limit": 20,
  "offset": 0
}`

const VALIDATION_ERROR_EXAMPLE = `HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数不合法",
    "details": [
      {
        "field": ["body", "scenes"],
        "message": "List should have at least 2 items
                    after validation, not 1"
      }
    ]
  }
}`

const ENV_EXAMPLE = `# 开发：默认经 Vite 代理访问 http://127.0.0.1:8000
# 修改代理目标时，在启动 Vite 前设置 shell 变量：
# VITE_PROXY_TARGET=http://127.0.0.1:8000 pnpm dev

# 构建期变量（.env.local），API 密钥不在此配置
VITE_USE_MOCK=false
# VITE_API_ORIGIN=http://localhost:8000
# VITE_API_BASE_URL=/api/v1`

const ERROR_ROWS = [
  {
    status: '401',
    code: '401',
    scene: 'API Key 缺失或错误',
    behavior: '检查顶栏密钥入口；后端开放模式下不会触发',
  },
  {
    status: '404',
    code: '404',
    scene: '算法不存在 / 分析记录不存在',
    behavior: '核对 algorithm_id 或记录 UUID',
  },
  {
    status: '422',
    code: 'VALIDATION_ERROR',
    scene: '查询参数、路径或请求体不合法',
    behavior: '展示 details 字段路径，不自动重试',
  },
  {
    status: '501',
    code: '501',
    scene: '算法尚未接入',
    behavior: '保持不可用，不降级为模拟算法',
  },
  {
    status: '500',
    code: '500',
    scene: '算法执行或存储失败',
    behavior: '稍后重试；该次失败不会创建成功记录',
  },
]

const BOUNDARIES = [
  {
    title: '同步执行，无任务队列',
    text: 'POST 在请求线程内完成并直接返回 201；没有 202、Job、轮询、进度或取消接口。GPU 长任务契约尚未定义。',
  },
  {
    title: '只接收资源引用',
    text: '不上传影像、不下载文件、不验证路径是否存在，也不检查波段顺序、CRS、像元对齐、无效值或云掩膜。',
  },
  {
    title: '模拟结果不是科学结果',
    text: 'mock_change 只校验参数并返回 is_mock=true；water_area_km2、expansion_km2、shrinkage_km2 恒为 null，artifact 列表为空。',
  },
  {
    title: 'CAMFNet 尚未接入',
    text: 'camfnet_change 出现在注册表中，但 run 为空；调用返回 501，不会自动改用 mock_change。',
  },
  {
    title: '无筛选与总数',
    text: '记录列表只支持 limit / offset，按创建时间倒序，不返回 total；当前没有研究区、算法或时间范围筛选。',
  },
  {
    title: '单密钥，无用户隔离',
    text: '所有业务接口共用一个 X-API-Key；后端未设置 API_KEY 时为开放联调模式。公网部署须经网关提供 HTTPS。',
  },
  {
    title: '无监测业务图层',
    text: 'v1 不提供研究区边界、水体产品、时序、洪涝或精度评估接口；前端地图仅保留静态底图与真实地名参照。',
  },
  {
    title: '存储与部署边界',
    text: 'SQLite 保存记录，适合单实例；多实例需共享数据库。跨源部署需配置 CORS_ORIGINS，开发期可由 Vite 代理规避。',
  },
  {
    title: '契约仍在确认',
    text: '真实算法参数、artifacts 结构、多时相面积数组、用户隔离与长任务状态尚未与团队最终确认；不得据模拟结构推断。',
  },
  {
    title: 'OpenAPI 未覆盖全部错误',
    text: '导出的 OpenAPI 只标注成功响应与 422；401、404、501、500 见 README 与运行实现，接入时应逐项测试。',
  },
]

// API 文档 — 多时序算法服务 v1 的人工契约快照
export default function ApiDocs() {
  useDocumentTitle('API 文档')
  const apiKey = useAppStore((state) => state.apiKey)
  const mockMode = isMockMode()
  const [copied, setCopied] = useState(false)
  const apiBase = getApiBaseUrl()

  // 复制成功提示自动复位
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  // 复制业务根地址
  const copyBaseUrl = async () => {
    try {
      await navigator.clipboard.writeText(apiBase)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="API 文档"
        description="多时序算法服务 v1 的人工契约快照：5 个端点、同步分析、显式模拟结果与统一错误信封。"
        meta={
          <>
            <span>Base URL <code>{apiBase}</code></span>
            <span className="sep">·</span>
            <span>JSON · snake_case</span>
            <span className="sep">·</span>
            <span>{mockMode ? '浏览器内 Mock' : '真实后端'}</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={copyBaseUrl}>
              {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
              {copied ? '已复制' : '复制 Base URL'}
            </button>
            <a href={getDocsUrl()} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              Swagger
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            <a href={getOpenApiUrl()} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              OpenAPI
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </>
        }
      />

      <div className="callout">
        本页以支撑后端 README、运行实现与 <code>openapi.json</code> 为准；示例中的 UUID、时间与资源地址均为占位，
        科学量恒为 <code>null</code>。变更接口后请以运行服务的 <code>/openapi.json</code> 为准。
      </div>

      <div className={styles.layout}>
        <nav className={`toc ${styles.toc}`} aria-label="文档目录">
          <div className={styles.tocTitle}>契约目录</div>
          <a href="#conventions"><span className={styles.tocIndex}>01</span>接口约定</a>
          <a href="#endpoints"><span className={styles.tocIndex}>02</span>端点清单</a>
          <a href="#examples"><span className={styles.tocIndex}>03</span>请求与响应</a>
          <a href="#errors"><span className={styles.tocIndex}>04</span>鉴权与错误</a>
          <a href="#configuration"><span className={styles.tocIndex}>05</span>前端接入</a>
          <a href="#boundaries"><span className={styles.tocIndex}>06</span>实现边界</a>
        </nav>

        <div className={styles.doc}>
          <section id="conventions" className={styles.apiSection}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>接口约定</h2>
                <p className={styles.sectionDesc}>适用于全部 v1 业务端点；健康检查单独位于根路径。</p>
              </div>
              <span className={styles.sectionCount}>CONVENTIONS</span>
            </div>

            <div className={styles.conventionGrid}>
              <div className={styles.conventionBlock}>
                <h3>传输与会话</h3>
                <dl className="kv-list">
                  <div className="kv-row">
                    <dt>业务根路径</dt>
                    <dd className="mono">/api/v1</dd>
                  </div>
                  <div className="kv-row">
                    <dt>健康检查</dt>
                    <dd className="mono">GET /health</dd>
                  </div>
                  <div className="kv-row">
                    <dt>编码</dt>
                    <dd>JSON · UTF-8 · snake_case</dd>
                  </div>
                  <div className="kv-row">
                    <dt>时间</dt>
                    <dd>ISO 8601，创建时间 UTC</dd>
                  </div>
                  <div className="kv-row">
                    <dt>执行方式</dt>
                    <dd>同步；成功即 201 / 200</dd>
                  </div>
                </dl>
                <p className={styles.blockNote}>
                  POST 成功返回 <code>Location: /api/v1/analyses/&lt;uuid&gt;</code>；
                  没有 multipart、上传、202 任务或取消接口。
                </p>
              </div>

              <div className={styles.conventionBlock}>
                <h3>鉴权</h3>
                <dl className="kv-list">
                  <div className="kv-row">
                    <dt>请求头</dt>
                    <dd className="mono">X-API-Key</dd>
                  </div>
                  <div className="kv-row">
                    <dt>范围</dt>
                    <dd>除 /health 外的业务接口</dd>
                  </div>
                  <div className="kv-row">
                    <dt>开放模式</dt>
                    <dd>后端未设置 API_KEY 时不校验</dd>
                  </div>
                  <div className="kv-row">
                    <dt>用户隔离</dt>
                    <dd>无；所有调用共用一个密钥</dd>
                  </div>
                </dl>
                <p className={styles.blockNote}>
                  前端在每次请求时从 localStorage 读取 <code>ww-api-key</code>；
                  密钥不会写入构建产物。共享设备使用后应清除。
                </p>
              </div>

              <div className={styles.conventionBlock}>
                <h3>请求约束</h3>
                <ul className={styles.constraintList}>
                  <li><code>algorithm_id</code>：1–100 字符，须存在于注册表。</li>
                  <li><code>scenes</code>：2–100 个，按时间严格递增，重复时相被拒绝。</li>
                  <li><code>timestamp</code>：必须包含时区，如 <code>2024-01-24T00:00:00Z</code>。</li>
                  <li><code>uri</code>：完整的 https / s3 / gs 地址，不得含用户名或密码。</li>
                  <li><code>format</code>：仅 <code>geotiff</code>；<code>threshold</code>：0–1，默认 0.5。</li>
                  <li>未知字段一律拒绝，返回 422 与字段路径。</li>
                </ul>
              </div>

              <div className={styles.conventionBlock}>
                <h3>结果与空值</h3>
                <p className={styles.blockText}>
                  单条记录包含 <code>id / status / algorithm_id / created_at / input / result</code>；
                  列表为 <code>{'{ items, limit, offset }'}</code>，没有 total，最新创建在前。
                </p>
                <p className={styles.blockText}>
                  当前 <code>mock_change</code> 的 <code>result</code> 固定标记 <code>is_mock: true</code>，
                  水体面积、扩张与萎缩均为 <code>null</code>。界面显示「—」与「未计算」，不填 0 或默认值。
                </p>
              </div>
            </div>
          </section>

          <section id="endpoints" className={styles.apiSection}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>端点清单</h2>
                <p className={styles.sectionDesc}>
                  共 5 个端点；鉴权列中「否」仅适用于 <code>/health</code>。
                </p>
              </div>
              <span className={styles.sectionCount}>5 ENDPOINTS</span>
            </div>

            <div className={styles.endpointList}>
              {ENDPOINTS.map((endpoint) => (
                <div key={`${endpoint.method} ${endpoint.path}`} className={styles.endpointRow}>
                  <span className={`${styles.method} ${endpoint.method === 'GET' ? styles.methodGet : styles.methodPost}`}>
                    {endpoint.method}
                  </span>
                  <code className={styles.endpointPath}>{endpoint.path}</code>
                  <div className={styles.endpointBody}>
                    <span className={styles.endpointSummary}>{endpoint.summary}</span>
                    {endpoint.params && <code className={styles.endpointParams}>{endpoint.params}</code>}
                    <span className={styles.endpointAuth}>
                      {endpoint.auth ? '需要 X-API-Key' : '无需鉴权'}
                    </span>
                  </div>
                  <span className={styles.endpointStatus}>{endpoint.status}</span>
                </div>
              ))}
            </div>

            <p className={styles.endpointNote}>
              成功状态码为 <code>201</code>（创建分析）与 <code>200</code>（其余读取）；
              分页参数越界、UUID 格式错误或请求体不符合约束均返回 <code>422</code>。
              运行服务的 Swagger UI 位于 <a href={getDocsUrl()} target="_blank" rel="noreferrer">{getDocsUrl()}</a>。
            </p>
          </section>

          <section id="examples" className={styles.apiSection}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>请求与响应</h2>
                <p className={styles.sectionDesc}>
                  仅示字段结构；UUID、时间与资源地址为占位。模拟结果不得作为监测结论。
                </p>
              </div>
              <span className={styles.sectionCount}>EXAMPLES</span>
            </div>

            <div className={styles.exampleGrid}>
              <div className={styles.example}>
                <div className={styles.exampleHead}>
                  <span>创建分析</span>
                  <em>POST</em>
                </div>
                <pre className={styles.pre}><code>{POST_REQUEST_EXAMPLE}</code></pre>
              </div>

              <div className={styles.example}>
                <div className={styles.exampleHead}>
                  <span>分页记录</span>
                  <em>200 OK</em>
                </div>
                <pre className={styles.pre}><code>{LIST_EXAMPLE}</code></pre>
              </div>

              <div className={`${styles.example} ${styles.exampleWide}`}>
                <div className={styles.exampleHead}>
                  <span>创建成功 — 显式模拟结果</span>
                  <em>201 Created</em>
                </div>
                <pre className={styles.pre}><code>{CREATED_RESPONSE_EXAMPLE}</code></pre>
              </div>

              <div className={`${styles.example} ${styles.exampleWide}`}>
                <div className={styles.exampleHead}>
                  <span>参数校验失败</span>
                  <em>422</em>
                </div>
                <pre className={styles.pre}><code>{VALIDATION_ERROR_EXAMPLE}</code></pre>
              </div>
            </div>

            <p className={styles.blockNote}>
              <code>details[].field</code> 是 Pydantic 的 loc 数组（例如 <code>["body","scenes",0,"uri"]</code>），
              前端过滤 <code>body</code> 后展示为字段路径；<code>message</code> 的具体英文措辞可能低于版本差异而变化。
            </p>
          </section>

          <section id="errors" className={styles.apiSection}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>鉴权与错误</h2>
                <p className={styles.sectionDesc}>
                  错误统一为 <code>{'{ "error": { "code", "message", "details"? } }'}</code>；
                  HTTP 状态仍需判断，<code>code</code> 是字符串。
                </p>
              </div>
              <span className={styles.sectionCount}>ERRORS</span>
            </div>

            <div className="table-wrap">
              <table className={`data-table ${styles.errorTable}`}>
                <thead>
                  <tr>
                    <th>HTTP</th>
                    <th>code</th>
                    <th>触发场景</th>
                    <th>前端处理</th>
                  </tr>
                </thead>
                <tbody>
                  {ERROR_ROWS.map((row) => (
                    <tr key={`${row.status}-${row.scene}`}>
                      <td className="mono">{row.status}</td>
                      <td className="mono">{row.code}</td>
                      <td>{row.scene}</td>
                      <td>{row.behavior}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.errorNotes}>
              <p>
                <strong>401</strong> 的 message 为「API Key 无效或缺失」；<strong>501</strong> 的 message 为
                「算法尚未接入，请使用 mock_change 进行联调」。两者都不应触发自动降级。
              </p>
              <p>
                前端合成的网络错误使用 <code>NETWORK_ERROR</code>，超时或取消使用
                <code>REQUEST_ABORTED</code>，并非后端错误码；应在界面中与服务端错误区分。
              </p>
            </div>
          </section>

          <section id="configuration" className={styles.apiSection}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>前端接入</h2>
                <p className={styles.sectionDesc}>开发代理、API 密钥与 Mock 模式的配置方式。</p>
              </div>
              <span className={styles.sectionCount}>CONFIG</span>
            </div>

            <div className={styles.configGrid}>
              <div className={styles.conventionBlock}>
                <h3>当前前端运行态</h3>
                <dl className="kv-list">
                  <div className="kv-row">
                    <dt>业务基址</dt>
                    <dd><code className={styles.urlCode}>{apiBase}</code></dd>
                  </div>
                  <div className="kv-row">
                    <dt>请求根地址</dt>
                    <dd><code className={styles.urlCode}>{getApiOrigin()}</code></dd>
                  </div>
                  <div className="kv-row">
                    <dt>健康检查</dt>
                    <dd><code className={styles.urlCode}>{getHealthUrl()}</code></dd>
                  </div>
                  <div className="kv-row">
                    <dt>运行模式</dt>
                    <dd>{mockMode ? '浏览器内 Mock' : '真实后端'}</dd>
                  </div>
                  <div className="kv-row">
                    <dt>API 密钥</dt>
                    <dd>{apiKey ? '已配置' : '未配置'}</dd>
                  </div>
                </dl>
                <p className={styles.blockNote}>
                  未设置 <code>VITE_API_ORIGIN</code> 时，请求根地址为当前页面同源地址；
                  开发期由 Vite 将 <code>/api/v1</code>、<code>/health</code>、<code>/docs</code> 与
                  <code>/openapi.json</code> 代理到 <code>VITE_PROXY_TARGET</code>（默认
                  <code>http://127.0.0.1:8000</code>）；<code>/api</code> 保留给前端文档路由。
                </p>
                <div className={styles.docLinks}>
                  <a href={getDocsUrl()} target="_blank" rel="noreferrer">
                    Swagger UI
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                  <a href={getOpenApiUrl()} target="_blank" rel="noreferrer">
                    OpenAPI JSON
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className={styles.conventionBlock}>
                <h3>开发与构建</h3>
                <pre className={styles.pre}><code>{ENV_EXAMPLE}</code></pre>
                <p className={styles.blockNote}>
                  <code>VITE_PROXY_TARGET</code> 由 <code>vite.config.ts</code> 在启动时读取；
                  <code>VITE_USE_MOCK</code>、<code>VITE_API_ORIGIN</code> 与
                  <code>VITE_API_BASE_URL</code> 在构建期注入。
                </p>
              </div>
            </div>

            <div className={styles.configNotes}>
              <div>
                <h3>API 密钥</h3>
                <p>
                  在顶栏钥匙按钮或「算法服务」页填写，保存到浏览器 localStorage 的
                  <code>ww-api-key</code>，每次请求以 <code>X-API-Key</code> 发送。
                  密钥仅存本地，不进入仓库或构建产物。
                </p>
              </div>
              <div>
                <h3>开发代理</h3>
                <p>
                  默认将 <code>/api/v1</code>、<code>/health</code>、<code>/docs</code> 与
                  <code>/openapi.json</code> 代理到 <code>http://127.0.0.1:8000</code>，
                  前端同源访问，无需 CORS。跨源直连时须将前端源加入后端
                  <code>CORS_ORIGINS</code>。
                </p>
              </div>
              <div>
                <h3>Mock 模式</h3>
                <p>
                  <code>VITE_USE_MOCK=true</code> 时请求不离开浏览器，
                  响应镜像 v1 契约，记录只存在于当前会话；用于界面联调，
                  不能证明真实后端可用。
                </p>
              </div>
            </div>
          </section>

          <section id="boundaries" className={styles.apiSection}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>实现边界</h2>
                <p className={styles.sectionDesc}>
                  当前 v1 的已知限制；未列出的能力不应假定存在。
                </p>
              </div>
              <span className={styles.sectionCount}>LIMITS</span>
            </div>

            <ol className={styles.boundaryList}>
              {BOUNDARIES.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>

            <div className={`callout callout-warning ${styles.boundaryCallout}`}>
              前端不生成任何水体面积、变化量、精度指标或监测图层；模拟记录必须保持
              <code>is_mock=true</code> 与科学量 <code>null</code>。真实算法接入后需重新确认字段结构与验收口径。
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
