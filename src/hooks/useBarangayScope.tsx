import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type BarangayScope = 'all' | 'daine1' | 'daine2'

interface BarangayScopeContextType {
  scope: BarangayScope
  setScope: (scope: BarangayScope) => void
}

const BarangayScopeContext = createContext<BarangayScopeContextType | undefined>(undefined)

export function BarangayScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<BarangayScope>('all')

  useEffect(() => {
    const saved = localStorage.getItem('barangay_scope') as BarangayScope
    if (saved && ['all', 'daine1', 'daine2'].includes(saved)) {
      setScopeState(saved)
    }
  }, [])

  const setScope = (newScope: BarangayScope) => {
    setScopeState(newScope)
    localStorage.setItem('barangay_scope', newScope)
  }

  return (
    <BarangayScopeContext.Provider value={{ scope, setScope }}>
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
