import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import {
  Search,
  MapPin,
  Phone,
  Clock,
  Store,
  X,
  RotateCcw,
  Sparkles,
  MessageCircle,
  Building2,
  CreditCard,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { FeedSkeleton } from '#/components/common/FeedSkeleton'
import { useBarangayScope } from '#/hooks/useBarangayScope'

const getBusinesses = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('businesses')
      .select(
        'id, name, category, address, phone, hours, photo_url, menu_image_url, misc_image_url, description, map_url, barangay, purok, messenger_link, payment_methods'
      )
      .eq('status', 'approved')
      .order('name')
    if (error) console.error('Error fetching businesses:', error)
    return data ?? []
  } catch (error) {
    console.error('Error in getBusinesses:', error)
    return []
  }
})

export const Route = createFileRoute('/directory/')({
  head: () => ({
    meta: [
      {
        title: 'MSME Business Directory | Barangay Daine',
      },
      {
        name: 'description',
        content:
          'Explore local sari-sari stores, eateries, repair shops, and MSMEs across Barangay Daine 1 and Daine 2, Indang, Cavite.',
      },
      {
        property: 'og:title',
        content: 'MSME Business Directory | Barangay Daine',
      },
      {
        property: 'og:description',
        content:
          'Explore local sari-sari stores, eateries, repair shops, and MSMEs across Barangay Daine 1 and Daine 2, Indang, Cavite.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }),
  component: DirectoryRoute,
  loader: () => getBusinesses(),
  pendingComponent: () => <FeedSkeleton />,
})

export const CATEGORIES = [
  'All',
  'Sari-Sari Store',
  'Eatery / Carenderia',
  'Water Station',
  'Laundry',
  'Salon',
  'Repair Shop',
  'Clinic',
  'Pharmacy',
  'Tailoring',
  'Others',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_COLORS: Record<string, string> = {
  'Sari-Sari Store':
    'bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-semibold',
  'Eatery / Carenderia':
    'bg-orange-100 text-orange-950 dark:bg-orange-950/80 dark:text-orange-200 border border-orange-300 dark:border-orange-700 font-semibold',
  'Water Station':
    'bg-blue-100 text-blue-950 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-semibold',
  Laundry:
    'bg-sky-100 text-sky-950 dark:bg-sky-950/80 dark:text-sky-200 border border-sky-300 dark:border-sky-700 font-semibold',
  Salon:
    'bg-pink-100 text-pink-950 dark:bg-pink-950/80 dark:text-pink-200 border border-pink-300 dark:border-pink-700 font-semibold',
  'Repair Shop':
    'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold',
  Clinic:
    'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-semibold',
  Pharmacy:
    'bg-teal-100 text-teal-950 dark:bg-teal-950/80 dark:text-teal-200 border border-teal-300 dark:border-teal-700 font-semibold',
  Tailoring:
    'bg-purple-100 text-purple-950 dark:bg-purple-950/80 dark:text-purple-200 border border-purple-300 dark:border-purple-700 font-semibold',
  Others:
    'bg-gray-100 text-gray-950 dark:bg-slate-800 dark:text-slate-200 border border-gray-300 dark:border-slate-700 font-semibold',
}

export interface OpenStatusResult {
  label: 'Open Now' | 'Open 24/7' | 'Closed Now' | 'Hours Not Listed'
  badgeClass: string
}

/**
 * Computes real-time business open/closed status from operating hours string.
 */
export function computeOpenStatus(hours?: string | null): OpenStatusResult {
  if (!hours || typeof hours !== 'string' || !hours.trim()) {
    return {
      label: 'Hours Not Listed',
      badgeClass: 'bg-slate-900/80 text-slate-200 dark:bg-slate-800/90 dark:text-slate-300 border-white/20',
    }
  }

  const raw = hours.trim().toLowerCase()

  // 24/7 check
  if (
    raw.includes('24/7') ||
    raw.includes('24 hours') ||
    raw.includes('24-hour') ||
    raw.includes('24 hrs') ||
    raw.includes('24hrs') ||
    raw.includes('always open') ||
    raw.includes('open 24')
  ) {
    return {
      label: 'Open 24/7',
      badgeClass:
        'bg-emerald-600 text-white dark:bg-emerald-900/90 dark:text-emerald-100 border-emerald-400/50 shadow-xs',
    }
  }

  // Parse time range e.g. "6:00 AM - 9:00 PM", "8:00 AM to 5:00 PM", "8am - 5pm", "08:00 - 17:00"
  const timeMatch = raw.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
  )

  if (timeMatch) {
    let startHour = parseInt(timeMatch[1], 10)
    const startMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const startAmPm = (timeMatch[3] || '').toLowerCase()

    let endHour = parseInt(timeMatch[4], 10)
    const endMin = timeMatch[5] ? parseInt(timeMatch[5], 10) : 0
    const endAmPm = (timeMatch[6] || '').toLowerCase()

    let inferredStartAmPm = startAmPm
    if (!startAmPm && endAmPm) {
      if (endAmPm === 'pm' && startHour < endHour) {
        inferredStartAmPm = 'pm'
      } else if (endAmPm === 'pm' && startHour > endHour && startHour !== 12) {
        inferredStartAmPm = 'am'
      } else if (endAmPm === 'am') {
        inferredStartAmPm = 'am'
      }
    }

    if (inferredStartAmPm === 'pm' && startHour < 12) startHour += 12
    if (inferredStartAmPm === 'am' && startHour === 12) startHour = 0

    if (endAmPm === 'pm' && endHour < 12) endHour += 12
    if (endAmPm === 'am' && endHour === 12) endHour = 0

    const startTotal = startHour * 60 + startMin
    const endTotal = endHour * 60 + endMin

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    let isOpen = false
    if (startTotal <= endTotal) {
      isOpen = currentMinutes >= startTotal && currentMinutes <= endTotal
    } else {
      // Overnight range, e.g. 6:00 PM to 2:00 AM
      isOpen = currentMinutes >= startTotal || currentMinutes <= endTotal
    }

    if (isOpen) {
      return {
        label: 'Open Now',
        badgeClass:
          'bg-emerald-600 text-white dark:bg-emerald-900/90 dark:text-emerald-100 border-emerald-400/50 shadow-xs',
      }
    } else {
      return {
        label: 'Closed Now',
        badgeClass:
          'bg-rose-600 text-white dark:bg-rose-950/90 dark:text-rose-100 border-rose-400/50 shadow-xs',
      }
    }
  }

  return {
    label: 'Hours Not Listed',
    badgeClass: 'bg-slate-900/80 text-slate-200 dark:bg-slate-800/90 dark:text-slate-300 border-white/20',
  }
}

export function getMessengerUrl(link?: string | null) {
  if (!link) return null
  const trimmed = link.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  if (trimmed.startsWith('m.me/')) {
    return `https://${trimmed}`
  }
  const clean = trimmed.replace(/^@/, '')
  return `https://m.me/${clean}`
}

function DirectoryRoute() {
  const businesses = Route.useLoaderData() ?? []
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const { scope: activeBarangayScope } = useBarangayScope()

  // Pre-calculate category count indicators scoped by current barangay scope
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    CATEGORIES.forEach((c) => {
      counts[c] = 0
    })

    businesses.forEach((b: any) => {
      if (activeBarangayScope !== 'all') {
        const dbScope = activeBarangayScope === 'daine1' ? 'daine_1' : 'daine_2'
        if (b.barangay && b.barangay !== dbScope) {
          return
        }
      }
      counts['All'] = (counts['All'] || 0) + 1
      if (b.category && counts[b.category] !== undefined) {
        counts[b.category] = (counts[b.category] || 0) + 1
      } else if (b.category) {
        counts['Others'] = (counts['Others'] || 0) + 1
      }
    })
    return counts
  }, [businesses, activeBarangayScope])

  const filtered = useMemo(() => {
    return businesses.filter((b: any) => {
      // Scope filter
      if (activeBarangayScope !== 'all') {
        const dbScope = activeBarangayScope === 'daine1' ? 'daine_1' : 'daine_2'
        if (b.barangay && b.barangay !== dbScope) {
          return false
        }
      }

      // Search match
      const searchTarget = `${b.name || ''} ${b.category || ''} ${b.address || ''} ${b.purok || ''} ${b.description || ''}`.toLowerCase()
      const matchesSearch = searchTarget.includes(search.toLowerCase())

      // Category match
      const matchesCategory = activeCategory === 'All' || b.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [businesses, search, activeCategory, activeBarangayScope])

  function handleReset() {
    setSearch('')
    setActiveCategory('All')
  }

  return (
    <div className="min-h-[100dvh] container mx-auto py-8 md:py-10 px-4 md:px-6 max-w-6xl">
      {/* High-visibility MSME Growth Hero Banner with Stitch Civic Horizon Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0038A8] via-[#002d87] to-teal-800 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-white/15 mb-8">
        {/* Glow and micro-pattern accents */}
        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:28px_28px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs sm:text-sm font-bold tracking-wide border border-white/30 text-amber-200 shadow-xs">
            <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
            <span>Barangay Daine MSME Growth &amp; Livelihood Hub</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-xs">
            Barangay Daine MSME &amp; Business Directory
          </h1>

          <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
            Discover and support local sari-sari stores, eateries, repair shops, water stations, and service providers across Daine 1 &amp; Daine 2. Own a local enterprise? Register your business today for free community visibility!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="min-h-[48px] px-6 font-bold bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 shadow-lg gap-2 text-sm sm:text-base btn-tactile rounded-xl border border-amber-300"
            >
              <Link to="/businesses/new">
                <Store className="h-5 w-5 text-slate-950" />
                Register / List Business
              </Link>
            </Button>
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-white/95 font-medium px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Free Verification for Daine Residents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="space-y-4 mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="directory-search"
            aria-label="Search businesses by name, service or keyword"
            placeholder="Search by name, category, purok, or street address…"
            className="pl-10 pr-10 h-12 text-sm rounded-xl bg-card shadow-2xs border-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Horizontal Category Pill Carousel */}
        <div className="relative">
          <div className="flex gap-2.5 overflow-x-auto pb-2.5 pt-1 scroll-smooth scrollbar-none -mx-1 px-1 touch-pan-x">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] ?? 0
              const isActive = activeCategory === cat

              return (
                <button
                  key={cat}
                  id={`category-filter-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setActiveCategory(cat as Category)}
                  className={`shrink-0 min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm font-bold ring-2 ring-primary/20'
                      : 'bg-card text-foreground/80 hover:text-foreground hover:bg-muted/80 border-border hover:border-primary/40'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`inline-flex items-center justify-center text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full min-w-[22px] font-bold ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Results count & reset */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'business' : 'businesses'} listed in{' '}
          <span className="text-foreground">
            {activeBarangayScope === 'daine1'
              ? 'Barangay Daine I'
              : activeBarangayScope === 'daine2'
                ? 'Barangay Daine II'
                : 'Barangay Daine (All)'}
          </span>
        </p>
        {(search || activeCategory !== 'All') && (
          <button
            onClick={handleReset}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 min-h-[44px] px-2 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
          </button>
        )}
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((business: any) => {
          const badgeClass =
            CATEGORY_COLORS[business.category as string] ??
            'bg-gray-100 text-gray-700 border-gray-200'
          const isDaine2 = business.barangay === 'daine_2'
          const messengerUrl = getMessengerUrl(business.messenger_link)
          const openStatus = computeOpenStatus(business.hours)

          return (
            <Card
              key={business.id}
              className="h-full flex flex-col border hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden bg-card group rounded-2xl"
            >
              {/* 16:9 Storefront Image */}
              <Link
                to="/directory/$businessId"
                params={{ businessId: business.id }}
                className="relative w-full aspect-video overflow-hidden rounded-t-xl bg-muted block"
              >
                <span className="sr-only">View details for {business.name}</span>
                {business.photo_url ? (
                  <img
                    src={business.photo_url}
                    alt={business.name}
                    width="400"
                    height="225"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 text-primary/40 transition-transform duration-300 group-hover:scale-105">
                    <div className="p-3.5 rounded-full bg-background/80 shadow-xs backdrop-blur-xs">
                      <Store className="h-7 w-7 text-primary/70" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground mt-2">
                      Barangay Daine MSME
                    </span>
                  </div>
                )}

                {/* Floating Category Badge (Top-left) */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none z-10">
                  <span
                    className={`inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md ${badgeClass}`}
                  >
                    {business.category}
                  </span>
                </div>

                {/* Floating Barangay Scope & Real-time Live Open/Closed Status Badges (Top-right) */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none z-10">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md ${
                      isDaine2
                        ? 'bg-purple-900/90 text-purple-100 border border-purple-400/50'
                        : 'bg-[#0038A8]/90 text-blue-100 border border-blue-400/50'
                    }`}
                  >
                    <Building2 className="h-3 w-3" />
                    {isDaine2 ? 'Daine 2' : 'Daine 1'}
                  </span>

                  {/* Pulsing Live Open Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md border ${openStatus.badgeClass}`}
                  >
                    {openStatus.label === 'Open Now' || openStatus.label === 'Open 24/7' ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
                        </span>
                        <span>{openStatus.label === 'Open 24/7' ? 'Open 24/7' : 'Open Now'}</span>
                      </>
                    ) : openStatus.label === 'Closed Now' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-rose-200 inline-block"></span>
                        <span>Closed Now</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span>Hours Not Listed</span>
                      </>
                    )}
                  </span>
                </div>
              </Link>

              {/* Card Body */}
              <CardHeader className="pb-2 pt-4 px-5">
                <Link
                  to="/directory/$businessId"
                  params={{ businessId: business.id }}
                  className="hover:text-primary transition-colors"
                >
                  <CardTitle className="text-base sm:text-lg font-extrabold leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {business.name}
                  </CardTitle>
                </Link>
              </CardHeader>

              <CardContent className="flex-1 px-5 pb-3 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                {/* Purok & Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <div className="line-clamp-2">
                    {business.purok && (
                      <span className="font-bold text-foreground mr-1">
                        {business.purok} •
                      </span>
                    )}
                    <span>{business.address}</span>
                  </div>
                </div>

                {/* Operating Hours */}
                {business.hours && (
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                    <span className="line-clamp-1 font-medium">{business.hours}</span>
                  </div>
                )}

                {/* Payment Methods */}
                {business.payment_methods &&
                  Array.isArray(business.payment_methods) &&
                  business.payment_methods.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {business.payment_methods.map((method: string) => (
                        <span
                          key={method}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  )}
              </CardContent>

              {/* Fixed 3-Action Footer on every card */}
              <CardFooter className="pt-2.5 pb-4 px-4 sm:px-5 flex items-center gap-2 border-t bg-muted/15 mt-auto">
                {/* 📞 Call Button */}
                {business.phone ? (
                  <a
                    href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}
                    className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white min-h-[44px] flex-1 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors btn-tactile"
                    title={`Call ${business.phone}`}
                    aria-label={`Call ${business.name} at ${business.phone}`}
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>Call</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="bg-muted text-muted-foreground/60 border border-border cursor-not-allowed min-h-[44px] flex-1 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    title="No phone number provided"
                    aria-label={`Phone number unavailable for ${business.name}`}
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    <span>Call</span>
                  </button>
                )}

                {/* 💬 Messenger Button */}
                {messengerUrl ? (
                  <a
                    href={messengerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white min-h-[44px] flex-1 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors btn-tactile"
                    title="Chat on Messenger"
                    aria-label={`Chat with ${business.name} on Messenger`}
                  >
                    <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Messenger</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="bg-muted text-muted-foreground/60 border border-border cursor-not-allowed min-h-[44px] flex-1 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    title="No Messenger link provided"
                    aria-label={`Messenger unavailable for ${business.name}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    <span>Messenger</span>
                  </button>
                )}

                {/* Details → Button */}
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="min-h-[44px] px-3.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1 shrink-0 border-border hover:border-primary/40 hover:bg-accent/15 hover:text-accent-foreground btn-tactile"
                >
                  <Link
                    to="/directory/$businessId"
                    params={{ businessId: business.id }}
                    aria-label={`View details for ${business.name}`}
                  >
                    <span>Details</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-4 border border-dashed rounded-3xl bg-card/50">
            <div className="p-4 bg-muted rounded-full">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">No businesses found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                No matching businesses found for this filter in{' '}
                {activeBarangayScope === 'daine1'
                  ? 'Daine 1'
                  : activeBarangayScope === 'daine2'
                    ? 'Daine 2'
                    : 'Barangay Daine'}
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleReset}
                className="min-h-[44px] gap-2 font-bold rounded-xl btn-tactile"
              >
                <RotateCcw className="h-4 w-4" /> Reset Filters
              </Button>
              <Button asChild className="min-h-[44px] font-bold rounded-xl btn-tactile">
                <Link to="/businesses/new">
                  <Store className="h-4 w-4 mr-2" /> Register Your Business
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
