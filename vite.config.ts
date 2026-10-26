import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 后端地址可通过 VITE_PROXY_TARGET 覆盖，默认本地 FastAPI 服务
const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // WSL / Windows 挂载目录下原生文件事件可能丢失，启用轮询保证 HMR 生效
    watch: { usePolling: true, interval: 400 },
    proxy: {
      // 业务接口 — 仅代理 /api/v1，避免拦截前端 /api 文档路由
      '/api/v1': {
        target: PROXY_TARGET,
        changeOrigin: true,
      },
      // 健康检查与 OpenAPI 文档
      '/health': {
        target: PROXY_TARGET,
        changeOrigin: true,
      },
      '/docs': {
        target: PROXY_TARGET,
        changeOrigin: true,
      },
      '/openapi.json': {
        target: PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
})
