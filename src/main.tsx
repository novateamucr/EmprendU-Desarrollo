import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

async function enableMocking() {
  if (import.meta.env.VITE_USE_MSW !== 'true') {
    console.log('MSW disabled via VITE_USE_MSW environment variable')
    return
  }

  try {
    const { worker } = await import('./mocks/browser')
    
    // Configure service worker URL with BASE_URL
    const swUrl = `${import.meta.env.BASE_URL}mockServiceWorker.js`
    
    await worker.start({
      serviceWorker: {
        url: swUrl
      },
      onUnhandledRequest: 'bypass'
    })
    
    console.log('MSW started successfully')
  } catch (error) {
    console.error('Failed to start MSW:', error)
    
    // In development, try to clean up corrupted service workers
    if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(registration => registration.unregister()))
        console.log('Cleaned up service worker registrations')
      } catch (cleanupError) {
        console.warn('Failed to cleanup service workers:', cleanupError)
      }
    }
    
    // Don't throw - let the app continue without MSW
    console.warn('App will continue without MSW mocking')
  }
}

// Always render the app, regardless of MSW status
async function startApp() {
  try {
    await enableMocking()
  } catch (error) {
    console.error('MSW initialization failed:', error)
  } finally {
    // Always render the app
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }
}

startApp();