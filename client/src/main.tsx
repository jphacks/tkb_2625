import { lazy, StrictMode, Suspense, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import LoginPage from './routes/LoginPage'
import { empty } from './lib/ui'
import NotFoundPage from './routes/NotFoundPage'
import { AuthProvider, RequireAuth } from './auth/AuthProvider'
import { CALLBACK_PATH } from './auth/clientMetadata'
import { ATPASSPORT_CALLBACK_PATH } from './auth/atpassport'
import AtPassportCallback from './auth/AtPassportCallback'

const EventsPage = lazy(() => import('./routes/EventsPage'))
const RankingRedirect = lazy(() => import('./routes/RankingRedirect'))
const RankingPage = lazy(() => import('./routes/event/RankingPage'))
const AdminRankingPage = lazy(() => import('./routes/admin/RankingPage'))
const EventLayout = lazy(() => import('./routes/event/EventLayout'))
const CardsPage = lazy(() => import('./routes/event/CardsPage'))
const TeamPage = lazy(() => import('./routes/event/TeamPage'))
const MapPage = lazy(() => import('./routes/event/MapPage'))
const AdminHomePage = lazy(() => import('./routes/admin/AdminHomePage'))
const EventCreatePage = lazy(() => import('./routes/admin/EventCreatePage'))
const AdminEventLayout = lazy(() => import('./routes/admin/AdminEventLayout'))
const ReviewPage = lazy(() => import('./routes/admin/ReviewPage'))
const CheckpointsPage = lazy(() => import('./routes/admin/CheckpointsPage'))
const TeamsPage = lazy(() => import('./routes/admin/TeamsPage'))

const page = (element: ReactNode) => <Suspense fallback={<main className={empty} role="status">読み込んでいます…</main>}>{element}</Suspense>

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
            <Route path="/" element={<Navigate to="/events" replace />} />
            <Route path="/events" element={page(<EventsPage />)} />
            {/* 旧 URL。大会画面のランキングタブへ転送する */}
            <Route path="/ranking" element={page(<RankingRedirect />)} />
            {/* イベントは at-uri の did / rkey で指定する (lib/eventUri.ts) */}
            <Route path="/events/:did/:rkey" element={page(<EventLayout />)}>
              <Route index element={<Navigate to="cards" replace />} />
              <Route path="cards" element={page(<CardsPage />)} />
              <Route path="team" element={page(<TeamPage />)} />
              <Route path="map" element={page(<MapPage />)} />
              <Route path="ranking" element={page(<RankingPage />)} />
            </Route>
            <Route path="/admin" element={page(<AdminHomePage />)} />
            <Route path="/admin/events/new" element={page(<EventCreatePage />)} />
            <Route path="/admin/events/:did/:rkey" element={page(<AdminEventLayout />)}>
              <Route index element={<Navigate to="review" replace />} />
              <Route path="review" element={page(<ReviewPage />)} />
              <Route path="checkpoints" element={page(<CheckpointsPage />)} />
              <Route path="teams" element={page(<TeamsPage />)} />
              <Route path="ranking" element={page(<AdminRankingPage />)} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
