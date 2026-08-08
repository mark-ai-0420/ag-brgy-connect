import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { ArrowLeft, Calendar, MapPin, Clock, Users, CalendarPlus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'

const getEvent = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('events').select('*').eq('id', id).single()
    if (error || !data) return null
    return data
  })

export const Route = createFileRoute('/events/$eventId')({
  component: EventDetail,
  loader: ({ params }) => getEvent({ data: params.eventId }),
})

const CATEGORY_STYLES: Record<string, { dot: string; badge: string }> = {
  Meeting:    { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-950 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-300 font-semibold' },
  Sports:     { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-950 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300 font-semibold' },
  Environment:{ dot: 'bg-emerald-500',  badge: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-300 font-semibold' },
  Community:  { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-950 dark:bg-purple-900/30 dark:text-purple-200 border border-purple-300 font-semibold' },
}

// Coordinates for Barangay Daine, Indang, Cavite, Philippines
const BRGY_DAINE_LAT = 14.1875
const BRGY_DAINE_LON = 120.8452

function EventDetail() {
  const event = Route.useLoaderData()

  if (!event) {
    return (
      <div className="container mx-auto py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Event Not Found</h2>
        <p className="text-muted-foreground">This event may have been removed or is no longer available.</p>
        <Button asChild>
          <Link to="/events">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
          </Link>
        </Button>
      </div>
    )
  }

  const category = event.category || event.type || 'Other'
  const dateObj = event.starts_at ? new Date(event.starts_at) : new Date()
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const catStyle = CATEGORY_STYLES[category] ?? { dot: 'bg-muted', badge: 'bg-muted text-muted-foreground' }
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${BRGY_DAINE_LON - 0.005}%2C${BRGY_DAINE_LAT - 0.004}%2C${BRGY_DAINE_LON + 0.005}%2C${BRGY_DAINE_LAT + 0.004}&layer=mapnik&marker=${BRGY_DAINE_LAT}%2C${BRGY_DAINE_LON}`

  return (
    <div className="container mx-auto py-8 md:py-10 px-4 md:px-6 max-w-5xl">
      {/* Back */}
      <Button variant="ghost" asChild className="mb-6 -ml-3 text-muted-foreground hover:text-foreground min-h-[44px] px-3">
        <Link to="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catStyle.badge}`}>
              {category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mt-3 mb-2">
              {event.title}
            </h1>
            <p className="text-muted-foreground text-sm">Organized by {event.organizer}</p>
          </div>

          {/* Description */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-semibold">About this Event</h2>
            {event.description?.split('\n\n').map((para: string, idx: number) => (
              <p key={idx} className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </div>

          {/* Map embed */}
          {event.hasLocation && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </h2>
              <p className="text-sm text-muted-foreground mb-3">{event.location}</p>
              <div className="rounded-xl overflow-hidden border h-64">
                <iframe
                  src={mapSrc}
                  title="Event location map"
                  width="100%"
                  height="100%"
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Map shows approximate location of Barangay Daine, Mandaue City.{' '}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${BRGY_DAINE_LAT}&mlon=${BRGY_DAINE_LON}#map=16/${BRGY_DAINE_LAT}/${BRGY_DAINE_LON}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Open in OpenStreetMap
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Sidebar card */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="pt-6 space-y-5">
              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-lg p-2 mt-0.5">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Date</div>
                  <div className="font-semibold">{format(dateObj, 'EEEE, MMMM d, yyyy')}</div>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-lg p-2 mt-0.5">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Time</div>
                  <div className="font-semibold">{formattedTime}</div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-lg p-2 mt-0.5">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Location</div>
                  <div className="font-semibold text-sm leading-snug">{event.location}</div>
                </div>
              </div>

              {/* Organizer */}
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-lg p-2 mt-0.5">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Organizer</div>
                  <div className="font-semibold text-sm">{event.organizer}</div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  className="w-full min-h-[44px] font-semibold gap-2"
                  onClick={() => toast.success(`"${event.title}" saved to your calendar!`)}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Add to Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
