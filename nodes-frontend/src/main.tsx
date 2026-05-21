import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/browser";
import './index.css'
import './styles/mobile.css'
import './lib/i18n'
import { initializeMobileApp } from './lib/capacitor'
import App from './App.tsx'

Sentry.init({
  dsn: "https://a5caa9f895be6c20a7926ad5a7a8bbc1@o4511429709529088.ingest.de.sentry.io/4511429721522256",
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/nodes-backend-.*\.vercel\.app/, /^https:\/\/nodes-tracker\.ru/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});

// Initialize Capacitor native layer before rendering
initializeMobileApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
