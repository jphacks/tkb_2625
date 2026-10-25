import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App'
import LoginPage from './LoginPage'
import { LexClientProvider } from './lexClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LexClientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </LexClientProvider>
  </StrictMode>,
)
