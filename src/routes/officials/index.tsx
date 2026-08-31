import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Award,
  Phone,
  Mail,
  Clock,
  MapPin,
  Calendar,
  Shield,
  UserCheck,
  Building2,
  Users,
  ChevronRight,
  Sparkles,
  Layers,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react'
import { useState, useMemo } from 'react'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useBarangayScope, type BarangayScope } from '#/hooks/useBarangayScope'
import { FeedSkeleton } from '#/components/common/FeedSkeleton'

export interface Official {
  id: string
  name: string
  position: string
  committee: string | null
  photo_url: string | null
  contact_number: string | null
  term: string
  display_order: number
  barangay: 'daine_1' | 'daine_2'
  created_at?: string
}

export const getOfficials = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('barangay_officials')
      .select('id, name, position, committee, photo_url, contact_number, term, display_order, barangay')
      .order('display_order', { ascending: true })
    if (error) console.error('Error fetching officials:', error)
    return (data as Official[]) ?? []
  } catch (error) {
    console.error('Error in getOfficials:', error)
    return []
  }
})

export const Route = createFileRoute('/officials/')({
  head: () => ({
    meta: [
      {
        title: 'Barangay Officials Roster | Barangay Daine Governance',
      },
      {
        name: 'description',
        content:
          'Meet the elected Punong Barangay, Sangguniang Barangay Kagawad members, and appointed officials of Barangay Daine 1 and Daine 2, Indang, Cavite.',
      },
      {
        property: 'og:title',
        content: 'Barangay Officials Roster | Barangay Daine Governance',
      },
      {
        property: 'og:description',
        content:
          'Meet the elected Punong Barangay, Sangguniang Barangay Kagawad members, and appointed officials of Barangay Daine 1 and Daine 2, Indang, Cavite.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }),
  component: OfficialsRoute,
  loader: () => getOfficials(),
  pendingComponent: () => <FeedSkeleton />,
})

// Committee assignment color accents
const COMMITTEE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Appropriations: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  'Peace & Order': { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' },
  'Health & Sanitation': { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-800 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-800' },
  'Education & Culture': { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-800 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-800' },
  'Agriculture & Livelihood': { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
  'Infrastructure & Public Works': { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800' },
  'Environment & Clean and Green': { bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-800 dark:text-green-300', border: 'border-green-300 dark:border-green-800' },
  'Youth & Sports Development': { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800' },
  Executive: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-900 dark:text-amber-200', border: 'border-amber-400 dark:border-amber-700' },
  Records: { bg: 'bg-slate-50 dark:bg-slate-900/60', text: 'text-slate-800 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
  Finance: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
}

function getCommitteeStyle(committee: string | null) {
  if (!committee) return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300 dark:border-slate-700' }
  for (const [key, style] of Object.entries(COMMITTEE_COLORS)) {
    if (committee.toLowerCase().includes(key.toLowerCase())) {
      return style
    }
  }
  return { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' }
}

function getConsultationSchedule(position: string, committee: string | null): string {
  const p = position.toLowerCase()
  if (p.includes('punong barangay') || p.includes('captain')) {
    return 'Monday – Friday • 8:00 AM – 5:00 PM (Executive Hours)'
  }
  if (p.includes('secretary')) {
    return 'Monday – Friday • 8:00 AM – 5:00 PM (Document Services)'
  }
  if (p.includes('treasurer')) {
    return 'Monday – Friday • 8:30 AM – 4:30 PM (Disbursements & Fees)'
  }
  if (p.includes('sk chairperson')) {
    return 'Saturdays • 9:00 AM – 4:00 PM & Youth Assembly Days'
  }
  if (committee?.toLowerCase().includes('peace')) {
    return 'Mondays & Wednesdays • 9:00 AM – 12:00 PM & On-Call'
  }
  if (committee?.toLowerCase().includes('health')) {
    return 'Tuesdays & Thursdays • 8:30 AM – 12:00 PM (Health Center)'
  }
  if (committee?.toLowerCase().includes('appropriations')) {
    return 'Wednesdays & Fridays • 1:00 PM – 4:00 PM'
  }
  return 'Tuesdays & Thursdays • 9:00 AM – 12:00 PM (Session Hall)'
}

// Punong Barangay Executive Spotlight Component
function PunongBarangaySpotlight({ official }: { official: Official }) {
  const barangayLabel =
    official.barangay === 'daine_1'
      ? 'Barangay Daine 1'
      : official.barangay === 'daine_2'
        ? 'Barangay Daine 2'
        : 'Barangay Daine'
  const barangayColor = official.barangay === 'daine_1' ? '#0038A8' : '#CE1126'
  const contactPhone = official.contact_number || '+63 918 123 4567'

  return (
    <Card className="overflow-hidden border-2 border-amber-400/90 dark:border-amber-500/80 bg-gradient-to-br from-amber-50/50 via-card to-background dark:from-amber-950/20 dark:via-card dark:to-background shadow-xl ring-1 ring-amber-400/30 rounded-3xl">
      {/* Top Banner Ribbon */}
      <div className="bg-gradient-to-r from-[#002675] via-[#0038A8] to-[#1E3A8A] text-white px-6 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-[#FCD116]" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Chief Executive & Sangguniang Head
          </span>
        </div>
        <Badge className="bg-[#FCD116] text-slate-950 font-black text-xs px-3 py-1 shadow-xs border-0">
          {official.term || '2023 - 2026 Term'}
        </Badge>
      </div>

      <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
        {/* Official Portrait or Seal */}
        <div className="relative shrink-0 text-center">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-amber-400/50 border-4 border-background bg-muted">
            {official.photo_url ? (
              <img
                src={official.photo_url}
                alt={official.name}
                width="176"
                height="176"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <img
                src="/logo.jpg"
                alt="Official Seal of Barangay Daine"
                width="176"
                height="176"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* Official Seal Badge */}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-md border-2 border-amber-400 flex items-center justify-center p-1">
            <img src="/logo.jpg" alt="Seal" width="40" height="40" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>

        {/* Executive Info & Credentials */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 text-white shadow-xs" style={{ backgroundColor: barangayColor }}>
              <Building2 className="h-3.5 w-3.5" />
              <span>{barangayLabel} Jurisdiction</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {official.name}
            </h2>
            <p className="text-base font-bold text-[#002878] dark:text-[#93c5fd] mt-0.5">
              Punong Barangay (Barangay Captain)
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Overall Executive Administration, Law Enforcement, & Community Leadership
            </p>
          </div>

          {/* Consultation Schedule Box */}
          <div className="rounded-2xl bg-muted/60 dark:bg-muted/30 p-4 border border-border space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-foreground">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>Public Consultation Office Hours:</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-foreground/90 font-mono">
              {getConsultationSchedule(official.position, official.committee)}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground pt-1">
              <MapPin className="h-3.5 w-3.5 text-[#CE1126] shrink-0" />
              <span>Executive Suite, {barangayLabel} Barangay Hall, Indang, Cavite</span>
            </div>
          </div>

          {/* Contact Triggers */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <Button
              size="default"
              className="font-bold min-h-[44px] h-11 px-5 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 cursor-pointer"
              asChild
            >
              <a href={`tel:${contactPhone.replace(/\s+/g, '')}`}>
                <Phone className="h-4 w-4" />
                <span>Call Executive Desk ({contactPhone})</span>
              </a>
            </Button>

            <Button
              variant="outline"
              size="default"
              className="font-bold min-h-[44px] h-11 px-4 rounded-xl border-border hover:border-primary text-foreground hover:text-primary cursor-pointer"
              asChild
            >
              <a href="mailto:office@barangaydaine.gov.ph">
                <Mail className="h-4 w-4 mr-2" />
                <span>Send Formal Inquiry</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Kagawad & Appointed Official Card Component
function OfficialCard({ official }: { official: Official }) {
  const committeeStyle = getCommitteeStyle(official.committee)
  const schedule = getConsultationSchedule(official.position, official.committee)
  const contactPhone = official.contact_number || '+63 918 123 4567'

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-border/80 hover:border-primary/50 bg-card rounded-2xl shadow-sm">
      <CardHeader className="pb-3 pt-5 px-5 space-y-3">
        <div className="flex items-start gap-4">
          {/* Avatar / Seal */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shadow-md ring-2 ring-primary/20 border-2 border-background bg-muted">
              {official.photo_url ? (
                <img
                  src={official.photo_url}
                  alt={official.name}
                  width="48"
                  height="48"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <img
                  src="/logo.jpg"
                  alt={official.name}
                  width="48"
                  height="48"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center text-white text-[10px]" title="Active in Office">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#002878] dark:text-[#93c5fd]">
              {official.position}
            </span>
            <h3 className="text-base sm:text-lg font-black text-foreground leading-snug tracking-tight truncate group-hover:text-primary transition-colors">
              {official.name}
            </h3>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {official.term || '2023 - 2026'}
            </span>
          </div>
        </div>

        {/* Committee Assignment Badge */}
        {official.committee && (
          <div className={`p-2.5 rounded-xl border ${committeeStyle.bg} ${committeeStyle.border}`}>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Committee Assignment
            </p>
            <p className={`text-xs font-bold leading-tight mt-0.5 ${committeeStyle.text}`}>
              {official.committee}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-2.5 text-xs text-muted-foreground pb-4 px-5">
        {/* Office Hours */}
        <div className="space-y-1 rounded-lg bg-muted/40 p-2.5 border border-border/50">
          <div className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Consultation Schedule:</span>
          </div>
          <p className="font-mono text-[11px] font-semibold text-foreground/80 leading-relaxed">
            {schedule}
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-3 pb-4 px-5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="default"
          className="w-full font-bold min-h-[44px] h-11 px-3 rounded-xl border-primary/40 hover:border-primary text-[#002878] dark:text-[#93c5fd] hover:bg-primary hover:text-white dark:hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          asChild
        >
          <a href={`tel:${contactPhone.replace(/\s+/g, '')}`}>
            <Phone className="h-4 w-4 shrink-0" />
            <span>Contact Desk</span>
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

function OfficialsRoute() {
  const allOfficials = Route.useLoaderData() ?? []
  const { scope: activeBarangayScope, setScope } = useBarangayScope()
  const [selectedBarangayTab, setSelectedBarangayTab] = useState<'daine_1' | 'daine_2'>(
    activeBarangayScope === 'daine2' ? 'daine_2' : 'daine_1'
  )

  // Keep local tab in sync with global scope if changed from header
  const currentBarangay = activeBarangayScope === 'daine2' ? 'daine_2' : 'daine_1'
  const activeTab = activeBarangayScope === 'all' ? selectedBarangayTab : currentBarangay

  const officialsForBarangay = useMemo(() => {
    return allOfficials.filter((o: Official) => o.barangay === activeTab)
  }, [allOfficials, activeTab])

  // Categorize officials
  const punongBarangay = useMemo(() => {
    return officialsForBarangay.find(
      (o: Official) =>
        o.position.toLowerCase().includes('punong barangay') ||
        o.position.toLowerCase().includes('captain') ||
        o.display_order === 1
    )
  }, [officialsForBarangay])

  const kagawads = useMemo(() => {
    return officialsForBarangay.filter(
      (o: Official) =>
        o.position.toLowerCase().includes('kagawad') ||
        (o.display_order >= 2 && o.display_order <= 8 && !o.position.toLowerCase().includes('punong') && !o.position.toLowerCase().includes('sk'))
    )
  }, [officialsForBarangay])

  const skChairperson = useMemo(() => {
    return officialsForBarangay.find(
      (o: Official) => o.position.toLowerCase().includes('sk') || o.position.toLowerCase().includes('youth')
    )
  }, [officialsForBarangay])

  const appointedOfficials = useMemo(() => {
    return officialsForBarangay.filter(
      (o: Official) =>
        o.position.toLowerCase().includes('secretary') ||
        o.position.toLowerCase().includes('treasurer') ||
        o.position.toLowerCase().includes('tanod') ||
        o.display_order >= 9
    )
  }, [officialsForBarangay])

  const barangayDisplayName = activeTab === 'daine_1' ? 'Barangay Daine 1' : 'Barangay Daine 2'

  return (
    <div className="min-h-[100dvh] pb-20 bg-slate-50/50 dark:bg-background">
      {/* ── 1. Hero Civic Horizon Header ───────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#002675] via-[#0038A8] to-[#1E3A8A] text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        {/* Flag Accent Ribbon */}
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
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shrink-0 shadow-lg">
                <img
                  src="/logo.jpg"
                  alt="Official Seal of Barangay Daine"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#FCD116] text-xs font-bold mb-1.5 backdrop-blur-md">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Executive Governance & Council Roster</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  Barangay Officials Roster
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm max-w-xl font-medium mt-1">
                  Meet the democratically elected leaders and appointed public servants of Barangay Daine, Indang, Cavite.
                </p>
              </div>
            </div>

            {/* General Consultation Quick Action */}
            <div className="shrink-0 flex items-center gap-3">
              <Button
                variant="outline"
                size="default"
                className="bg-white/10 hover:bg-white/20 text-white font-bold min-h-[44px] h-11 px-4 rounded-xl border-white/30 backdrop-blur-md cursor-pointer"
                asChild
              >
                <Link to="/directory">
                  <Building2 className="h-4 w-4 mr-2 text-[#FCD116]" />
                  <span>Public Services Directory</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. Jurisdiction Switcher & Council Summary ─────────────────────────── */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl -mt-5 relative z-20">
        <div className="bg-card text-card-foreground p-4 sm:p-5 rounded-2xl shadow-xl border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-muted-foreground mr-1 shrink-0">Jurisdiction:</span>
            <div className="inline-flex p-1 bg-muted rounded-xl border border-border w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedBarangayTab('daine_1')
                  if (activeBarangayScope !== 'all') setScope('daine1')
                }}
                className={`flex-1 sm:flex-none min-h-[38px] px-5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'daine_1'
                    ? 'bg-[#0038A8] text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                }`}
              >
                Barangay Daine 1
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedBarangayTab('daine_2')
                  if (activeBarangayScope !== 'all') setScope('daine2')
                }}
                className={`flex-1 sm:flex-none min-h-[38px] px-5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'daine_2'
                    ? 'bg-[#CE1126] text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                }`}
              >
                Barangay Daine 2
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted border border-border">
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <span>Term 2023 - 2026 &bull; Sangguniang Barangay Roster</span>
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-6xl mt-8 space-y-12">
        {/* ── 3. Punong Barangay Executive Spotlight ──────────────────────────── */}
        {punongBarangay && (
          <section aria-labelledby="executive-spotlight-heading">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                <Award className="h-4 w-4" />
              </div>
              <h2
                id="executive-spotlight-heading"
                className="text-sm font-black uppercase tracking-wider text-amber-700 dark:text-amber-400"
              >
                Executive Leadership &bull; {barangayDisplayName}
              </h2>
            </div>
            <PunongBarangaySpotlight official={punongBarangay} />
          </section>
        )}

        {/* ── 4. Sangguniang Barangay Kagawad Roster ─────────────────────────── */}
        <section aria-labelledby="kagawad-roster-heading">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h2
                  id="kagawad-roster-heading"
                  className="text-lg font-black tracking-tight text-foreground"
                >
                  Sangguniang Barangay Kagawad Roster
                </h2>
                <p className="text-xs text-muted-foreground">
                  Elected councilors presiding over legislative committees and citizen public hearings
                </p>
              </div>
            </div>
            <Badge variant="outline" className="font-bold text-xs">
              {kagawads.length} Kagawad Members
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kagawads.map((official: Official) => (
              <OfficialCard key={official.id} official={official} />
            ))}
          </div>
        </section>

        {/* ── 5. Youth Leadership & Appointed Administrative Officers ────────── */}
        <section aria-labelledby="administrative-roster-heading">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div>
                <h2
                  id="administrative-roster-heading"
                  className="text-lg font-black tracking-tight text-foreground"
                >
                  Youth Leadership & Administrative Officers
                </h2>
                <p className="text-xs text-muted-foreground">
                  SK Chairperson, Barangay Secretary, and Barangay Treasurer supporting operational governance
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skChairperson && <OfficialCard official={skChairperson} />}
            {appointedOfficials.map((official: Official) => (
              <OfficialCard key={official.id} official={official} />
            ))}
          </div>
        </section>

        {/* ── 6. Public Consultation & Hall Guidelines Card ──────────────────── */}
        <Card className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-6 sm:p-8 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Building2 className="h-3.5 w-3.5" />
                <span>Citizen Consultation Guide</span>
              </div>
              <h3 className="text-xl font-black text-foreground tracking-tight">
                Need to Consult an Official or Attend Regular Barangay Sessions?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Regular Sangguniang Barangay public sessions are held every 1st and 3rd Monday of the month at the Session Hall. Walk-in consultations are welcome during official office hours. For document requests or formal mediation hearings, please visit the Barangay Secretary desk.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                size="default"
                className="font-bold min-h-[44px] h-11 px-5 rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer"
                asChild
              >
                <Link to="/map">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>View Hall Location</span>
                </Link>
              </Button>
              <Button
                size="default"
                className="font-bold min-h-[44px] h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
                asChild
              >
                <Link to="/documents">
                  <span>Request Document</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
