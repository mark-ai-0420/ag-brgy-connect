import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useBarangayScope } from '#/hooks/useBarangayScope'
import { format, parseISO } from 'date-fns'
import { useState, useMemo } from 'react'
import {
  Building2,
  Calendar,
  FileText,
  Phone,
  Megaphone,
  ArrowRight,
  Users,
  Store,
  Shield,
  ShieldAlert,
  ChevronRight,
  Search,
  Bell,
  Pin,
  Clock,
  MapPin,
  QrCode,
  X,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

const getHomeData = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const [businessesRes, announcementsRes, eventsRes] = await Promise.all([
      supabase
        .from('businesses')
        .select('*', { count: 'estimated', head: true })
        .eq('status', 'approved'),
      supabase
        .from('announcements')
        .select('id, title, body, pinned, created_at, category, scope, image_url')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('events')
        .select('id, title, description, location, starts_at, ends_at, scope, image_url')
        .order('starts_at', { ascending: true })
        .limit(3),
    ])

    return {
      businessesCount: businessesRes.count && businessesRes.count > 0 ? `${businessesRes.count}+` : '8+',
      recentAnnouncements: announcementsRes.data ?? [],
      upcomingEvents: eventsRes.data ?? [],
    }
  } catch (error) {
    console.error('Error in getHomeData:', error)
    return {
      businessesCount: '8+',
      recentAnnouncements: [],
      upcomingEvents: [],
    }
  }
})

export const Route = createFileRoute('/')({
  component: Home,
  loader: () => getHomeData(),
})

/* ── Types ────────────────────────────────────────────────────────────────── */
interface ServiceCard {
  to: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  bgColor: string
}

interface Step {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}

/* ── Data ─────────────────────────────────────────────────────────────────── */
const services: ServiceCard[] = [
  {
    to: '/directory',
    icon: <Building2 className="h-7 w-7" />,
    title: 'Business Directory',
    description: 'Find local businesses, services, and trusted professionals in Barangay Daine.',
    color: 'text-[#0038A8]',
    bgColor: 'bg-[#0038A8]/10 group-hover:bg-[#0038A8]/18',
  },
  {
    to: '/announcements',
    icon: <Megaphone className="h-7 w-7" />,
    title: 'Announcements',
    description: 'Stay updated with the latest news, advisories, and official notices from the barangay.',
    color: 'text-[#b91c1c]',
    bgColor: 'bg-[#CE1126]/10 group-hover:bg-[#CE1126]/18',
  },
  {
    to: '/events',
    icon: <Calendar className="h-7 w-7" />,
    title: 'Events',
    description: 'Discover upcoming community assemblies, activities, and barangay-sponsored events.',
    color: 'text-amber-800',
    bgColor: 'bg-amber-500/10 group-hover:bg-amber-500/18',
  },
  {
    to: '/documents',
    icon: <FileText className="h-7 w-7" />,
    title: 'Document Requests',
    description: 'Request barangay clearance, indigency certificates, and more — online, anytime.',
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-500/10 group-hover:bg-emerald-500/18',
  },
  {
    to: '/track',
    icon: <QrCode className="h-7 w-7" />,
    title: 'Track Document',
    description: 'Track the real-time processing status of your clearance, certificate, or permit.',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-500/10 group-hover:bg-indigo-500/18',
  },
  {
    to: '/emergency',
    icon: <Phone className="h-7 w-7" />,
    title: 'Emergency Contacts',
    description: 'Instant access to police, fire, medical, and barangay emergency hotlines.',
    color: 'text-[#b91c1c]',
    bgColor: 'bg-[#CE1126]/10 group-hover:bg-[#CE1126]/18',
  },
  {
    to: '/complaints',
    icon: <ShieldAlert className="h-7 w-7" />,
    title: 'Incident Reports',
    description: 'File complaints, blotter reports, and track the status of your submitted incidents.',
    color: 'text-orange-800',
    bgColor: 'bg-orange-500/10 group-hover:bg-orange-500/18',
  },
]

const steps: Step[] = [
  {
    number: '01',
    icon: <Search className="h-6 w-6" />,
    title: 'Browse Services',
    description: 'Explore the full range of barangay services — from the directory to document requests — all in one place.',
  },
  {
    number: '02',
    icon: <FileText className="h-6 w-6" />,
    title: 'Request Documents',
    description: 'Submit document requests online without visiting the hall. Track your request status in real time.',
  },
  {
    number: '03',
    icon: <Bell className="h-6 w-6" />,
    title: 'Stay Informed',
    description: 'Receive announcements, event updates, and emergency alerts from Barangay Daine officials.',
  },
]

/* ── Component ────────────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate()
  const [trackingInput, setTrackingInput] = useState('')
  const loaderData = Route.useLoaderData()
  const businessesCount = loaderData?.businessesCount ?? '8+'
  const recentAnnouncements = loaderData?.recentAnnouncements ?? []
  const upcomingEvents = loaderData?.upcomingEvents ?? []
  const { scope: activeBarangayScope } = useBarangayScope()

  const handleTrackSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmedCode = trackingInput.trim().toUpperCase()
    if (trimmedCode) {
      navigate({ to: '/track', search: { code: trimmedCode } })
    } else {
      navigate({ to: '/track' })
    }
  }

  const handleSampleClick = (code: string) => {
    setTrackingInput(code)
    navigate({ to: '/track', search: { code } })
  }

  const filteredAnnouncements = useMemo(() => {
    if (activeBarangayScope === 'all') return recentAnnouncements
    const dbScope = activeBarangayScope === 'daine1' ? 'daine_1' : 'daine_2'
    return recentAnnouncements.filter((a: any) => !a.scope || a.scope === 'both' || a.scope === dbScope)
  }, [recentAnnouncements, activeBarangayScope])

  const filteredEvents = useMemo(() => {
    if (activeBarangayScope === 'all') return upcomingEvents
    const dbScope = activeBarangayScope === 'daine1' ? 'daine_1' : 'daine_2'
    return upcomingEvents.filter((e: any) => !e.scope || e.scope === 'both' || e.scope === dbScope)
  }, [upcomingEvents, activeBarangayScope])

  const stats = [
    { label: 'Residents Served', value: '5,000+', icon: <Users className="h-5 w-5" /> },
    { label: 'Local Businesses', value: businessesCount, icon: <Store className="h-5 w-5" /> },
    { label: 'Services Available', value: '10+', icon: <Shield className="h-5 w-5" /> },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-gradient relative min-h-[88vh] flex items-center" id="hero">
        {/* Decorative flag-stripe accent */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-1 flex"
        >
          <div className="flex-1 bg-[#CE1126]" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#0038A8]" />
        </div>

        <div className="page-container relative z-10 py-16 md:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/12 border border-white/20 text-white/90 text-sm font-semibold backdrop-blur-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-[#FCD116] animate-pulse" />
                Barangay Daine, Indang, Cavite, Philippines
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight">
                Barangay Daine
                <br />
                <span className="text-[#FCD116] drop-shadow-[0_2px_16px_rgba(252,209,22,0.35)]">
                  — Connected.
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">
                Your official digital hub for community services, local news, and public assistance in Barangay Daine, Indang, Cavite. Access services, request documents, and connect with local authorities online.
              </p>

              <div className="flex flex-wrap gap-4 items-center pt-2">
                <Link
                  to="/directory"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-extrabold text-base bg-[#FCD116] text-[#0038A8] hover:bg-[#FFE033] shadow-xl shadow-yellow-500/20 ring-2 ring-[#FCD116]/60 hover:ring-[#FCD116] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 group"
                  id="hero-cta-directory"
                >
                  <span>Explore Directory</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/announcements"
                  id="hero-cta-announcements"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[44px] rounded-xl font-bold text-base text-white border border-white/40 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/80 hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-black/10 transition-all duration-200 group"
                >
                  <span>View Announcements</span>
                  <Megaphone className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                </Link>
              </div>
            </div>

            {/* Right column: Hero Instant Document Tracking Dock */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-white/10 dark:bg-card/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/20 shadow-2xl space-y-4">
                {/* Eyebrow header */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-[#FCD116] shrink-0 shadow-inner">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      Track Document Instantly
                    </h2>
                    <p className="text-xs sm:text-sm text-white/80">
                      Real-time clearance, permit &amp; indigency status
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleTrackSubmit} className="space-y-4">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3.5 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="hero-tracking-input"
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                      placeholder="e.g. BD1-8F3A29D1"
                      className="h-12 pl-10 pr-10 text-sm sm:text-base font-mono uppercase tracking-wider rounded-xl bg-background text-foreground border-input shadow-inner focus-visible:ring-2 focus-visible:ring-[#0038A8]"
                      aria-label="Document Tracking Reference Number"
                    />
                    {trackingInput && (
                      <button
                        type="button"
                        onClick={() => setTrackingInput('')}
                        className="absolute right-3.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                        aria-label="Clear tracking code"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <Button
                    id="hero-tracking-submit"
                    type="submit"
                    className="min-h-[48px] w-full font-extrabold text-sm sm:text-base rounded-xl bg-[#FCD116] text-[#0038A8] hover:bg-[#FFE033] shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Track Document</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </form>

                {/* Quick Sample Chips */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/70 font-medium">Try samples:</span>
                  <button
                    type="button"
                    onClick={() => handleSampleClick('BD1-8F3A29D1')}
                    className="text-[#FCD116] font-mono text-xs border border-white/20 bg-white/15 hover:bg-white/25 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer"
                  >
                    BD1-8F3A29D1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSampleClick('BD2-4E90B17A')}
                    className="text-[#FCD116] font-mono text-xs border border-white/20 bg-white/15 hover:bg-white/25 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer"
                  >
                    BD2-4E90B17A
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative floating shapes */}
        <div aria-hidden="true" className="absolute right-0 top-0 h-full w-1/2 overflow-hidden pointer-events-none hidden lg:block">
          <div
            className="absolute top-1/4 right-12 w-72 h-72 rounded-full border border-white/10"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/2 right-32 w-44 h-44 rounded-full border border-[#FCD116]/20"
            style={{ background: 'radial-gradient(circle, rgba(252,209,22,0.06) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-1/4 right-6 w-32 h-32 rounded-full border border-[#CE1126]/15"
            style={{ background: 'radial-gradient(circle, rgba(206,17,38,0.06) 0%, transparent 70%)' }}
          />
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="bg-background border-b border-border shadow-sm" id="stats">
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 py-6 px-4 sm:px-8 justify-center sm:justify-start"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#0038A8]/8 flex items-center justify-center text-[#0038A8]">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Action: Track Document ─────────────────────────────────── */}
      <section className="py-6 bg-primary/5 border-b border-border" id="quick-track-section">
        <div className="page-container">
          <div className="bg-gradient-to-r from-[#0038A8] via-[#002878] to-[#1E3A8A] rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-[#FCD116] shrink-0 shadow-inner">
                <QrCode className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FCD116]" />
                  Public Self-Service Tracker
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Track Document</h3>
                <p className="text-sm text-blue-100 max-w-xl">
                  Have a tracking reference number? Track clearance, ID, and certificate lifecycles in real time.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="w-full sm:w-auto px-6 py-3.5 h-auto text-sm sm:text-base font-extrabold bg-[#FCD116] text-[#0038A8] hover:bg-[#FFE033] shadow-md rounded-xl shrink-0 hover:scale-[1.02] transition-transform"
              id="home-track-document-btn"
            >
              <Link to="/track">
                <span>Track Document</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Services Grid ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28" id="services">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#0038A8] mb-3">
              What We Offer
            </p>
            <h2 className="section-title mb-4">Barangay Services</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need from your barangay, available 24/7 from any device.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((svc, idx) => (
              <Link
                key={svc.to}
                to={svc.to}
                id={`service-card-${idx}`}
                className="group block"
              >
                <div className="card-hover h-full rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-200 ${svc.bgColor} ${svc.color}`}
                  >
                    {svc.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-[#0038A8] transition-colors">
                      {svc.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {svc.description}
                    </p>
                  </div>

                  {/* Link arrow */}
                  <div className={`flex items-center gap-1 text-sm font-semibold ${svc.color} mt-1`}>
                    <span>Learn more</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Updates & Community Media ───────────────────────────── */}
      {(filteredAnnouncements.length > 0 || filteredEvents.length > 0) && (
        <section className="py-16 md:py-24 bg-muted/20 border-y border-border/60" id="community-highlights">
          <div className="page-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <p className="text-sm font-bold tracking-widest uppercase text-[#0038A8] dark:text-[#60a5fa] mb-2">
                  Community Highlights
                </p>
                <h2 className="section-title">Latest News & Upcoming Events</h2>
                <p className="text-muted-foreground text-base mt-1">
                  Stay updated with the newest barangay bulletins, programs, and gatherings.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild className="rounded-xl min-h-[44px] font-semibold text-xs sm:text-sm">
                  <Link to="/announcements">View Announcements</Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl min-h-[44px] font-semibold text-xs sm:text-sm">
                  <Link to="/events">View Events</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Latest Announcements Column */}
              {filteredAnnouncements.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-[#b91c1c]" />
                      <h3 className="font-bold text-lg text-foreground">Recent Announcements</h3>
                    </div>
                    <Link to="/announcements" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 min-h-[36px]">
                      <span>See all</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredAnnouncements.slice(0, 2).map((item: any) => (
                      <Card key={item.id} className="group flex flex-col overflow-hidden border hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-card">
                        <div className="relative w-full h-36 overflow-hidden bg-muted/60">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 text-primary/40 group-hover:text-primary/60 transition-colors">
                              <Megaphone className="h-6 w-6 text-primary/70 mb-1" />
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Barangay Notice</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 flex items-center gap-1">
                            {item.pinned && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs flex items-center gap-0.5">
                                <Pin className="h-2.5 w-2.5 fill-slate-950" /> Pinned
                              </span>
                            )}
                            {item.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/90 text-foreground shadow-xs border">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>

                        <CardHeader className="p-4 pb-1">
                          <span className="text-[11px] text-muted-foreground">
                            {format(parseISO(item.created_at), 'MMMM d, yyyy')}
                          </span>
                          <CardTitle className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 flex-1">
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.body}
                          </p>
                        </CardContent>
                        <CardFooter className="p-3 pt-0 border-t bg-muted/5">
                          <Button variant="ghost" size="sm" asChild className="w-full text-xs font-semibold text-primary justify-between min-h-[36px] px-2">
                            <Link to={`/announcements/${item.id}` as any}>
                              <span>Read Bulletin</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Events Column */}
              {filteredEvents.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                      <h3 className="font-bold text-lg text-foreground">Upcoming Activities</h3>
                    </div>
                    <Link to="/events" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 min-h-[36px]">
                      <span>See all</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredEvents.slice(0, 2).map((event: any) => {
                      const dateObj = event.starts_at ? new Date(event.starts_at) : new Date()
                      return (
                        <Card key={event.id} className="group flex flex-col overflow-hidden border hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-card">
                          <div className="relative w-full h-36 overflow-hidden bg-muted/60">
                            {event.image_url ? (
                              <img
                                src={event.image_url}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-amber-500/5 text-amber-600/40 group-hover:text-amber-600/60 transition-colors">
                                <Calendar className="h-6 w-6 text-amber-600/70 mb-1" />
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Community Event</span>
                              </div>
                            )}

                            {/* Floating Date Badge */}
                            <div className="absolute bottom-2 left-2 bg-background/95 backdrop-blur-md rounded-lg px-2 py-1 shadow-sm border text-center pointer-events-none">
                              <span className="block text-[9px] font-extrabold uppercase text-primary tracking-wider leading-none">{format(dateObj, 'MMM')}</span>
                              <span className="block text-sm font-black text-foreground leading-none mt-0.5">{format(dateObj, 'd')}</span>
                            </div>

                            <div className="absolute top-2 right-2">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/90 text-foreground shadow-xs border">
                                {event.category || 'Event'}
                              </span>
                            </div>
                          </div>

                          <CardHeader className="p-4 pb-1">
                            <CardTitle className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                              {event.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-1 space-y-1 text-xs text-muted-foreground flex-1">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-primary/70 shrink-0" />
                              <span>{format(dateObj, 'h:mm a')}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-start gap-1.5">
                                <MapPin className="h-3 w-3 text-primary/70 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="p-3 pt-0 border-t bg-muted/5">
                            <Button variant="ghost" size="sm" asChild className="w-full text-xs font-semibold text-primary justify-between min-h-[36px] px-2">
                              <Link to="/events/$eventId" params={{ eventId: event.id }}>
                                <span>Event Details</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-muted/40" id="how-it-works">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#CE1126] mb-3">
              Simple & Fast
            </p>
            <h2 className="section-title mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Getting started with BrgyConnect takes less than a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line — desktop only */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-8 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-gradient-to-r from-[#0038A8]/30 via-[#CE1126]/30 to-[#FCD116]/30"
            />

            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center md:items-center">
                {/* Step number + icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-background shadow-lg border border-border flex items-center justify-center text-[#0038A8] relative z-10">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0038A8] text-white text-[10px] font-extrabold flex items-center justify-center shadow-md z-20">
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section
        id="cta-banner"
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #002d87 0%, #0038A8 40%, #0e47c7 70%, #CE1126 100%)',
        }}
      >
        {/* Pattern overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="page-container relative z-10 py-20 md:py-24 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
              Ready to connect with
              <br className="hidden md:block" />
              {' '}your barangay?
            </h2>
            <p className="text-white/70 text-lg">
              Sign in to access all services, track your requests, and stay in the loop.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0 items-center">
            <Link
              to="/auth/sign-in"
              id="cta-sign-in"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-extrabold text-base bg-[#FCD116] text-[#0038A8] hover:bg-[#FFE033] shadow-xl shadow-black/25 ring-2 ring-[#FCD116]/60 hover:ring-[#FCD116] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 whitespace-nowrap group"
            >
              <span>Sign In to BrgyConnect</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/directory"
              id="cta-explore-services"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-base text-white border border-white/40 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/80 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              <span>Explore Directory</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
