import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Calendar, MapPin, Clock, CalendarX } from 'lucide-react'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'

const getEvents = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.from('events').select('*').order('starts_at', { ascending: true })
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
})

const EVENT_TYPE_COLORS: Record<string, string> = {
  Meeting: 'bg-blue-100 text-blue-950 border border-blue-300 font-semibold',
  Sports: 'bg-amber-100 text-amber-950 border border-amber-300 font-semibold',
  Environment: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-semibold',
  Health: 'bg-green-100 text-green-950 border border-green-300 font-semibold',
  Cultural: 'bg-purple-100 text-purple-950 border border-purple-300 font-semibold',
  Other: 'bg-slate-100 text-slate-950 border border-slate-300 font-semibold',
}

function EventsRoute() {
  const events = Route.useLoaderData()
  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-full shrink-0">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Events</h1>
          <p className="text-muted-foreground mt-1">
            Join activities and gatherings in our barangay.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event: any) => {
            const category = event.category || event.type || 'Other'
            const badgeClass =
              EVENT_TYPE_COLORS[category] ?? EVENT_TYPE_COLORS.Other
            const dateObj = event.starts_at ? new Date(event.starts_at) : new Date()
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
            const formattedTime = dateObj.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })

            return (
              <Card
                key={event.id}
                className="flex flex-col card-hover border hover:border-primary/40"
              >
                <CardHeader className="pb-3">
                  {/* Type badge */}
                  <span
                    className={`inline-flex self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-2 ${badgeClass}`}
                  >
                    {category}
                  </span>
                  <CardTitle className="text-base leading-snug">{event.title}</CardTitle>
                </CardHeader>

                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                    <span>{formattedTime}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/70" />
                    <span>{event.location}</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t">
                  <Button variant="ghost" size="default" className="w-full min-h-[44px] text-primary hover:text-primary hover:bg-primary/10 font-semibold" asChild>
                    <Link to="/events/$eventId" params={{ eventId: event.id }}>
                      View Details
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
