import { createFileRoute } from '@tanstack/react-router'
import { useMemo, type ComponentType } from 'react'
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
} from 'lucide-react'
import { useBarangayScope } from '#/hooks/useBarangayScope'
import { useNetworkStatus } from '#/hooks/useNetworkStatus'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'

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
    title: 'National Emergency',
    subtitle: 'Direct Emergency Dispatch',
    number: '911',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    cardStyle: 'bg-red-500/10 border-red-500/20',
    badge: '🚨 Direct Dispatch',
  },
  {
    title: 'PNP Indang Police',
    subtitle: 'Municipal Police Desk',
    number: '(046) 415-0211',
    icon: ShieldCheck,
    color: 'text-indigo-600 dark:text-indigo-400',
    cardStyle: 'bg-indigo-500/10 border-indigo-500/20',
    badge: '🚓 Law & Order',
  },
  {
    title: 'BFP Indang Fire',
    subtitle: 'Fire & Rescue Station',
    number: '(046) 415-0322',
    icon: Flame,
    color: 'text-amber-600 dark:text-amber-400',
    cardStyle: 'bg-amber-500/10 border-amber-500/20',
    badge: '🚒 Fire Protection',
  },
  {
    title: 'MDRRMO Rescue',
    subtitle: 'Disaster & Medical Rescue',
    number: '0998-555-0100',
    icon: Ambulance,
    color: 'text-emerald-600 dark:text-emerald-400',
    cardStyle: 'bg-emerald-500/10 border-emerald-500/20',
    badge: '🚑 Emergency Med',
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
  component: EmergencyRoute,
  loader: () => getEmergencyContacts(),
})

function EmergencyRoute() {
  const dbContacts = Route.useLoaderData() ?? []
  const { scope, setScope } = useBarangayScope()
  const { isOffline } = useNetworkStatus()

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

    return sections
  }, [dbContacts, scope])

  return (
    <div className="min-h-screen pb-16">
      {/* Prominent Civic Offline Banner */}
      {isOffline && (
        <aside
          aria-label="Offline Mode Notification"
          className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 border-b-2 border-amber-700 text-slate-950 px-4 py-3.5 shadow-lg transition-all animate-in slide-in-from-top duration-300"
        >
          <div className="container mx-auto max-w-5xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950 text-amber-300 shrink-0 shadow-inner">
              <WifiOff className="h-5 w-5 animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm md:text-base font-black leading-relaxed tracking-tight text-white drop-shadow-xs">
              ⚡ Offline Mode Active — Ang lahat ng emergency hotlines ay maaari pa ring tawagan gamit ang regular direct phone call kahit walang signal o Wi-Fi.
            </p>
          </div>
        </aside>
      )}

      {/* Urgent header banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-8 sm:py-10 px-4 shadow-md">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            <div className="flex-shrink-0 p-3.5 sm:p-4 bg-white/15 rounded-2xl backdrop-blur-sm ring-1 ring-white/20 shadow-inner">
              <AlertTriangle className="h-9 w-9 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                Emergency Hotlines & Responders
              </h1>
              <p className="text-red-50 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed font-normal">
                In case of emergency, contact the appropriate authorities{' '}
                <strong className="text-white font-bold underline decoration-yellow-400 underline-offset-2">immediately</strong>. Tap any speed-dial card or hotline button to place a direct call.
              </p>
            </div>
          </div>

          {/* Top Hero Speed-Dial Section: 2x2 on Mobile, 4x1 on Desktop */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-red-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-100">
                Priority Speed-Dial Responders
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
                    aria-label={`Call ${card.title} at ${card.number}`}
                    className={`group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border ${card.cardStyle} shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[52px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-red-700`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-2.5">
                      <div className={`p-2 rounded-xl ${card.cardStyle} shrink-0`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 dark:bg-slate-800 px-2 py-0.5 rounded-full line-clamp-1">
                        {card.badge}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xs sm:text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {card.title}
                      </h2>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {card.subtitle}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-1">
                      <span className={`text-base sm:text-lg font-black tracking-tight ${card.color}`}>
                        {card.number}
                      </span>
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-600 group-hover:bg-emerald-700 text-white shadow-xs shrink-0 transition-colors">
                        <Phone className="h-3.5 w-3.5 fill-current" />
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scope Filter Tabs */}
      <div className="container mx-auto max-w-5xl px-4 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card border border-border rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Showing Hotlines for:</span>
          </div>
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl">
            {(['all', 'daine1', 'daine2'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  scope === s
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {s === 'all' ? 'All Jurisdictions' : s === 'daine1' ? 'Barangay Daine 1' : 'Barangay Daine 2'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categorized Hotlines Cards Grid */}
      <div className="container mx-auto max-w-5xl py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displaySections.map((section, idx) => {
            const Icon = CATEGORY_ICONS[section.category] || ShieldAlert
            return (
              <Card
                key={idx}
                className={`border-l-4 ${section.borderColor} shadow-sm overflow-hidden bg-card transition-all hover:shadow-md`}
              >
                <CardHeader className={`pb-3 ${section.bgAccent}`}>
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-5 w-5 ${section.color} shrink-0`} />
                    <CardTitle className="text-base font-bold text-foreground leading-tight">
                      {section.category}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {section.contacts.map((contact, cIdx) => {
                    const numbers = contact.phone ? contact.phone.split(',').map((n: string) => n.trim()) : []
                    return (
                      <div key={cIdx}>
                        {cIdx > 0 && <Separator className="mb-4" />}
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-bold text-foreground">
                            {contact.name}
                          </p>
                          {contact.label && (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                              {contact.label}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2.5">
                          {numbers.map((number: string, nIdx: number) => {
                            const telUri = formatTelUri(number)
                            return (
                              <div
                                key={nIdx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 dark:bg-muted/20 dark:hover:bg-muted/40 border border-border/50 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <a
                                    href={telUri}
                                    className="text-base sm:text-lg font-bold tracking-tight text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate"
                                  >
                                    {number}
                                  </a>
                                </div>
                                <a
                                  href={telUri}
                                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white min-h-[44px] px-4 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                  aria-label={`Call ${contact.name} at ${number}`}
                                >
                                  <Phone className="h-4 w-4 fill-current" />
                                  <span>Call</span>
                                </a>
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

        {/* Disclaimer */}
        <div className="mt-10 p-4 rounded-2xl bg-muted/40 border border-border/50 text-center max-w-xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Emergency contact numbers are regularly verified by the Barangay Councils of Daine 1 & Daine 2 in coordination with the Municipality of Indang, Cavite. For immediate life-threatening incidents, please call <strong>911</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
