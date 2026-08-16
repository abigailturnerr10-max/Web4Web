import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

// registerType: 'autoUpdate' — once a new deployment's service worker takes
// control, this reloads the page automatically so an already-open tab never
// keeps running stale JS indefinitely. No-ops harmlessly in dev (no SW
// present) and doesn't run at all if the browser lacks SW support.
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
