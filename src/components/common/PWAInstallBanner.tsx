import { useState, useEffect } from 'react'
import { Download, X, Smartphone, ShieldCheck } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isDismissed, setIsDismissed] = useState(true) // Start dismissed until event fires
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already in standalone mode
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true

      if (isStandalone) {
        setIsInstalled(true)
        return
      }

      // Check if user previously dismissed in this session
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true'
      if (dismissed) {
        return
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsDismissed(false)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsDismissed(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsDismissed(true)
      }
      setDeferredPrompt(null)
    } catch (err) {
      console.warn('PWA install prompt error:', err)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_banner_dismissed', 'true')
    }
  }

  if (isInstalled || isDismissed || !deferredPrompt) {
    return null
  }

  return (
    <aside aria-label="PWA install prompt" className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card text-card-foreground border-2 border-primary/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md bg-card/95 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-sm">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground leading-tight flex items-center gap-1.5">
                Install BrgyConnect App
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                  PWA
                </span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Access emergency contacts, digital resident ID, and document tracking even when offline.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs h-8 px-3 text-muted-foreground"
          >
            Maybe Later
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleInstallClick}
            className="text-xs h-8 px-4 font-bold bg-[#0038A8] hover:bg-[#002878] text-white shadow-sm"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Install App
          </Button>
        </div>
      </div>
    </aside>
  )
}
