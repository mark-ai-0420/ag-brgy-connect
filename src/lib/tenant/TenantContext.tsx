import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import { getAllBarangays, setActiveTenantCookie, type Barangay, DEFAULT_BARANGAYS } from '#/server/tenant'
import { useAuth } from '#/hooks/useAuth'

interface TenantContextType {
  barangays: Barangay[]
  activeBarangay: Barangay
  activeTenantSlug: string
  setTenantSlug: (slug: string) => Promise<void>
  isLoading: boolean
  refreshBarangays: () => Promise<void>
  formatControlNumber: (codePrefix: string | undefined, id: string) => string
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, barangay_id, barangay: userBarangayLegacy } = useAuth()
  const [barangays, setBarangays] = useState<Barangay[]>(DEFAULT_BARANGAYS)
  const [activeSlug, setActiveSlug] = useState<string>('daine-1')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshBarangays = useCallback(async () => {
    try {
      const list = await getAllBarangays({ data: false })
      if (list && list.length > 0) {
        setBarangays(list)
      }
    } catch {
      // Keep defaults
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refreshBarangays()
  }, [refreshBarangays])

  // Sync active slug from user profile, cookie, or localStorage
  useEffect(() => {
    // 1. If user is authenticated and bound to a specific barangay
    if (user && barangay_id) {
      const matched = barangays.find((b) => b.id === barangay_id)
      if (matched) {
        setActiveSlug(matched.slug)
        return
      }
    } else if (user && userBarangayLegacy) {
      if (userBarangayLegacy === 'daine_2') {
        setActiveSlug('daine-2')
        return
      }
      if (userBarangayLegacy === 'daine_1') {
        setActiveSlug('daine-1')
        return
      }
    }

    // 2. Read from document.cookie or localStorage
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)brgy_tenant_slug=([^;]+)/)
      const cookieSlug = match ? decodeURIComponent(match[1]) : null
      const localSlug = localStorage.getItem('brgy_tenant_slug')
      const target = cookieSlug || localSlug

      if (target) {
        const found = barangays.find(
          (b) => b.slug.toLowerCase() === target.toLowerCase() || b.id === target
        )
        if (found) {
          setActiveSlug(found.slug)
          return
        }
      }
    }
  }, [user, barangay_id, userBarangayLegacy, barangays])

  const setTenantSlug = useCallback(
    async (slug: string) => {
      const clean = slug.trim().toLowerCase()
      setActiveSlug(clean)
      if (typeof window !== 'undefined') {
        localStorage.setItem('brgy_tenant_slug', clean)
        document.cookie = `brgy_tenant_slug=${encodeURIComponent(clean)}; path=/; max-age=31536000; SameSite=Lax`
      }
      try {
        await setActiveTenantCookie({ data: clean })
      } catch {
        // Cookie fallback is already in document.cookie
      }
      await router.invalidate()
    },
    [router]
  )

  const activeBarangay = useMemo(() => {
    const found = barangays.find(
      (b) =>
        b.slug.toLowerCase() === activeSlug.toLowerCase() ||
        b.id.toLowerCase() === activeSlug.toLowerCase()
    )
    return found || barangays[0] || DEFAULT_BARANGAYS[0]
  }, [barangays, activeSlug])

  const formatControlNumber = useCallback(
    (codePrefix: string | undefined, id: string) => {
      const prefix = codePrefix || activeBarangay.code_prefix || 'BD'
      const cleanId = (id || '').replace(/-/g, '').slice(0, 8).toUpperCase()
      return `${prefix}-${cleanId}`
    },
    [activeBarangay]
  )

  const value = useMemo(
    () => ({
      barangays,
      activeBarangay,
      activeTenantSlug: activeSlug,
      setTenantSlug,
      isLoading,
      refreshBarangays,
      formatControlNumber,
    }),
    [
      barangays,
      activeBarangay,
      activeSlug,
      setTenantSlug,
      isLoading,
      refreshBarangays,
      formatControlNumber,
    ]
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
