import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'

export type BarangayScope = 'all' | 'daine1' | 'daine2' | (string & {})

interface BarangayScopeContextType {
  scope: BarangayScope
  setScope: (scope: BarangayScope) => void
}

const BarangayScopeContext = createContext<BarangayScopeContextType | undefined>(undefined)

export function BarangayScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<BarangayScope>('all')

  useEffect(() => {
    // Check saved local storage or cookie
    const saved = localStorage.getItem('barangay_scope') as BarangayScope
    const cookieMatch = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)brgy_tenant_slug=([^;]+)/) : null
    const cookieSlug = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null

    if (saved) {
      setScopeState(saved)
    } else if (cookieSlug) {
      if (cookieSlug === 'daine-1' || cookieSlug === 'daine1') {
        setScopeState('daine1')
      } else if (cookieSlug === 'daine-2' || cookieSlug === 'daine2') {
        setScopeState('daine2')
      } else {
        setScopeState(cookieSlug)
      }
    }
  }, [])

  const setScope = useCallback((newScope: BarangayScope) => {
    setScopeState(newScope)
    localStorage.setItem('barangay_scope', newScope)
    
    // Also sync tenant cookie if not 'all'
    if (typeof document !== 'undefined') {
      if (newScope === 'all') {
        // keep or default
      } else {
        const slug = newScope === 'daine1' ? 'daine-1' : newScope === 'daine2' ? 'daine-2' : newScope
        localStorage.setItem('brgy_tenant_slug', slug)
        document.cookie = `brgy_tenant_slug=${encodeURIComponent(slug)}; path=/; max-age=31536000; SameSite=Lax`
      }
    }
  }, [])

  const value = useMemo(() => ({ scope, setScope }), [scope, setScope])

  return (
    <BarangayScopeContext.Provider value={value}>
      {children}
    </BarangayScopeContext.Provider>
  )
}

export function useBarangayScope() {
  const context = useContext(BarangayScopeContext)
  if (!context) {
    throw new Error('useBarangayScope must be used within a BarangayScopeProvider')
  }
  return context
}
