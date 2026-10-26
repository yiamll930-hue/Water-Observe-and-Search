import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Loading from './components/Loading/Loading'

const Workspace = lazy(() => import('./pages/Workspace/Workspace'))
const Analyze = lazy(() => import('./pages/Analyze/Analyze'))
const Analyses = lazy(() => import('./pages/Analyses/Analyses'))
const AnalysisDetail = lazy(() => import('./pages/AnalysisDetail/AnalysisDetail'))
const Algorithms = lazy(() => import('./pages/Algorithms/Algorithms'))
const MapPage = lazy(() => import('./pages/Map/Map'))
const ApiDocs = lazy(() => import('./pages/ApiDocs/ApiDocs'))
const About = lazy(() => import('./pages/About/About'))
const NotFound = lazy(() => import('./pages/NotFound/NotFound'))

export default function App() {
  // 初始化主题
  useEffect(() => {
    const t = localStorage.getItem('sw-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Suspense fallback={<Loading />}><Workspace /></Suspense>} />
          <Route path="analyze" element={<Suspense fallback={<Loading />}><Analyze /></Suspense>} />
          <Route path="analyses" element={<Suspense fallback={<Loading />}><Analyses /></Suspense>} />
          <Route path="analyses/:id" element={<Suspense fallback={<Loading />}><AnalysisDetail /></Suspense>} />
          <Route path="algorithms" element={<Suspense fallback={<Loading />}><Algorithms /></Suspense>} />
          <Route path="map" element={<Suspense fallback={<Loading />}><MapPage /></Suspense>} />
          <Route path="api" element={<Suspense fallback={<Loading />}><ApiDocs /></Suspense>} />
          <Route path="about" element={<Suspense fallback={<Loading />}><About /></Suspense>} />
          {/* 旧入口兼容：提取与任务分别并入新建分析、分析记录 */}
          <Route path="extract" element={<Navigate to="/analyze" replace />} />
          <Route path="tasks" element={<Navigate to="/analyses" replace />} />
          <Route path="*" element={<Suspense fallback={<Loading />}><NotFound /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
