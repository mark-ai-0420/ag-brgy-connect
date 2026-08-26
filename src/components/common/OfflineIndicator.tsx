import { useState, useEffect } from 'react'
import { WifiOff, Wifi, X } from 'lucide-react'
import { useNetworkStatus } from '#/hooks/useNetworkStatus'
import { cn } from '#/lib/utils'

export function OfflineIndicator() {
  const { isOffline, wasOffline, isOnline } = useNetworkStatus()
  const [showOnlineToast, setShowOnlineToast] = useState(false)
  const [dismissedOffline, setDismissedOffline] = useState(false)

  // When coming back online after being offline, show brief restoration alert
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowOnlineToast(true)
      const timer = setTimeout(() => {
        setShowOnlineToast(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [wasOffline, isOnline])

  // Reset dismissal when offline state changes
  useEffect(() => {
    if (!isOffline) {
      setDismissedOffline(false)
    }
  }, [isOffline])

  if (!isOffline && !showOnlineToast) {
    return null
  }

  return (
    <aside aria-label="Network status banner" className="relative z-50">
      {/* Offline Alert Banner */}
      {isOffline && !dismissedOffline && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-medium animate-in slide-in-from-top duration-300"
        >
          <div className="container mx-auto flex items-center justify-center gap-2.5 text-center">
            <WifiOff className="h-4 w-4 shrink-0 animate-pulse text-amber-200" />
            <span>
              <strong>Offline Mode Active</strong> — Naka-cache ang mga nakaraang records. Maaari pa ring tawagan ang emergency hotlines nang direkta.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDismissedOffline(true)}
            className="p-1 hover:bg-amber-700/60 rounded-md transition-colors text-white/80 hover:text-white shrink-0 ml-2"
            title="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Online Restored Notification */}
      {showOnlineToast && !isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="bg-emerald-600 text-white px-4 py-2 shadow-md flex items-center justify-center text-xs sm:text-sm font-medium animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 shrink-0 text-emerald-200" />
            <span>
              <strong>Online Connection Restored</strong> — Lahat ng digital services at verification portals ay live na muli.
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
