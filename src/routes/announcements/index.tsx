import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardFooter, CardHeader } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Bell, Pin, CalendarDays, ChevronRight, Filter, Megaphone } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useState, useMemo } from 'react'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useBarangayScope } from '#/hooks/useBarangayScope'
import { FeedSkeleton } from '#/components/common/FeedSkeleton'

export const getAnnouncements = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, pinned, created_at, author_id, category, scope, image_url')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching announcements:', error)
    return data ?? []
  } catch (error) {
    console.error('Error in getAnnouncements:', error)
    return []
  }
})

export const Route = createFileRoute('/announcements/')({
  component: AnnouncementsRoute,
  loader: () => getAnnouncements(),
  pendingComponent: () => <FeedSkeleton />,
})

const CATEGORY_COLORS: Record<string, string> = {
  General: 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-100 border border-slate-300 font-semibold',
  Advisory: 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 font-semibold',
  Emergency: 'bg-red-100 text-red-950 dark:bg-red-900/50 dark:text-red-200 border border-red-300 font-semibold',
  Programs: 'bg-purple-100 text-purple-950 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-300 font-semibold',
  Infrastructure: 'bg-orange-100 text-orange-950 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-300 font-semibold',
  Health: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 font-semibold',
}

function AnnouncementCard({ item, highlighted = false }: { item: any; highlighted?: boolean }) {
  const truncatedBody = item.body.split(' ').slice(0, 24).join(' ') + (item.body.split(' ').length > 24 ? '…' : '')

  return (
    <Card className={`group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border ${
      highlighted
        ? 'border-amber-400/80 dark:border-amber-500/80 bg-gradient-to-b from-amber-50/40 to-card dark:from-amber-950/20 dark:to-card ring-1 ring-amber-400/30'
        : 'hover:border-primary/40 bg-card'
    }`}>
      {/* Hero Banner / Fallback */}
      <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-muted/60">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 text-primary/40 group-hover:text-primary/60 transition-colors">
            <div className="p-3 rounded-full bg-background/70 shadow-xs backdrop-blur-xs">
              <Megaphone className="h-6 w-6 text-primary/70" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground/70 mt-2 tracking-wide uppercase">
              Official Barangay Notice
            </span>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.pinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 shadow-sm border border-amber-500/40 backdrop-blur-sm">
                <Pin className="h-3 w-3 fill-slate-950" />
                Pinned
              </span>
            )}
            {item.category && (
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-md ${
                CATEGORY_COLORS[item.category] ?? 'bg-background/90 text-foreground border border-border'
              }`}>
                {item.category}
              </span>
            )}
          </div>
          {item.scope && (
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs backdrop-blur-md ${
              item.scope === 'both' ? 'bg-slate-900/80 text-white dark:bg-slate-100 dark:text-slate-900' :
              item.scope === 'daine_1' ? 'bg-[#0038A8] text-white' :
              'bg-[#CE1126] text-white'
            }`}>
              {item.scope === 'both' ? 'All Daine' : item.scope === 'daine_1' ? 'Daine 1' : 'Daine 2'}
            </span>
          )}
        </div>
      </div>

      <CardHeader className="pb-2 pt-4 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/80" />
          {format(parseISO(item.created_at), 'MMMM d, yyyy')}
        </div>
        <h2 className="text-lg font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h2>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {truncatedBody}
        </p>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-muted/10">
        <Button
          variant="ghost"
          size="default"
          className="w-full justify-between text-primary hover:text-primary hover:bg-primary/10 font-semibold min-h-[44px] px-3"
          asChild
        >
          <Link to={`/announcements/${item.id}` as any}>
            <span>Read Full Announcement</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function AnnouncementsRoute() {
  const announcements = Route.useLoaderData()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const { scope: activeBarangayScope } = useBarangayScope()

  const categories = ['All', 'General', 'Health', 'Infrastructure', 'Emergency', 'Advisory', 'Programs']

  const filteredAnnouncements = useMemo(() => {
    let filtered = announcements
    
    // Filter by barangay scope
    if (activeBarangayScope !== 'all') {
      const dbScope = activeBarangayScope === 'daine1' ? 'daine_1' : 'daine_2'
      filtered = filtered.filter((a: any) => a.scope === 'both' || a.scope === dbScope)
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((a: any) => a.category === selectedCategory)
    }
    
    return filtered
  }, [announcements, selectedCategory, activeBarangayScope])

  const pinned = filteredAnnouncements.filter((a: any) => a.pinned)
  const regular = filteredAnnouncements.filter((a: any) => !a.pinned)

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Latest updates, notices, and advisories from Barangay Daine.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Filter className="h-4 w-4 text-muted-foreground mr-1" />
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full min-h-[36px] px-3.5"
          >
            {cat}
          </Button>
        ))}
      </div>

      {filteredAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 border border-dashed rounded-2xl">
          <div className="bg-muted rounded-full p-6">
            <Bell className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No announcements found</h2>
          <p className="text-muted-foreground max-w-xs">Check back later or try clearing your category filter.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Pinned Announcements */}
          {pinned.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Pinned Notices
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pinned.map(item => (
                  <AnnouncementCard key={item.id} item={item} highlighted />
                ))}
              </div>
            </section>
          )}

          {/* Regular Announcements */}
          {regular.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  All Announcements
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regular.map(item => (
                  <AnnouncementCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
