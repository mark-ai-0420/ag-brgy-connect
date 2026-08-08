import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
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
  ChevronRight,
  Search,
  Bell,
} from 'lucide-react'

const getHomeStats = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { count } = await supabase
      .from('businesses')
      .select('*', { count: 'estimated', head: true })
      .eq('status', 'approved')

    return {
      businessesCount: count && count > 0 ? `${count}+` : '8+',
    }
  } catch (error) {
    console.error('Error in getHomeStats:', error)
    return {
      businessesCount: '8+',
    }
  }
})

export const Route = createFileRoute('/')({
  component: Home,
  loader: () => getHomeStats(),
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
    to: '/emergency',
    icon: <Phone className="h-7 w-7" />,
    title: 'Emergency Contacts',
    description: 'Instant access to police, fire, medical, and barangay emergency hotlines.',
    color: 'text-[#b91c1c]',
    bgColor: 'bg-[#CE1126]/10 group-hover:bg-[#CE1126]/18',
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
  const { businessesCount } = Route.useLoaderData()

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

        <div className="page-container relative z-10 py-24 md:py-32">
          <div className="max-w-4xl">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/12 border border-white/20 text-white/90 text-sm font-semibold mb-7 backdrop-blur-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-[#FCD116] animate-pulse" />
              Barangay Daine, Indang, Cavite, Philippines
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
              Barangay Daine
              <br />
              <span className="text-[#FCD116] drop-shadow-[0_2px_16px_rgba(252,209,22,0.35)]">
                — Connected.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed mb-10">
              Your official digital hub for community services, local news, and public assistance in Barangay Daine, Indang, Cavite. Access services, request documents, and connect with local authorities online.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
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
      <section className="bg-white border-b border-border shadow-sm" id="stats">
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
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-lg border border-border flex items-center justify-center text-[#0038A8] relative z-10">
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
