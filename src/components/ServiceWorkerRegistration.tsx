'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          })

          console.log('[PWA] Service Worker registered successfully:', registration.scope)

          // Update service worker when new version is available
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available, notify user
                  if (window.confirm('New version available! Reload to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })

          // Register for background sync
          if ('sync' in window.ServiceWorkerRegistration.prototype) {
            console.log('[PWA] Background sync is supported')
          }

        } catch (error) {
          console.error('[PWA] Service Worker registration failed:', error)
        }
      })

      // Handle app updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] New service worker activated')
        window.location.reload()
      })
    } else {
      console.log('[PWA] Service workers are not supported')
    }
  }, [])

  return null
}

// Helper function to trigger background sync
export function syncWhenOnline(tag: string) {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag)
    }).catch((error) => {
      console.error('[PWA] Background sync registration failed:', error)
    })
  }
}