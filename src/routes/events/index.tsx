import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import {
  Calendar,
  MapPin,
  Clock,
  CalendarX,
  ChevronRight,
  Users,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  Filter,
  Radio,
  CheckCircle2,
  CalendarCheck2,
} from 'lucide-react'
import { format, parseISO, isPast, isFuture, isWithinInterval } from 'date-fns'
import { useState, useMemo } from 'react'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useBarangayScope, type BarangayScope } from '#/hooks/useBarangayScope'
import { FeedSkeleton } from '#/components/common/FeedSkeleton'

export interface EventItem {
  id: string
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string | null
  created_at: string
  scope: 'all' | 'daine_1' | 'daine_2' | 'both' | null
  image_url: string | null
  category?: string | null
  organizer?: string | null
}

function inferEventCategory(title: string, description: string | null): string {
  const text = `${title} ${description || ''}`.toLowerCase()
  if (text.includes('basketball') || text.includes('sports') || text.includes('tournament') || text.includes('liga')) return 'Sports'
  if (text.includes('medical') || text.includes('health') || text.includes('checkup') || text.includes('vaccin') || text.includes('rabies') || text.includes('dental')) return 'Health'
  if (text.includes('assembly') || text.includes('meeting') || text.includes('pulong') || text.includes('soba') || text.includes('session')) return 'Meeting'
  if (text.includes('clean') || text.includes('tree') || text.includes('environment') || text.includes('waste') || text.includes('river')) return 'Environment'
  if (text.includes('fiesta') || text.includes('cultural') || text.includes('festival') || text.includes('parade')) return 'Cultural'
  return 'Community'
}

export const getEvents = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, location, starts_at, ends_at, created_at, scope, image_url')
      .order('starts_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching events:', error)
      return []
    }

    const items: EventItem[] = (data ?? []).map((row: any) => ({
      ...row,
      category: inferEventCategory(row.title, row.description),
      organizer: row.scope === 'daine_1' 
        ? 'Barangay Daine 1 Council' 
        : row.scope === 'daine_2' 
        ? 'Barangay Daine 2 Council' 
        : 'Joint Councils of Daine 1 & 2'
    }))

    return items
  } catch (error) {
    console.error('Error in getEvents:', error)
    return []
  }
})

export const Route = createFileRoute('/events/')({
  head: () => ({
    meta: [
      {
        title: 'Community Events & Assemblies | Barangay Daine',
      },
      {
        name: 'description',
        content:
          'Discover upcoming barangay assemblies, youth sports leagues, health missions, and civic activities across Daine 1 and Daine 2, Indang, Cavite.',
      },
      {
        property: 'og:title',
        content: 'Community Events & Assemblies | Barangay Daine',
      },
      {
        property: 'og:description',
        content:
          'Discover upcoming barangay assemblies, youth sports leagues, health missions, and civic activities across Daine 1 and Daine 2, Indang, Cavite.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }),
  component: EventsRoute,
  loader: () => getEvents(),
  pendingComponent: () => <FeedSkeleton />,
})

const EVENT_TYPE_COLORS: Record<string, { badge: string; dot: string }> = {
  Meeting: {
    badge: 'bg-blue-100 text-blue-950 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-300 font-semibold',
    dot: 'bg-blue-600',
  },
  Sports: {
    badge: 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 font-semibold',
    dot: 'bg-amber-500',
  },
  Environment: {
    badge: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300 font-semibold',
    dot: 'bg-emerald-600',
  },
  Health: {
    badge: 'bg-green-100 text-green-950 dark:bg-green-950/60 dark:text-green-200 border border-green-300 font-semibold',
    dot: 'bg-green-600',
  },
  Cultural: {
    badge: 'bg-purple-100 text-purple-950 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-300 font-semibold',
    dot: 'bg-purple-600',
  },
  Community: {
    badge: 'bg-indigo-100 text-indigo-950 dark:bg-indigo-950/60 dark:text-indigo-200 border border-indigo-300 font-semibold',
    dot: 'bg-indigo-600',
  },
  Other: {
    badge: 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 font-semibold',
    dot: 'bg-slate-500',
  },
}

type EventStatus = 'live' | 'upcoming' | 'concluded'

function getEventStatus(startsAt: string, endsAt: string | null): EventStatus {
  try {
    const now = new Date()
    const start = parseISO(startsAt)
    const end = endsAt ? parseISO(endsAt) : new Date(start.getTime() + 4 * 60 * 60 * 1000)

    if (now >= start && now <= end) {
      return 'live'
    } else if (now < start) {
      return 'upcoming'
    } else {
      return 'concluded'
    }
  } catch {
    return 'upcoming'
  }
}

function EventCard({ event }: { event: EventItem }) {
  const category = event.category || 'Community'
  const categoryStyle = EVENT_TYPE_COLORS[category] ?? EVENT_TYPE_COLORS.Other
  const status = getEventStatus(event.starts_at, event.ends_at)

  const dateObj = event.starts_at ? parseISO(event.starts_at) : new Date()
  const monthStr = format(dateObj, 'MMM').toUpperCase()
  const dayStr = format(dateObj, 'dd')
  const yearStr = format(dateObj, 'yyyy')
  const timeStr = format(dateObj, 'h:mm a')
  const formattedFullDate = format(dateObj, 'EEEE, MMMM d, yyyy')

  // Map destination link
  const mapSearchQuery = encodeURIComponent(
    `${event.location || 'Barangay Daine'}, Indang, Cavite, Philippines`
  )
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapSearchQuery}`

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-border/80 hover:border-primary/50 bg-card shadow-sm">
      {/* Hero Banner / Fallback with Date Badge */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            width="400"
            height="225"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-secondary text-primary/60 group-hover:text-primary transition-colors p-4">
            <div className="p-3.5 rounded-2xl bg-background/80 shadow-xs backdrop-blur-xs ring-1 ring-primary/15">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <span className="text-[11px] font-bold text-foreground/70 mt-2.5 tracking-wider uppercase">
              Official Barangay Activity
            </span>
          </div>
        )}

        {/* Floating Calendar Chip in font-mono */}
        <div className="absolute bottom-3 left-3 bg-card/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-lg border border-border text-center pointer-events-none ring-1 ring-black/5 flex flex-col items-center min-w-[58px]">
          <span className="block text-[10px] font-black uppercase text-primary tracking-widest leading-none font-mono">
            {monthStr}
          </span>
          <span className="block text-xl font-black text-foreground leading-tight font-mono">
            {dayStr}
          </span>
          <span className="block text-[9px] font-bold text-muted-foreground leading-none font-mono">
            {yearStr}
          </span>
        </div>

        {/* Top Badges: Category, Scope & Status */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none z-10">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Status Indicator */}
            {status === 'live' && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-md border border-emerald-400 backdrop-blur-md animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                LIVE NOW
              </span>
            )}
            {status === 'upcoming' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white shadow-md border border-blue-400 backdrop-blur-md">
                Upcoming
              </span>
            )}
            {status === 'concluded' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-700/90 text-slate-200 shadow-xs backdrop-blur-md">
                Concluded
              </span>
            )}

            {/* Category */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-md ${categoryStyle.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
              {category}
            </span>
          </div>

          {/* Scope Badge */}
          {event.scope && (
            <span
              className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md backdrop-blur-md border border-white/20 ${
                event.scope === 'both' || event.scope === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : event.scope === 'daine_1'
                    ? 'bg-[#0038A8] text-white'
                    : 'bg-[#CE1126] text-white'
              }`}
            >
              {event.scope === 'both' || event.scope === 'all'
                ? 'All Daine'
                : event.scope === 'daine_1'
                  ? 'Daine 1'
                  : 'Daine 2'}
            </span>
          )}
        </div>
      </div>

      {/* Header */}
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-lg font-black leading-snug tracking-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {event.title}
        </CardTitle>
      </CardHeader>

      {/* Details & Location */}
      <CardContent className="flex-1 space-y-2.5 text-xs text-muted-foreground pb-4 px-5">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-semibold text-foreground/90 font-mono text-[13px]">{formattedFullDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-mono text-[13px] font-medium text-foreground/80">{timeStr}</span>
        </div>

        {event.location && (
          <div className="flex items-start justify-between gap-2 pt-0.5">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#CE1126]" />
              <span className="line-clamp-1 font-medium text-foreground/85">{event.location}</span>
            </div>
            {/* Direct Maps Link Trigger */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#002878] dark:text-[#93c5fd] hover:underline shrink-0 transition-colors p-1"
              title="Open venue in Google Maps"
            >
              <span>Map</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {event.organizer && (
          <div className="flex items-center gap-2 text-muted-foreground pt-1 border-t border-border/50">
            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate text-[11px] font-medium">Organized by: <strong className="text-foreground/80">{event.organizer}</strong></span>
          </div>
        )}
      </CardContent>

      {/* Registration / RSVP Action Trigger with Min 44px Target */}
      <CardFooter className="pt-3 pb-4 px-5 border-t border-border/60 bg-muted/20 flex flex-col gap-2">
        <Button
          variant={status === 'live' ? 'default' : 'outline'}
          size="default"
          className={`w-full justify-between font-bold min-h-[44px] h-11 px-4 rounded-xl transition-all shadow-2xs group/btn cursor-pointer ${
            status === 'live'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
              : 'text-[#002878] dark:text-[#93c5fd] hover:text-white dark:hover:text-white hover:bg-primary border-primary/40 hover:border-primary'
          }`}
          asChild
        >
          <Link to="/events/$eventId" params={{ eventId: event.id }}>
            <span>{status === 'concluded' ? 'View Event Summary' : 'Register / View Details'}</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function EventsRoute() {
  const allEvents = Route.useLoaderData() ?? []
  const { scope: activeBarangayScope, setScope } = useBarangayScope()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const categories = ['All', 'Community', 'Health', 'Sports', 'Meeting', 'Cultural', 'Environment', 'Other']

  // Scoped & Filtered Events
  const events = useMemo(() => {
    let filtered = allEvents

    // 1. Dual-Barangay scope
    if (activeBarangayScope !== 'all') {
      const dbScope = activeBarangayScope === 'daine1' ? 'daine_1' : 'daine_2'
      filtered = filtered.filter((e: EventItem) => e.scope === 'both' || e.scope === 'all' || e.scope === dbScope)
    }

    // 2. Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (e: EventItem) => (e.category || 'Other').toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // 3. Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((e: EventItem) => {
        const s = getEventStatus(e.starts_at, e.ends_at)
        return s === selectedStatus
      })
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e: EventItem) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.location && e.location.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [allEvents, activeBarangayScope, selectedCategory, selectedStatus, searchQuery])

  // Count live & upcoming
  const stats = useMemo(() => {
    let liveCount = 0
    let upcomingCount = 0
    allEvents.forEach((e: EventItem) => {
      const s = getEventStatus(e.starts_at, e.ends_at)
      if (s === 'live') liveCount++
      if (s === 'upcoming') upcomingCount++
    })
    return { liveCount, upcomingCount }
  }, [allEvents])

  return (
    <div className="min-h-screen pb-20 bg-slate-50/50 dark:bg-background">
      {/* ── 1. Hero Civic Horizon Header ───────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#002675] via-[#0038A8] to-[#1E3A8A] text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        {/* Flag Ribbon */}
        <div
          className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]"
          aria-hidden="true"
        />

        {/* Subtle Ambient Glow */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#FCD116]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#CE1126]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#FCD116] text-xs font-bold mb-3 backdrop-blur-md shadow-2xs">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                <span>Barangay Daine Civic Assembly & Activity Deck</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Community Calendar & Events
              </h1>
              <p className="text-blue-100 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed font-medium">
                Participate in barangay assemblies, youth sports programs, health missions, and civic gatherings across Daine 1 & Daine 2.
              </p>
            </div>

            {/* Quick Status Chips */}
            <div className="shrink-0 flex items-center gap-3">
              {stats.liveCount > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-black flex items-center gap-2 shadow-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{stats.liveCount} Event{stats.liveCount > 1 ? 's' : ''} Live Today</span>
                </div>
              )}
              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-[#FCD116]" />
                <span>{stats.upcomingCount} Upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. Controls: Dual-Barangay Scope + Status & Category Filter ─────────── */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl -mt-5 relative z-20">
        <div className="bg-card text-card-foreground p-4 sm:p-5 rounded-2xl shadow-xl border border-border space-y-4">
          {/* Top Row: Scope Selector + Search */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Dual-Barangay Scope Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mr-1">
                <Layers className="h-4 w-4 text-primary" />
                <span>Scope:</span>
              </div>
              <div className="inline-flex p-1 bg-muted rounded-xl border border-border">
                {(
                  [
                    { id: 'all', label: 'All Daine (Unified)' },
                    { id: 'daine1', label: 'Barangay Daine 1' },
                    { id: 'daine2', label: 'Barangay Daine 2' },
                  ] as const
                ).map(tab => {
                  const isActive = activeBarangayScope === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setScope(tab.id as BarangayScope)}
                      type="button"
                      className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? tab.id === 'daine1'
                            ? 'bg-[#0038A8] text-white shadow-sm'
                            : tab.id === 'daine2'
                              ? 'bg-[#CE1126] text-white shadow-sm'
                              : 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All Dates' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'live', label: 'Happening Now' },
                  { id: 'concluded', label: 'Concluded' },
                ] as const
              ).map(st => {
                const isCurrent = selectedStatus === st.id
                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStatus(st.id)}
                    type="button"
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                        : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {st.label}
                  </button>
                )
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search events or venue..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[40px]"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-border/60 scrollbar-none">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 mr-1" />
            {categories.map(cat => {
              const isSelected = selectedCategory === cat
              return (
                <Button
                  key={cat}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full min-h-[36px] px-3.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'shadow-xs bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:text-foreground hover:border-primary/50'
                  }`}
                >
                  {cat}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Community Calendar Deck Grid ─────────────────────────────────── */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl mt-8">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-border rounded-3xl bg-card/50 p-6">
            <div className="bg-primary/10 rounded-full p-6 text-primary ring-8 ring-primary/5">
              <CalendarX className="h-10 w-10" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-foreground">No events found</h2>
              <p className="text-sm text-muted-foreground mt-1">
                There are no scheduled activities matching your filters for this barangay jurisdiction.
              </p>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setSelectedCategory('All')
                setSelectedStatus('all')
                setSearchQuery('')
              }}
              className="min-h-[44px] h-11 px-5 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: EventItem) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
