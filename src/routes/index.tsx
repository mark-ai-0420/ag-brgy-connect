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
  Sparkles,
  FileCheck,
  Flame,
  CheckCircle2,
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
  head: () => ({
    meta: [
      {
        title: 'BrgyConnect | Barangay Daine, Indang, Cavite — Unified Digital Portal',
      },
      {
        name: 'description',
        content:
          'Official digital civic portal for Barangay Daine 1 and Daine 2, Indang, Cavite. Track document requests, view announcements, explore local MSMEs, and contact emergency responders 24/7.',
      },
      {
        property: 'og:title',
        content: 'BrgyConnect | Barangay Daine, Indang, Cavite — Unified Digital Portal',
      },
      {
        property: 'og:description',
        content:
          'Official digital civic portal for Barangay Daine 1 and Daine 2, Indang, Cavite. Track document requests, view announcements, explore local MSMEs, and contact emergency responders 24/7.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
    links: [
      {
        rel: 'preload',
        as: 'image',
        href: '/logo.jpg',
        type: 'image/jpeg',
      },
    ],
  }),
  component: Home,
  loader: () => getHomeData(),
})

/* ── Types ────────────────────────────────────────────────────────────────── */
interface BentoServiceCard {
  to: string
  icon: React.ReactNode
  badge: string
  title: string
  description: string
  color: string
  accentColor: string
  bgColor: string
  colSpan: string
  actionLabel: string
  highlights?: string[]
}

interface Step {
  number: string
  icon: React.ReactNode
  title: string
  description: string
}

/* ── Bento Grid Definition ───────────────────────────────────────────────── */
const bentoServices: BentoServiceCard[] = [
  {
    to: '/documents',
    icon: <FileCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />,
    badge: 'Official E-Services',
    title: 'Online Document Requests & Clearances',
    description:
      'Request Barangay Clearance, Indigency Certificate, Residency Proof, and Business Clearances 24/7 without standing in line. Real-time digital status verification.',
    color: 'text-emerald-600 dark:text-emerald-400',
    accentColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    bgColor: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    colSpan: 'lg:col-span-7',
    actionLabel: 'Request Document',
    highlights: ['Barangay Clearance', 'Indigency Certificate', 'Certificate of Residency', 'Business Permit'],
  },
  {
    to: '/complaints',
    icon: <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />,
    badge: 'Public Safety Desk',
    title: 'Incident & Blotter Reporting',
    description:
      'File complaints, community grievances, or safety concerns securely with direct desk routing to Barangay Peace & Order officers.',
    color: 'text-red-600 dark:text-red-400',
    accentColor: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    bgColor: 'from-red-500/10 via-red-500/5 to-transparent',
    colSpan: 'lg:col-span-5',
    actionLabel: 'File Incident Report',
    highlights: ['Blotter Records', 'Lupon Mediation', 'Safety Alerts'],
  },
  {
    to: '/directory',
    icon: <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
    badge: 'Commercial Hub',
    title: 'Verified Business Directory',
    description:
      'Discover registered local enterprises, agriculture suppliers, services, and neighborhood trade across Barangay Daine I & II.',
    color: 'text-blue-600 dark:text-blue-400',
    accentColor: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    bgColor: 'from-blue-500/10 via-blue-500/5 to-transparent',
    colSpan: 'lg:col-span-5',
    actionLabel: 'Explore Directory',
    highlights: ['Registered Stores', 'Local Services', 'Agri Products'],
  },
  {
    to: '/emergency',
    icon: <Phone className="h-8 w-8 text-red-600 dark:text-red-400" />,
    badge: '24/7 Response Hotline',
    title: 'Emergency Hotlines & Responders',
    description:
      'Immediate speed-dial access to Indang Police (PNP), BFP Fire Station, Municipal Health Office (MHO) RHU Ambulance, and Barangay Tanod.',
    color: 'text-red-600 dark:text-red-400',
    accentColor: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    bgColor: 'from-red-500/10 via-red-500/5 to-transparent',
    colSpan: 'lg:col-span-7',
    actionLabel: 'Emergency Contacts',
    highlights: ['PNP Indang', 'BFP Fire Rescue', 'Cavite RHU Ambulance', 'Tanod Patrol'],
  },
]

const steps: Step[] = [
  {
    number: '01',
    icon: <Search className="h-6 w-6" />,
    title: 'Browse Services & Directory',
    description: 'Explore the full spectrum of barangay services, local businesses, and municipal contacts in one streamlined hub.',
  },
  {
    number: '02',
    icon: <FileText className="h-6 w-6" />,
    title: 'Submit Online Requests',
    description: 'Apply for official certificates and submit incident reports without visiting the hall in person.',
  },
  {
    number: '03',
    icon: <Bell className="h-6 w-6" />,
    title: 'Track & Stay Informed',
    description: 'Monitor request status with your tracking code and receive real-time updates on civic news and advisories.',
  },
]

/* ── Component ────────────────────────────────────────────────────────────── */
function Home() {
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
    { label: 'Registered Businesses', value: businessesCount, icon: <Store className="h-5 w-5" /> },
    { label: 'Online Public Services', value: '10+', icon: <Shield className="h-5 w-5" /> },
  ]

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* ── Dual-Zone Hero Section ───────────────────────────────────────── */}
      <section className="hero-gradient relative min-h-[90dvh] flex items-center overflow-hidden" id="hero">
        {/* Ambient Radial Lighting Overlay */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(0, 56, 168, 0.8) 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, rgba(252, 209, 22, 0.45) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-24 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(206, 17, 38, 0.5) 0%, transparent 70%)' }}
          />
        </div>

        {/* Dynamic Philippine Flag Accent Bar */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-1.5 flex shadow-lg shadow-black/20 z-20"
        >
          <div className="flex-1 bg-[#0038A8] shadow-[0_0_12px_#0038A8]" />
          <div className="flex-1 bg-[#FCD116] shadow-[0_0_12px_#FCD116]" />
          <div className="flex-1 bg-[#CE1126] shadow-[0_0_12px_#CE1126]" />
        </div>

        <div className="page-container relative z-10 py-16 md:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Zone: Hero Content & Navigation */}
            <div className="lg:col-span-7 space-y-6">
              {/* High-contrast Eyebrow Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-xs sm:text-sm font-bold backdrop-blur-md shadow-md">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FCD116] animate-pulse ring-4 ring-[#FCD116]/30" />
                <span className="tracking-wide">Barangay Daine, Indang, Cavite</span>
              </div>

              {/* Large Bold Hero Typography */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight">
                Barangay Daine
                <br />
                <span className="text-[#FCD116] drop-shadow-[0_4px_24px_rgba(252,209,22,0.45)]">
                  — Connected.
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed font-normal">
                Your official Civic Horizon portal for public services, document requests, local news, and public assistance in Barangay Daine, Indang, Cavite. Access services, file incident reports, and stay connected with community leaders online.
              </p>

              {/* CTAs with >=44px touch targets */}
              <div className="flex flex-wrap gap-4 items-center pt-3">
                <Link
                  to="/directory"
                  className="btn-tactile inline-flex items-center justify-center gap-2.5 px-7 py-3.5 min-h-[48px] rounded-xl font-extrabold text-base bg-[#FCD116] text-[#0038A8] hover:bg-[#FFE033] shadow-xl shadow-yellow-500/25 ring-2 ring-[#FCD116]/60 hover:ring-[#FCD116] transition-all duration-200 group"
                  id="hero-cta-directory"
                >
                  <span>Explore Directory</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/announcements"
                  id="hero-cta-announcements"
                  className="btn-tactile inline-flex items-center justify-center gap-2.5 px-7 py-3.5 min-h-[48px] rounded-xl font-bold text-base text-white border border-white/40 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/80 shadow-lg shadow-black/10 transition-all duration-200 group"
                >
                  <span>View Announcements</span>
                  <Megaphone className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                </Link>
                <Link
                  to="/documents"
                  id="hero-cta-documents"
                  className="btn-tactile inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-xl font-bold text-sm text-white/90 border border-white/25 bg-white/5 backdrop-blur-sm hover:bg-white/15 transition-all duration-200"
                >
                  <FileText className="h-4 w-4 text-[#FCD116]" />
                  <span>Request Clearances</span>
                </Link>
              </div>
            </div>

            {/* Right Zone: Glassmorphic Hero Instant Tracking Dock */}
            <div className="lg:col-span-5 w-full">
              <div className="glass-dock rounded-2xl p-6 sm:p-7 border border-white/25 shadow-2xl space-y-5 bg-white/10 dark:bg-card/90">
                {/* Header with Icon */}
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-[#FCD116] shrink-0 shadow-inner">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[#FCD116] text-[11px] font-bold uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" />
                      Instant Lookup
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      Track Document Instantly
                    </h2>
                    <p className="text-xs sm:text-sm text-white/85">
                      Real-time clearance, permit &amp; indigency status
                    </p>
                  </div>
                </div>

                {/* Search Form with Font-Mono input */}
                <form onSubmit={handleTrackSubmit} className="space-y-4">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="hero-tracking-input"
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                      placeholder="e.g. BRGY-2026-0042"
                      className="min-h-[48px] pl-11 pr-11 text-sm sm:text-base font-mono uppercase tracking-wider rounded-xl bg-background text-foreground border-input shadow-inner focus-visible:ring-2 focus-visible:ring-[#0038A8]"
                      aria-label="Document Tracking Reference Number"
                    />
                    {trackingInput && (
                      <button
                        type="button"
                        onClick={() => setTrackingInput('')}
                        className="absolute right-2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                        aria-label="Clear tracking code"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <Button
                    id="hero-tracking-submit"
                    type="submit"
                    className="btn-tactile min-h-[48px] w-full font-extrabold text-sm sm:text-base rounded-xl bg-[#FCD116] text-[#0038A8] hover:bg-[#FFE033] shadow-lg shadow-yellow-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="h-5 w-5" />
                    <span>Track Document</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1" />
                  </Button>
                </form>

                {/* Sample Reference Chips (BRGY-2026-0042, BRGY-2026-0089) with >=44px touch targets */}
                <div className="pt-3 border-t border-white/15 space-y-2">
                  <span className="text-xs text-white/80 font-semibold block">Quick Reference Samples:</span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSampleClick('BRGY-2026-0042')}
                      className="min-h-[44px] px-3.5 py-2 inline-flex items-center gap-1.5 text-[#FCD116] font-mono text-xs sm:text-sm font-bold border border-white/25 bg-white/15 hover:bg-white/25 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                      aria-label="Track sample code BRGY-2026-0042"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#FCD116]" />
                      BRGY-2026-0042
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSampleClick('BRGY-2026-0089')}
                      className="min-h-[44px] px-3.5 py-2 inline-flex items-center gap-1.5 text-[#FCD116] font-mono text-xs sm:text-sm font-bold border border-white/25 bg-white/15 hover:bg-white/25 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                      aria-label="Track sample code BRGY-2026-0089"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#FCD116]" />
                      BRGY-2026-0089
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="bg-background border-b border-border shadow-xs" id="stats">
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 py-6 px-4 sm:px-8 justify-center sm:justify-start"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4-Bento Service Grid ─────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-muted/20" id="services">
        <div className="page-container">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              CIVIC HORIZON SERVICES
            </div>
            <h2 className="section-title">Barangay Public Services</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Everything you need from your barangay hall, accessible online with 24/7 document processing, incident reporting, directory access, and emergency response.
            </p>
          </div>

          {/* 4-Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {bentoServices.map((svc, idx) => (
              <div
                key={svc.to}
                className={`${svc.colSpan} group`}
                id={`bento-service-card-${idx}`}
              >
                <div className={`card-hover h-full rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden bg-gradient-to-br ${svc.bgColor}`}>
                  <div className="space-y-4 relative z-10">
                    {/* Top row: Icon & Status Badge */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-background border border-border shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        {svc.icon}
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${svc.accentColor}`}>
                        {svc.badge}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {svc.title}
                      </h3>
                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                        {svc.description}
                      </p>
                    </div>

                    {/* Highlights tags */}
                    {svc.highlights && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {svc.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-background/80 text-foreground/80 border border-border/80 shadow-2xs"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Button / Link with >=44px touch target */}
                  <div className="pt-6 relative z-10 border-t border-border/60 mt-6">
                    <Link
                      to={svc.to}
                      className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl font-bold text-sm sm:text-base bg-background text-foreground hover:bg-muted border border-border shadow-xs hover:border-primary/50 transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent"
                    >
                      <span>{svc.actionLabel}</span>
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Track Document Banner */}
          <div className="mt-8 bg-gradient-to-r from-[#0038A8] via-[#002d87] to-[#1E3A8A] rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-[#FCD116] shrink-0 shadow-inner">
                <QrCode className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FCD116]" />
                  Public Self-Service Tracker
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Track Document Processing</h3>
                <p className="text-sm text-blue-100 max-w-xl">
                  Have a tracking reference number? Verify certificate issuance, clearances, and blotter report status in real-time.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="btn-tactile w-full sm:w-auto px-6 py-3.5 min-h-[48px] text-sm sm:text-base font-extrabold bg-[#FCD116] text-[#0038A8] hover:bg-[#FFE033] shadow-md rounded-xl shrink-0 transition-transform"
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

      {/* ── Community Highlights & Media Cards ───────────────────────────── */}
      {(filteredAnnouncements.length > 0 || filteredEvents.length > 0) && (
        <section className="py-16 md:py-24 bg-background border-y border-border/60" id="community-highlights">
          <div className="page-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/20">
                  <Megaphone className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  COMMUNITY HIGHLIGHTS
                </div>
                <h2 className="section-title">Latest Bulletins &amp; Upcoming Events</h2>
                <p className="text-muted-foreground text-base">
                  Stay updated with the newest barangay bulletins, programs, and community assemblies.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild className="btn-tactile rounded-xl min-h-[44px] font-semibold text-xs sm:text-sm">
                  <Link to="/announcements">View Announcements</Link>
                </Button>
                <Button variant="outline" asChild className="btn-tactile rounded-xl min-h-[44px] font-semibold text-xs sm:text-sm">
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
                      <Megaphone className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <h3 className="font-bold text-lg text-foreground">Recent Announcements</h3>
                    </div>
                    <Link
                      to="/announcements"
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 min-h-[44px] px-2"
                    >
                      <span>See all</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredAnnouncements.slice(0, 2).map((item: any) => (
                      <Card
                        key={item.id}
                        className="card-hover group flex flex-col overflow-hidden border border-border bg-card rounded-2xl shadow-xs"
                      >
                        <div className="relative w-full h-40 overflow-hidden bg-muted/60">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              width="400"
                              height="225"
                              decoding="async"
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400 group-hover:text-primary transition-colors">
                              <Megaphone className="h-7 w-7 text-red-600 dark:text-red-400 mb-1" />
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Barangay Notice</span>
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            {item.pinned && (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FCD116] text-[#0038A8] shadow-xs flex items-center gap-1">
                                <Pin className="h-2.5 w-2.5 fill-[#0038A8]" /> Pinned
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
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {format(parseISO(item.created_at), 'MMMM d, yyyy')}
                          </span>
                          <CardTitle className="text-sm sm:text-base font-bold line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.body}
                          </p>
                        </CardContent>
                        <CardFooter className="p-3 pt-0 border-t bg-muted/5">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="btn-tactile w-full text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 justify-between min-h-[44px] px-2"
                          >
                            <Link to={`/announcements/${item.id}` as any}>
                              <span>Read Bulletin</span>
                              <ChevronRight className="h-4 w-4" />
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
                      <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="font-bold text-lg text-foreground">Upcoming Activities</h3>
                    </div>
                    <Link
                      to="/events"
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 min-h-[44px] px-2"
                    >
                      <span>See all</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredEvents.slice(0, 2).map((event: any) => {
                      const dateObj = event.starts_at ? new Date(event.starts_at) : new Date()
                      return (
                        <Card
                          key={event.id}
                          className="card-hover group flex flex-col overflow-hidden border border-border bg-card rounded-2xl shadow-xs"
                        >
                          <div className="relative w-full h-40 overflow-hidden bg-muted/60">
                            {event.image_url ? (
                              <img
                                src={event.image_url}
                                alt={event.title}
                                width="400"
                                height="225"
                                decoding="async"
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400 group-hover:text-amber-700 transition-colors">
                                <Calendar className="h-7 w-7 text-amber-600 dark:text-amber-400 mb-1" />
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Community Assembly</span>
                              </div>
                            )}

                            {/* Floating Date Badge */}
                            <div className="absolute bottom-2.5 left-2.5 bg-background/95 backdrop-blur-md rounded-xl px-2.5 py-1 shadow-md border text-center pointer-events-none">
                              <span className="block text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400 tracking-wider leading-none">{format(dateObj, 'MMM')}</span>
                              <span className="block text-base font-black text-foreground leading-none mt-0.5">{format(dateObj, 'd')}</span>
                            </div>

                            <div className="absolute top-2.5 right-2.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/90 text-foreground shadow-xs border">
                                {event.category || 'Event'}
                              </span>
                            </div>
                          </div>

                          <CardHeader className="p-4 pb-1">
                            <CardTitle className="text-sm sm:text-base font-bold line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {event.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-1 space-y-1 text-xs text-muted-foreground flex-1">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>{format(dateObj, 'h:mm a')}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-start gap-1.5 font-medium">
                                <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="p-3 pt-0 border-t bg-muted/5">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="btn-tactile w-full text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 justify-between min-h-[44px] px-2"
                            >
                              <Link to="/events/$eventId" params={{ eventId: event.id }}>
                                <span>Event Details</span>
                                <ChevronRight className="h-4 w-4" />
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
      <section className="py-20 md:py-28 bg-muted/30" id="how-it-works">
        <div className="page-container">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-widest border border-red-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              SIMPLE &amp; ACCESSIBLE
            </div>
            <h2 className="section-title">How BrgyConnect Works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Connecting you with local governance in three simple, digital steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Desktop Connector Line */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-8 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-0.5 bg-gradient-to-r from-[#0038A8]/40 via-[#CE1126]/40 to-[#FCD116]/40"
            />

            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {/* Step number + icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-card shadow-md border border-border flex items-center justify-center text-blue-600 dark:text-blue-400 relative z-10">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0038A8] text-white text-[10px] font-extrabold flex items-center justify-center shadow-md z-20">
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section
        id="cta-banner"
        className="relative overflow-hidden py-20 md:py-24"
        style={{
          background: 'linear-gradient(135deg, #002d87 0%, #0038A8 40%, #0e47c7 70%, #CE1126 100%)',
        }}
      >
        {/* Dynamic Pattern & Glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="page-container relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Ready to connect with
              <br className="hidden md:block" />
              {' '}your barangay?
            </h2>
            <p className="text-white/85 text-base sm:text-lg max-w-xl">
              Sign in to access document requests, incident desk reporting, local merchant services, and real-time community alerts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0 items-center w-full sm:w-auto">
            <Link
              to="/auth/sign-in"
              id="cta-sign-in"
              className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 min-h-[48px] rounded-xl font-extrabold text-base bg-[#FCD116] text-[#0038A8] hover:bg-[#FFE033] shadow-xl shadow-black/25 ring-2 ring-[#FCD116]/60 hover:ring-[#FCD116] transition-all duration-200 whitespace-nowrap group"
            >
              <span>Sign In to BrgyConnect</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/directory"
              id="cta-explore-services"
              className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 min-h-[48px] rounded-xl font-bold text-base text-white border border-white/40 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/80 shadow-lg shadow-black/10 transition-all duration-200 whitespace-nowrap"
            >
              <span>Explore Directory</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

