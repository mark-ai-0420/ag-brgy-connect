import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardFooter, CardHeader } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Bell, Pin, CalendarDays, ChevronRight, Filter } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useState, useMemo } from 'react'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'

export const getAnnouncements = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.from('announcements').select('id, title, body, pinned, created_at, author_id, category').order('pinned', { ascending: false }).order('created_at', { ascending: false })
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
  const truncatedBody = item.body.split(' ').slice(0, 28).join(' ') + (item.body.split(' ').length > 28 ? '…' : '')

  return (
    <Card className={`flex flex-col transition-shadow hover:shadow-md ${highlighted ? 'border-amber-400 dark:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {item.pinned && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-400 dark:border-amber-700">
                  <Pin className="h-3 w-3 text-amber-800 dark:text-amber-300" />
                  Pinned
                </span>
              )}
              {item.category && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] ?? 'bg-muted text-muted-foreground'}`}>
                  {item.category}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold leading-snug">{item.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {format(parseISO(item.created_at), 'MMMM d, yyyy')}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{truncatedBody}</p>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <Button variant="ghost" size="default" className="ml-auto gap-1 text-primary hover:text-primary hover:bg-primary/10 font-semibold min-h-[44px] px-4" asChild>
          <Link to={`/announcements/${item.id}` as any}>
            Read More <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function AnnouncementsRoute() {
  const announcements = Route.useLoaderData()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = ['All', 'General', 'Health', 'Infrastructure', 'Emergency', 'Advisory', 'Programs']

  const filteredAnnouncements = useMemo(() => {
    if (selectedCategory === 'All') return announcements
    return announcements.filter((a: any) => a.category === selectedCategory)
  }, [announcements, selectedCategory])

  const pinned = filteredAnnouncements.filter((a: any) => a.pinned)
  const regular = filteredAnnouncements.filter((a: any) => !a.pinned)

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-full">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Latest updates and notices from Barangay Daine.</p>
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
            className="rounded-full min-h-[32px]"
          >
            {cat}
          </Button>
        ))}
      </div>

      {filteredAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="bg-muted rounded-full p-6">
            <Bell className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No announcements yet</h2>
          <p className="text-muted-foreground max-w-xs">Check back later for updates from the barangay.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Pinned Announcements */}
          {pinned.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Pin className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Pinned
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
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
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  All Announcements
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
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
