import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Calendar, MapPin, Clock, CalendarX, ChevronRight, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useBarangayScope } from '#/hooks/useBarangayScope'
import { useMemo } from 'react'
import { FeedSkeleton } from '#/components/common/FeedSkeleton'

export const getEvents = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, location, starts_at, ends_at, created_at, scope, image_url')
      .order('starts_at', { ascending: true })
    if (error) console.error('Error fetching events:', error)
    return data ?? []
  } catch (error) {
    console.error('Error in getEvents:', error)
    return []
  }
})

export const Route = createFileRoute('/events/')({
  component: EventsRoute,
  loader: () => getEvents(),
  pendingComponent: () => <FeedSkeleton />,
})

const EVENT_TYPE_COLORS: Record<string, string> = {
  Meeting: 'bg-blue-100 text-blue-950 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300 font-semibold',
  Sports: 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 font-semibold',
  Environment: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 font-semibold',
  Health: 'bg-green-100 text-green-950 dark:bg-green-900/50 dark:text-green-200 border border-green-300 font-semibold',
  Cultural: 'bg-purple-100 text-purple-950 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-300 font-semibold',
  Community: 'bg-indigo-100 text-indigo-950 dark:bg-indigo-900/50 dark:text-indigo-200 border border-indigo-300 font-semibold',
  Other: 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 font-semibold',
}

function EventsRoute() {
  const allEvents = Route.useLoaderData()
  const { scope: activeBarangayScope } = useBarangayScope()

  const events = useMemo(() => {
    if (activeBarangayScope === 'all') return allEvents
    const dbScope = activeBarangayScope === 'daine1' ? 'daine_1' : 'daine_2'
    return allEvents.filter((e: any) => e.scope === 'both' || e.scope === dbScope)
  }, [allEvents, activeBarangayScope])

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-2xl shrink-0">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Events</h1>
          <p className="text-muted-foreground mt-1">
            Join activities, assemblies, and gatherings in Barangay Daine.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 border border-dashed rounded-2xl">
          <div className="bg-muted rounded-full p-6">
            <CalendarX className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1">No upcoming events</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              There are no events scheduled right now. Check back soon for community activities!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => {
            const category = event.category || event.type || 'Other'
            const badgeClass = EVENT_TYPE_COLORS[category] ?? EVENT_TYPE_COLORS.Other
            const dateObj = event.starts_at ? new Date(event.starts_at) : new Date()
            const monthStr = format(dateObj, 'MMM')
            const dayStr = format(dateObj, 'd')
            const formattedDate = format(dateObj, 'MMMM d, yyyy')
            const formattedTime = format(dateObj, 'h:mm a')

            return (
              <Card
                key={event.id}
                className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border hover:border-primary/40 bg-card"
              >
                {/* Hero Banner / Fallback with Date Badge */}
                <div className="relative w-full h-48 overflow-hidden bg-muted/60">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 text-primary/40 group-hover:text-primary/60 transition-colors">
                      <div className="p-3 rounded-full bg-background/70 shadow-xs backdrop-blur-xs">
                        <Calendar className="h-6 w-6 text-primary/70" />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground/70 mt-2 tracking-wide uppercase">
                        Barangay Activity
                      </span>
                    </div>
                  )}

                  {/* Floating Date Badge on Image */}
                  <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border text-center pointer-events-none">
                    <span className="block text-[10px] font-extrabold uppercase text-primary tracking-wider leading-none">{monthStr}</span>
                    <span className="block text-lg font-black text-foreground leading-tight">{dayStr}</span>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-md ${badgeClass}`}>
                      {category}
                    </span>
                    {event.scope && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs backdrop-blur-md ${
                        event.scope === 'both' ? 'bg-slate-900/80 text-white dark:bg-slate-100 dark:text-slate-900' :
                        event.scope === 'daine_1' ? 'bg-[#0038A8] text-white' :
                        'bg-[#CE1126] text-white'
                      }`}>
                        {event.scope === 'both' ? 'All Daine' : event.scope === 'daine_1' ? 'Daine 1' : 'Daine 2'}
                      </span>
                    )}
                  </div>
                </div>

                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground pb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <span>{formattedTime}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  {event.organizer && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                      <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">By {event.organizer}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t bg-muted/10">
                  <Button
                    variant="ghost"
                    size="default"
                    className="w-full justify-between text-primary hover:text-primary hover:bg-primary/10 font-semibold min-h-[44px] px-3"
                    asChild
                  >
                    <Link to="/events/$eventId" params={{ eventId: event.id }}>
                      <span>View Event Details</span>
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
