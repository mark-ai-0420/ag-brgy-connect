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
    'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 font-semibold',
  'Eatery / Carenderia':
    'bg-orange-100 text-orange-950 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-300 font-semibold',
  'Water Station':
    'bg-blue-100 text-blue-950 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300 font-semibold',
  Laundry:
    'bg-sky-100 text-sky-950 dark:bg-sky-900/50 dark:text-sky-200 border border-sky-300 font-semibold',
  Salon:
    'bg-pink-100 text-pink-950 dark:bg-pink-900/50 dark:text-pink-200 border border-pink-300 font-semibold',
  'Repair Shop':
    'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 font-semibold',
  Clinic:
    'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 font-semibold',
  Pharmacy:
    'bg-teal-100 text-teal-950 dark:bg-teal-900/50 dark:text-teal-200 border border-teal-300 font-semibold',
  Tailoring:
    'bg-purple-100 text-purple-950 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-300 font-semibold',
  Others:
    'bg-gray-100 text-gray-950 dark:bg-slate-800 dark:text-slate-200 border border-gray-300 font-semibold',
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
      badgeClass: 'bg-muted text-muted-foreground border-border',
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
        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
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
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      }
    } else {
      return {
        label: 'Closed Now',
        badgeClass:
          'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      }
    }
  }

  return {
    label: 'Hours Not Listed',
    badgeClass: 'bg-muted text-muted-foreground border-border',
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
  const businesses = Route.useLoaderData()
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
    <div className="container mx-auto py-8 md:py-10 px-4 md:px-6 max-w-6xl">
      {/* High-visibility MSME Growth Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-primary text-white p-6 sm:p-8 md:p-10 shadow-lg mb-8">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs sm:text-sm font-semibold tracking-wide border border-white/30 text-white">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Promote Your Business — Free Listing for Daine MSMEs</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Barangay Daine MSME &amp; Business Directory
          </h1>

          <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
            Support local sari-sari stores, eateries, repair shops, and services in Daine 1 &amp; Daine 2. Own a local enterprise? List your business today at zero cost to reach the entire community!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="min-h-[48px] px-6 font-bold bg-white text-emerald-950 hover:bg-white/90 shadow-md gap-2 text-sm sm:text-base"
            >
              <Link to="/businesses/new">
                <Store className="h-5 w-5 text-emerald-700" />
                Register / List Business
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 font-medium px-2 py-1">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-300 animate-pulse" />
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
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Carousel Polish */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scroll-smooth scrollbar-none -mx-1 px-1">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] ?? 0
              const isActive = activeCategory === cat

              return (
                <button
                  key={cat}
                  id={`category-filter-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setActiveCategory(cat as Category)}
                  className={`shrink-0 min-h-[40px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-150 flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                      : 'bg-card text-slate-700 dark:text-slate-200 border-border hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`inline-flex items-center justify-center text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full min-w-[20px] font-semibold ${
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
        <p className="text-sm font-medium text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'business' : 'businesses'} listed in{' '}
          {activeBarangayScope === 'daine1'
            ? 'Barangay Daine I'
            : activeBarangayScope === 'daine2'
              ? 'Barangay Daine II'
              : 'Barangay Daine (All)'}
        </p>
        {(search || activeCategory !== 'All') && (
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 min-h-[44px] px-2 cursor-pointer"
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
              className="h-full flex flex-col border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden bg-card group"
            >
              {/* Storefront Image */}
              <Link
                to="/directory/$businessId"
                params={{ businessId: business.id }}
                className="relative w-full aspect-video h-48 overflow-hidden rounded-t-xl bg-muted block"
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
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 text-primary/40 transition-transform duration-300 group-hover:scale-105">
                    <div className="p-3 rounded-full bg-background/80 shadow-xs backdrop-blur-xs">
                      <Store className="h-6 w-6 text-primary/70" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground mt-2 tracking-wide uppercase">
                      Barangay Daine MSME
                    </span>
                  </div>
                )}

                {/* Floating Category Badge (Top-left) */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none z-10">
                  <span
                    className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs backdrop-blur-md ${badgeClass}`}
                  >
                    {business.category}
                  </span>
                </div>

                {/* Floating Barangay Scope & Real-time Open Status Badges (Top-right) */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none z-10">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs backdrop-blur-md ${
                      isDaine2
                        ? 'bg-purple-900/90 text-purple-100 border border-purple-400/40'
                        : 'bg-blue-900/90 text-blue-100 border border-blue-400/40'
                    }`}
                  >
                    <Building2 className="h-3 w-3" />
                    {isDaine2 ? 'Daine 2' : 'Daine 1'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs backdrop-blur-md border ${openStatus.badgeClass}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        openStatus.label === 'Open Now' || openStatus.label === 'Open 24/7'
                          ? 'bg-emerald-500 animate-pulse'
                          : openStatus.label === 'Closed Now'
                            ? 'bg-rose-500'
                            : 'bg-muted-foreground/60'
                      }`}
                    />
                    {openStatus.label}
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
                  <CardTitle className="text-base font-bold leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {business.name}
                  </CardTitle>
                </Link>
              </CardHeader>

              <CardContent className="flex-1 px-5 pb-3 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                {/* Purok & Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <div className="line-clamp-2">
                    {business.purok && (
                      <span className="font-semibold text-foreground mr-1">
                        {business.purok} •
                      </span>
                    )}
                    <span>{business.address}</span>
                  </div>
                </div>

                {/* Operating Hours */}
                {business.hours && (
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <span className="line-clamp-1">{business.hours}</span>
                  </div>
                )}

                {/* Payment Methods */}
                {business.payment_methods &&
                  Array.isArray(business.payment_methods) &&
                  business.payment_methods.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <CreditCard className="h-3 w-3 text-muted-foreground shrink-0" />
                      {business.payment_methods.map((method: string) => (
                        <span
                          key={method}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  )}
              </CardContent>

              {/* Fixed 3-Action Footer on every card */}
              <CardFooter className="pt-2 pb-4 px-5 flex items-center gap-2 border-t bg-muted/10">
                {/* 📞 Call Button */}
                {business.phone ? (
                  <a
                    href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white min-h-[40px] flex-1 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
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
                    className="bg-muted text-muted-foreground/60 border border-border cursor-not-allowed min-h-[40px] flex-1 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                    title="No phone number provided"
                    aria-label={`Phone number unavailable for ${business.name}`}
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>Call</span>
                  </button>
                )}

                {/* 💬 Messenger Button */}
                {messengerUrl ? (
                  <a
                    href={messengerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-sky-700 hover:bg-sky-800 text-white min-h-[40px] flex-1 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
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
                    className="bg-muted text-muted-foreground/60 border border-border cursor-not-allowed min-h-[40px] flex-1 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                    title="No Messenger link provided"
                    aria-label={`Messenger unavailable for ${business.name}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Messenger</span>
                  </button>
                )}

                {/* View Details */}
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="min-h-[40px] px-3 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 shrink-0"
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
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="min-h-[44px] gap-2 font-semibold"
              >
                <RotateCcw className="h-4 w-4" /> Reset Filters
              </Button>
              <Button asChild className="min-h-[44px] font-semibold">
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
