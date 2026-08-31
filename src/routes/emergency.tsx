import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState, type ComponentType } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import {
  Phone,
  ShieldAlert,
  Flame,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Ambulance,
  MapPin,
  WifiOff,
  Search,
  Copy,
  Check,
  Map,
  Zap,
  Info,
  X,
} from 'lucide-react'
import { useBarangayScope } from '#/hooks/useBarangayScope'
import { useNetworkStatus } from '#/hooks/useNetworkStatus'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { toast } from 'sonner'

// Reliable mapping of icons by category name
const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  'Barangay Daine 1 Operations & Responders': ShieldAlert,
  'Barangay Daine 2 Operations & Responders': ShieldAlert,
  'Police & Law Enforcement': ShieldCheck,
  'Bureau of Fire Protection (BFP)': Flame,
  'Medical & Healthcare Services': Stethoscope,
  'Disaster & Rescue Operations (MDRRMO)': Ambulance,
  'Additional Verified Hotlines': Radio,
}

// 4 Primary Tactile Hero Speed-Dial Cards
const PRIMARY_SPEED_DIAL = [
  {
    title: '911 National Emergency',
    subtitle: 'Direct Emergency Dispatch',
    number: '911',
    icon: AlertTriangle,
    badge: '🚨 Direct Dispatch',
    cardBorder: 'border-red-500/40 dark:border-red-500/30 hover:border-red-600 dark:hover:border-red-400',
    iconBg: 'bg-red-600 text-white',
    numberColor: 'text-red-600 dark:text-red-400',
    glowClass: 'shadow-red-500/10 hover:shadow-red-500/20',
  },
  {
    title: 'PNP Indang Police',
    subtitle: 'Municipal Police Desk',
    number: '(046) 415-0211',
    icon: ShieldCheck,
    badge: '🚓 Law & Order',
    cardBorder: 'border-blue-500/40 dark:border-blue-500/30 hover:border-blue-600 dark:hover:border-blue-400',
    iconBg: 'bg-blue-700 text-white',
    numberColor: 'text-blue-700 dark:text-blue-400',
    glowClass: 'shadow-blue-500/10 hover:shadow-blue-500/20',
  },
  {
    title: 'BFP Indang Fire',
    subtitle: 'Fire & Rescue Station',
    number: '(046) 415-0322',
    icon: Flame,
    badge: '🚒 Fire Protection',
    cardBorder: 'border-amber-500/40 dark:border-amber-500/30 hover:border-amber-600 dark:hover:border-amber-400',
    iconBg: 'bg-amber-600 text-white',
    numberColor: 'text-amber-600 dark:text-amber-400',
    glowClass: 'shadow-amber-500/10 hover:shadow-amber-500/20',
  },
  {
    title: 'MDRRMO Rescue',
    subtitle: 'Disaster & Medical Rescue',
    number: '0998-555-0100',
    icon: Ambulance,
    badge: '🚑 Emergency Med',
    cardBorder: 'border-emerald-500/40 dark:border-emerald-500/30 hover:border-emerald-600 dark:hover:border-emerald-400',
    iconBg: 'bg-emerald-700 text-white',
    numberColor: 'text-emerald-700 dark:text-emerald-400',
    glowClass: 'shadow-emerald-500/10 hover:shadow-emerald-500/20',
  },
]

// Built-in emergency contacts guaranteed to always render
const DEFAULT_EMERGENCY_SECTIONS = [
  {
    category: 'Barangay Daine 1 Operations & Responders',
    scope: 'daine_1',
    color: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-l-blue-600',
    bgAccent: 'bg-blue-50 dark:bg-blue-950/30',
    contacts: [
      { name: 'Barangay Daine 1 Operations Desk', label: 'Executive Hotline', phone: '0917-123-0001' },
      { name: 'Daine 1 Barangay Tanod Patrol Unit', label: 'Peace & Order', phone: '0928-555-0101' },
      { name: 'Daine 1 Barangay Health Station', label: 'First Aid & Maternal Care', phone: '0928-555-0103' },
    ],
  },
  {
    category: 'Barangay Daine 2 Operations & Responders',
    scope: 'daine_2',
    color: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-l-amber-600',
    bgAccent: 'bg-amber-50 dark:bg-amber-950/30',
    contacts: [
      { name: 'Barangay Daine 2 Operations Desk', label: 'Executive Hotline', phone: '0917-123-0002' },
      { name: 'Daine 2 Barangay Tanod Patrol Unit', label: 'Peace & Order', phone: '0928-555-0102' },
      { name: 'Daine 2 Barangay Health Station', label: 'First Aid & Maternal Care', phone: '0928-555-0104' },
    ],
  },
  {
    category: 'Police & Law Enforcement',
    scope: 'both',
    color: 'text-indigo-700 dark:text-indigo-400',
    borderColor: 'border-l-indigo-600',
    bgAccent: 'bg-indigo-50 dark:bg-indigo-950/30',
    contacts: [
      { name: 'Indang Municipal Police Station (PNP)', label: 'Municipal Police Desk', phone: '(046) 415-0211, 0998-598-5612' },
      { name: 'Cavite Provincial Police Office', label: 'Provincial Command', phone: '(046) 431-0370' },
    ],
  },
  {
    category: 'Bureau of Fire Protection (BFP)',
    scope: 'both',
    color: 'text-red-700 dark:text-red-400',
    borderColor: 'border-l-red-600',
    bgAccent: 'bg-red-50 dark:bg-red-950/30',
    contacts: [
      { name: 'BFP Indang Fire Station', label: 'Fire & Rescue Hotline', phone: '(046) 415-0322, 0915-602-1991' },
      { name: 'BFP Cavite Provincial Operations', label: 'Provincial Command', phone: '(046) 419-0120' },
    ],
  },
  {
    category: 'Medical & Healthcare Services',
    scope: 'both',
    color: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-l-emerald-600',
    bgAccent: 'bg-emerald-50 dark:bg-emerald-950/30',
    contacts: [
      { name: 'Indang Rural Health Unit (RHU / Main)', label: 'Public Health Office', phone: '(046) 415-0102' },
      { name: 'General Emilio Aguinaldo Memorial Hospital', label: 'Provincial Hospital', phone: '(046) 416-0262' },
      { name: 'De La Salle University Medical Center (DLSUMC)', label: 'Tertiary Hospital', phone: '(046) 481-8000' },
    ],
  },
  {
    category: 'Disaster & Rescue Operations (MDRRMO)',
    scope: 'both',
    color: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-l-cyan-600',
    bgAccent: 'bg-cyan-50 dark:bg-cyan-950/30',
    contacts: [
      { name: 'MDRRMO Indang Emergency Rescue Unit', label: 'Disaster & Ambulance', phone: '0998-555-0100, (046) 415-0011' },
      { name: 'Cavite PDRRMO Emergency Hotline', label: 'Provincial Disaster Center', phone: '(046) 419-1406' },
    ],
  },
]

function formatTelUri(phoneStr: string): string {
  const digits = phoneStr.replace(/[^0-9+]/g, '')
  return `tel:${digits}`
}

const getEmergencyContacts = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.warn('Notice fetching custom emergency_contacts from Supabase:', error.message)
    }
    return data ?? []
  } catch (error) {
    console.warn('Error in getEmergencyContacts:', error)
    return []
  }
})

export const Route = createFileRoute('/emergency')({
  head: () => ({
    meta: [
      {
        title: 'Emergency Hotlines & Disaster Response | Barangay Daine',
      },
      {
        name: 'description',
        content:
          'Emergency hotlines and disaster response contact numbers for Barangay Daine 1 and Daine 2, Indang, Cavite. Direct speed-dial to 911, PNP Indang Police, BFP Fire, RHU, and MDRRMO Rescue.',
      },
      {
        property: 'og:title',
        content: 'Emergency Hotlines & Disaster Response | Barangay Daine',
      },
      {
        property: 'og:description',
        content:
          'Emergency hotlines and disaster response contact numbers for Barangay Daine 1 and Daine 2, Indang, Cavite. Direct speed-dial to 911, PNP Indang Police, BFP Fire, RHU, and MDRRMO Rescue.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }),
  component: EmergencyRoute,
  loader: () => getEmergencyContacts(),
})

function EmergencyRoute() {
  const dbContacts = Route.useLoaderData() ?? []
  const { scope, setScope } = useBarangayScope()
  const { isOffline } = useNetworkStatus()
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null)

  // Merge database custom contacts with built-in default directory
  const displaySections = useMemo(() => {
    // 1. Filter out default sections based on active scope
    const sections = DEFAULT_EMERGENCY_SECTIONS.filter((sec) => {
      if (scope === 'daine1') return sec.scope === 'daine_1' || sec.scope === 'both'
      if (scope === 'daine2') return sec.scope === 'daine_2' || sec.scope === 'both'
      return true
    })

    // 2. Add custom contacts from database, filtering them individually
    if (dbContacts && dbContacts.length > 0) {
      const activeDbScope = scope === 'daine1' ? 'daine_1' : scope === 'daine2' ? 'daine_2' : 'both'

      const filteredCustomContacts = dbContacts
        .filter((c: any) => {
          const cScope = c.scope || 'both'
          if (activeDbScope === 'both') return true
          return cScope === 'both' || cScope === activeDbScope
        })
        .map((c: any) => ({
          name: c.name,
          label: c.label || 'Barangay Hotline',
          phone: c.phone,
          scope: c.scope || 'both',
        }))

      if (filteredCustomContacts.length > 0) {
        sections.push({
          category: 'Additional Verified Hotlines',
          scope: 'both',
          color: 'text-purple-700 dark:text-purple-400',
          borderColor: 'border-l-purple-600',
          bgAccent: 'bg-purple-50 dark:bg-purple-950/30',
          contacts: filteredCustomContacts,
        })
      }
    }

    // 3. Filter by search query if present
    if (!searchQuery.trim()) {
      return sections
    }

    const query = searchQuery.toLowerCase().trim()
    return sections
      .map((section) => ({
        ...section,
        contacts: section.contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            (c.label && c.label.toLowerCase().includes(query)) ||
            c.phone.toLowerCase().includes(query) ||
            section.category.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.contacts.length > 0)
  }, [dbContacts, scope, searchQuery])

  const handleCopyNumber = async (number: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(number)
        setCopiedNumber(number)
        toast.success(`Copied ${number} to clipboard`)
        setTimeout(() => setCopiedNumber(null), 2000)
      }
    } catch {
      toast.info(`Number: ${number}`)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-20">
      {/* High-Visibility Offline Mode Resilience Banner */}
      {isOffline && (
        <aside
          role="status"
          aria-label="Offline Mode Notification: Resilient Emergency Directory"
          className="bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 text-white px-4 py-3.5 shadow-xl border-b-2 border-amber-500 animate-in slide-in-from-top duration-300"
        >
          <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-950 text-amber-300 ring-1 ring-amber-400/40 shrink-0 shadow-inner flex items-center justify-center">
                <WifiOff className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-xs">
                    <Zap className="h-3 w-3 fill-amber-950" />
                    Offline Mode Active
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 shadow-xs">
                    <ShieldCheck className="h-3 w-3" />
                    Locally Cached Directory
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed text-amber-50">
                  Lokal na naka-imbak ang mga numero para sa bagyo at brownout. Lahat ng hotlines ay maaari pa ring tawagan gamit ang standard direct phone call kahit walang Wi-Fi o cellular data.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 text-xs font-mono font-medium text-emerald-200">
              <Phone className="h-3.5 w-3.5 text-emerald-300" />
              <span>Direct Dialing Active</span>
            </div>
          </div>
        </aside>
      )}

      {/* Urgent Civic Hero Banner */}
      <section
        aria-labelledby="emergency-hero-heading"
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-8 sm:py-12 px-4 shadow-lg"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 sm:p-4 bg-white/15 rounded-2xl backdrop-blur-sm ring-1 ring-white/25 shadow-inner shrink-0">
                <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                    Civic Response Desk
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                    Indang, Cavite
                  </span>
                </div>
                <h1
                  id="emergency-hero-heading"
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2"
                >
                  Emergency Hotlines & Disaster Response
                </h1>
                <p className="text-red-50 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
                  In case of life-threatening emergencies, contact the responders{' '}
                  <strong className="text-white font-bold underline decoration-yellow-400 underline-offset-2">immediately</strong>. Tap any card below to place a direct phone call.
                </p>
              </div>
            </div>

            {/* Offline & Resilient Local Cache Badge */}
            <div className="hidden lg:flex flex-col items-end gap-1.5 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-right">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <span>24/7 Resilient Directory</span>
              </div>
              <p className="text-[11px] text-white/80 max-w-[220px]">
                Pre-cached for instant dialing during typhoons, floods, and electrical outages.
              </p>
            </div>
          </div>

          {/* 4-Card Hero Speed-Dial Grid (2x2 on mobile, 4x1 on desktop) */}
          <div className="mt-8">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-red-200" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-100">
                  Priority Speed-Dial Responders
                </span>
              </div>
              <span className="text-[11px] text-red-200 font-medium">
                Tap to Call Directly
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {PRIMARY_SPEED_DIAL.map((card) => {
                const Icon = card.icon
                const telUri = formatTelUri(card.number)
                return (
                  <a
                    key={card.number}
                    href={telUri}
                    aria-label={`${card.title} - Call ${card.number}`}
                    className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 ${card.cardBorder} shadow-md ${card.glowClass} hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-200 min-h-[52px] md:min-h-[140px] btn-tactile text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-700`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-2.5">
                      <div className={`p-2 sm:p-2.5 rounded-xl ${card.iconBg} shrink-0 shadow-sm flex items-center justify-center`}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground bg-muted/80 dark:bg-slate-800 px-2 py-0.5 rounded-full line-clamp-1 border border-border/50">
                        {card.badge}
                      </span>
                    </div>

                    <div className="space-y-0.5 mb-2.5">
                      <h2 className="text-xs sm:text-sm font-extrabold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {card.title}
                      </h2>
                      <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                        {card.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 sm:pt-2.5 border-t border-border/60 flex items-center justify-between gap-1">
                      <span className={`text-sm sm:text-base md:text-lg font-mono font-black tracking-tight ${card.numberColor}`}>
                        {card.number}
                      </span>
                      <span
                        aria-hidden="true"
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0 rounded-xl sm:rounded-lg bg-emerald-700 group-hover:bg-emerald-800 text-white shadow-xs shrink-0 transition-colors btn-tactile"
                      >
                        <Phone className="h-4 w-4 sm:h-3.5 sm:w-3.5 fill-current" />
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Scope Filter Tabs & Search Controls */}
      <section
        aria-label="Filter and Search Emergency Contacts"
        className="container mx-auto max-w-6xl px-4 pt-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm">
          {/* Dual-jurisdiction filter tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Jurisdiction:</span>
            </div>

            <div
              role="tablist"
              aria-label="Filter Hotlines by Jurisdiction"
              className="grid grid-cols-3 sm:flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/40"
            >
              {([
                { id: 'all', label: 'All Jurisdictions' },
                { id: 'daine1', label: 'Barangay Daine 1' },
                { id: 'daine2', label: 'Barangay Daine 2' },
              ] as const).map((tab) => {
                const isSelected = scope === tab.id
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={isSelected}
                    onClick={() => setScope(tab.id)}
                    className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-lg transition-all btn-tactile cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hotlines or units..."
              aria-label="Search hotlines by department or keyword"
              className="w-full min-h-[44px] pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Categorized Hotlines Section */}
      <main
        id="hotlines-grid"
        className="container mx-auto max-w-6xl py-6 px-4"
        aria-label="Categorized Emergency Hotlines Directory"
      >
        {displaySections.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-2xl shadow-sm space-y-3">
            <div className="p-3 bg-muted rounded-full w-fit mx-auto text-muted-foreground">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">No hotlines found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No emergency contacts matched &quot;{searchQuery}&quot;. Please check your keyword or reset your jurisdiction filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setScope('all')
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs btn-tactile"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {displaySections.map((section, idx) => {
              const Icon = CATEGORY_ICONS[section.category] || ShieldAlert
              return (
                <Card
                  key={idx}
                  className={`border-l-4 ${section.borderColor} shadow-sm overflow-hidden bg-card transition-all hover:shadow-md border-border/80`}
                >
                  {/* High-Contrast Card Header */}
                  <CardHeader className="bg-slate-900 text-white dark:bg-slate-800/95 py-3.5 px-4 border-b border-border/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-white/10 text-white shrink-0 shadow-inner">
                          <Icon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight truncate">
                          {section.category}
                        </CardTitle>
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-white/15 text-white shrink-0 border border-white/10">
                        {section.contacts.length} {section.contacts.length === 1 ? 'Hotline' : 'Hotlines'}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-4">
                    {section.contacts.map((contact, cIdx) => {
                      const numbers = contact.phone ? contact.phone.split(',').map((n: string) => n.trim()) : []
                      return (
                        <div key={cIdx}>
                          {cIdx > 0 && <Separator className="mb-4" />}

                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">
                              {contact.name}
                            </h3>
                            {contact.label && (
                              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/50 shrink-0">
                                {contact.label}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {numbers.map((number: string, nIdx: number) => {
                              const telUri = formatTelUri(number)
                              const isCopied = copiedNumber === number
                              return (
                                <div
                                  key={nIdx}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 dark:bg-muted/20 dark:hover:bg-muted/40 border border-border/60 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                      <Phone className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <a
                                        href={telUri}
                                        aria-label={`Call ${contact.name} at ${number}`}
                                        className="text-base sm:text-lg font-mono font-bold tracking-tight text-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors truncate focus:outline-none focus:underline"
                                      >
                                        {number}
                                      </a>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyNumber(number, e)}
                                      aria-label={`Copy phone number ${number} for ${contact.name}`}
                                      className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-bold rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground flex items-center justify-center gap-1.5 transition-colors btn-tactile cursor-pointer"
                                      title="Copy number"
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-[11px]">Copy</span>
                                        </>
                                      )}
                                    </button>

                                    <a
                                      href={telUri}
                                      aria-label={`Call ${contact.name} at ${number}`}
                                      className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white min-h-[44px] min-w-[44px] px-4 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all btn-tactile"
                                    >
                                      <Phone className="h-4 w-4 fill-current" />
                                      <span>Call</span>
                                    </a>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Civic Preparedness & Evacuation Info Footer */}
        <section
          aria-label="Civic Emergency Protocol and Evacuation Support"
          className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">When Calling 911 or Hotlines</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                State your exact Sitio/Street in Barangay Daine 1 or 2, describe the situation clearly, and stay on the line until instructed.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Typhoon & Brownout Ready</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                All numbers are cached in your browser. Phone calls will connect via standard telecommunications even during power failures.
              </p>
            </div>
          </div>

          <Link
            to="/map"
            className="group p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 shadow-xs flex items-start justify-between gap-3 transition-colors btn-tactile cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shrink-0">
                <Map className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  Interactive Evacuation Map
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  View designated disaster evacuation centers and relief stations across Indang.
                </p>
              </div>
            </div>
          </Link>
        </section>

        {/* Official Verification Notice */}
        <div className="mt-8 p-4 rounded-2xl bg-muted/40 border border-border/50 text-center max-w-2xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Emergency contact numbers are verified in coordination with the <strong>Barangay Councils of Daine 1 & Daine 2</strong> and the <strong>Municipality of Indang, Cavite</strong>. In any life-threatening situation, dial <strong>911</strong> immediately.
          </p>
        </div>
      </main>
    </div>
  )
}
