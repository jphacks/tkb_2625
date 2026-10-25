import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {App} from './App.tsx'
import { EventCreatePage } from './EventCreatePage.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {location.pathname === '/admin/events/new' ? <EventCreatePage /> : <App />}
  </StrictMode>,
)
