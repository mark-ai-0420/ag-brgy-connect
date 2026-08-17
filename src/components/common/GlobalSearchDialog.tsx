import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Search, Megaphone, Calendar, Store, Users, FileText, Map, Phone, AlertTriangle, X, Loader2 } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { ScrollArea } from '#/components/ui/scroll-area'
import { globalSearchFn } from '#/server/globalSearch'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function GlobalSearchDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const searchFn = useServerFn(globalSearchFn)
  
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 250)
  
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    announcements: any[]
    events: any[]
    businesses: any[]
    officials: any[]
  } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults(null)
    }
  }, [open])

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        setResults(null)
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await searchFn({ data: { query: debouncedQuery } })
        setResults(res)
      } catch (err) {
        console.error('Search error:', err)
        setResults(null)
      } finally {
        setLoading(false)
      }
    }
    performSearch()
  }, [debouncedQuery, searchFn])

  const handleNavigate = useCallback((path: string) => {
    onOpenChange(false)
    router.navigate({ to: path })
  }, [onOpenChange, router])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <DialogDescription className="sr-only">Search across the barangay</DialogDescription>
        
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none border-0 focus-visible:ring-0 shadow-none"
            autoFocus
          />
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
          {query && !loading && (
            <button onClick={() => setQuery('')} className="ml-2 rounded-full p-1 hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        <ScrollArea className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
          {!debouncedQuery ? (
            <div className="p-4 space-y-4">
              <div className="text-xs font-semibold text-muted-foreground px-2 uppercase">Quick Navigation</div>
              <div className="grid gap-1">
                <button onClick={() => handleNavigate('/documents')} className="flex items-center w-full px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground text-left">
                  <FileText className="mr-2 h-4 w-4" /> Request Document
                </button>
                <button onClick={() => handleNavigate('/map')} className="flex items-center w-full px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground text-left">
                  <Map className="mr-2 h-4 w-4" /> View GIS Map
                </button>
                <button onClick={() => handleNavigate('/emergency')} className="flex items-center w-full px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground text-left">
                  <Phone className="mr-2 h-4 w-4" /> Emergency Directory
                </button>
                <button onClick={() => handleNavigate('/complaints/new')} className="flex items-center w-full px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground text-left">
                  <AlertTriangle className="mr-2 h-4 w-4" /> File Incident Report
                </button>
              </div>
            </div>
          ) : results ? (
            <div className="p-4 space-y-6">
              {results.announcements?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground px-2 uppercase mb-2">Announcements</div>
                  {results.announcements.map((item) => (
                    <button key={item.id} onClick={() => handleNavigate(`/announcements/${item.id}`)} className="flex items-center w-full px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground text-left">
                      <Megaphone className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.events?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground px-2 uppercase mb-2">Events</div>
                  {results.events.map((item) => (
                    <button key={item.id} onClick={() => handleNavigate(`/events/${item.id}`)} className="flex items-center w-full px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground text-left">
                      <Calendar className="mr-2 h-4 w-4 text-green-500 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.businesses?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground px-2 uppercase mb-2">Businesses</div>
                  {results.businesses.map((item) => (
                    <button key={item.id} onClick={() => handleNavigate(`/directory/${item.id}`)} className="flex items-center w-full px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground text-left">
                      <Store className="mr-2 h-4 w-4 text-orange-500 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.officials?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground px-2 uppercase mb-2">Officials</div>
                  {results.officials.map((item) => (
                    <button key={item.id} onClick={() => handleNavigate(`/officials`)} className="flex items-center w-full px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground text-left">
                      <Users className="mr-2 h-4 w-4 text-purple-500 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.announcements.length === 0 && results.events.length === 0 && results.businesses.length === 0 && results.officials.length === 0 && (
                <div className="py-14 text-center text-sm text-muted-foreground">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </div>
          ) : (
            <div className="py-14 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
