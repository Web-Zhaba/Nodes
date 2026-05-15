import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile.css'
import './lib/i18n'
import { initializeMobileApp } from './lib/capacitor'
import App from './App.tsx'

// Initialize Capacitor native layer before rendering
initializeMobileApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
