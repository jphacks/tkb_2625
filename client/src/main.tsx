import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App'
import LoginPage from './LoginPage'
import { EventCreatePage } from './EventCreatePage'
import { AuthProvider, RequireAuth } from './auth/AuthProvider'
import { CALLBACK_PATH } from './auth/clientMetadata'
import { ATPASSPORT_CALLBACK_PATH } from './auth/atpassport'
import AtPassportCallback from './auth/AtPassportCallback'

const RankingPage = lazy(() => import('./RankingPage'))
const EventsPage = lazy(() => import('./EventsPage'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path={ATPASSPORT_CALLBACK_PATH} element={<AtPassportCallback />} />
          {/* コールバックは AuthProvider が処理して遷移するので、ここに来るのは処理済みの URL を開き直したときだけ */}
          <Route path={CALLBACK_PATH} element={<Navigate to="/" replace />} />
          <Route element={<RequireAuth />}>
            <Route path="/events" element={<Suspense fallback={<main className="empty" role="status">イベントを読み込んでいます…</main>}><EventsPage /></Suspense>} />
            <Route path="/admin/events/new" element={<EventCreatePage />} />
            <Route path="/ranking" element={<Suspense fallback={<main className="empty" role="status">ランキングを読み込んでいます…</main>}><RankingPage /></Suspense>} />
            <Route path="*" element={<App />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
