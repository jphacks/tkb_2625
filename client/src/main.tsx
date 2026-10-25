import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App'
import LoginPage from './LoginPage'
import { LexClientProvider } from './lexClient'

const RankingPage = lazy(() => import('./RankingPage'))
const EventsPage = lazy(() => import('./EventsPage'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LexClientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/events" element={<Suspense fallback={<main className="empty" role="status">イベントを読み込んでいます…</main>}><EventsPage /></Suspense>} />
          <Route path="/ranking" element={<Suspense fallback={<main className="empty" role="status">ランキングを読み込んでいます…</main>}><RankingPage /></Suspense>} />
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </LexClientProvider>
  </StrictMode>,
)
