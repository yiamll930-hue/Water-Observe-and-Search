import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Loading from './components/Loading/Loading'

const Workspace = lazy(() => import('./pages/Workspace/Workspace'))
const Extract = lazy(() => import('./pages/Extract/Extract'))
const MapPage = lazy(() => import('./pages/Map/Map'))
const TimeSeries = lazy(() => import('./pages/TimeSeries/TimeSeries'))
const Tasks = lazy(() => import('./pages/Tasks/Tasks'))
const About = lazy(() => import('./pages/About/About'))

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
          <Route path="extract" element={<Suspense fallback={<Loading />}><Extract /></Suspense>} />
          <Route path="map" element={<Suspense fallback={<Loading />}><MapPage /></Suspense>} />
          <Route path="timeseries" element={<Suspense fallback={<Loading />}><TimeSeries /></Suspense>} />
          <Route path="tasks" element={<Suspense fallback={<Loading />}><Tasks /></Suspense>} />
          <Route path="about" element={<Suspense fallback={<Loading />}><About /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
