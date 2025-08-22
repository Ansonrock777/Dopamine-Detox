'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, X, Smartphone, Monitor, Zap, Shield } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installSource, setInstallSource] = useState<'browser' | 'manual'>('browser')

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if running on iOS Safari (PWA support but no beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (window.navigator as { standalone?: boolean }).standalone

    if (isIOS && !isInStandaloneMode) {
      setInstallSource('manual')
      
      // Show manual install prompt for iOS after a delay
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (!dismissed) {
          setIsVisible(true)
        }
      }, 5000) // Show after 5 seconds

      return () => clearTimeout(timer)
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      
      // Save the event so it can be triggered later
      setDeferredPrompt(e)
      setInstallSource('browser')
      
      // Show install prompt after a delay
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (!dismissed) {
          setIsVisible(true)
        }
      }, 3000) // Show after 3 seconds

      return () => clearTimeout(timer)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed')
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as unknown as (e: Event) => void)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as unknown as (e: Event) => void)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (installSource === 'browser' && deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      console.log(`[PWA] User response to install prompt: ${outcome}`)
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt')
      }

      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null)
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Remember that user dismissed the prompt (expires in 7 days)
    const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000)
    localStorage.setItem('pwa-install-dismissed', dismissedUntil.toString())
  }

  // Don't show if already installed
  if (isInstalled || !isVisible) {
    return null
  }

  const isIOS = installSource === 'manual'

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="bg-gradient-to-r from-blue-600/95 to-purple-600/95 backdrop-blur-sm border-blue-400/20 text-white shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-full">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Install Dopamine Detox</CardTitle>
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/20 mt-1">
                  PWA
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="py-4">
          <CardDescription className="text-white/90 mb-4">
            Get the full app experience with offline access, faster loading, and native-like features.
          </CardDescription>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-white/90">Lightning fast</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-300" />
              <span className="text-white/90">Works offline</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-300" />
              <span className="text-white/90">Full screen</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-purple-300" />
              <span className="text-white/90">No app store</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          {isIOS ? (
            <div className="w-full">
              <Button 
                onClick={handleDismiss}
                className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold mb-3"
              >
                Got it!
              </Button>
              <div className="text-xs text-white/80 space-y-1">
                <p>To install on iOS:</p>
                <p>1. Tap the Share button (↗)</p>
                <p>2. Select &quot;Add to Home Screen&quot;</p>
                <p>3. Tap &quot;Add&quot; to install</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
              >
                Maybe later
              </Button>
              <Button
                onClick={handleInstallClick}
                disabled={!deferredPrompt}
                className="flex-1 bg-white text-blue-600 hover:bg-white/90 font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}