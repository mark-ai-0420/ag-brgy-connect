import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardFooter, CardHeader } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import {
  Bell,
  Pin,
  CalendarDays,
  ChevronRight,
  Filter,
  Megaphone,
  AlertTriangle,
  Flame,
  CloudRain,
  PhoneCall,
  Search,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useState, useMemo } from 'react'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useBarangayScope, type BarangayScope } from '#/hooks/useBarangayScope'
import { FeedSkeleton } from '#/components/common/FeedSkeleton'

export interface AnnouncementItem {
  id: string
  title: string
  body: string
  pinned: boolean
  created_at: string
  author_id?: string | null
  category: string | null
  scope: 'all' | 'daine_1' | 'daine_2' | 'both' | null
  image_url: string | null
}

export const getAnnouncements = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, pinned, created_at, author_id, category, scope, image_url')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) console.error('Error fetching announcements:', error)
    return (data as AnnouncementItem[]) ?? []
  } catch (error) {
    console.error('Error in getAnnouncements:', error)
    return []
  }
})

export const Route = createFileRoute('/announcements/')({
  head: () => ({
    meta: [
      {
        title: 'Civic Bulletins & Advisories | Barangay Daine',
      },
      {
        name: 'description',
        content:
          'Official announcements, calamity advisories, infrastructure updates, and community bulletins from Barangay Daine 1 and Daine 2, Indang, Cavite.',
      },
      {
        property: 'og:title',
        content: 'Civic Bulletins & Advisories | Barangay Daine',
      },
      {
        property: 'og:description',
        content:
          'Official announcements, calamity advisories, infrastructure updates, and community bulletins from Barangay Daine 1 and Daine 2, Indang, Cavite.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }),
  component: AnnouncementsRoute,
  loader: () => getAnnouncements(),
  pendingComponent: () => <FeedSkeleton />,
})

const CATEGORY_COLORS: Record<string, { badge: string; dot: string }> = {
  General: {
    badge: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-300 font-semibold',
    dot: 'bg-slate-500',
  },
  Advisory: {
    badge: 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-400 font-bold',
    dot: 'bg-amber-500',
  },
  Emergency: {
    badge: 'bg-red-100 text-red-950 dark:bg-red-950/60 dark:text-red-200 border border-red-400 font-extrabold',
    dot: 'bg-red-500',
  },
  Programs: {
    badge: 'bg-purple-100 text-purple-950 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-300 font-semibold',
    dot: 'bg-purple-500',
  },
  Infrastructure: {
    badge: 'bg-orange-100 text-orange-950 dark:bg-orange-950/60 dark:text-orange-200 border border-orange-300 font-semibold',
    dot: 'bg-orange-500',
  },
  Health: {
    badge: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300 font-semibold',
    dot: 'bg-emerald-500',
  },
}

function AnnouncementCard({ item, highlighted = false }: { item: AnnouncementItem; highlighted?: boolean }) {
  const words = item.body ? item.body.split(' ') : []
  const truncatedBody = words.slice(0, 24).join(' ') + (words.length > 24 ? '…' : '')
  const categoryConfig = item.category ? CATEGORY_COLORS[item.category] : null

  return (
    <Card
      className={`group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border ${
        highlighted
          ? 'border-amber-400/90 dark:border-amber-500/80 bg-gradient-to-b from-amber-50/40 via-card to-card dark:from-amber-950/25 dark:to-card ring-1 ring-amber-400/40 shadow-md'
          : 'border-border/80 hover:border-primary/50 bg-card shadow-sm'
      }`}
    >
      {/* Hero Banner / Fallback Image with Explicit Dimensions */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            width="400"
            height="225"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-secondary text-primary/60 group-hover:text-primary transition-colors p-4">
            <div className="p-3.5 rounded-2xl bg-background/80 shadow-xs backdrop-blur-xs ring-1 ring-primary/15">
              <Megaphone className="h-7 w-7 text-primary" />
            </div>
            <span className="text-[11px] font-bold text-foreground/70 mt-2.5 tracking-wider uppercase">
              Official Civic Notice
            </span>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none z-10">
          <div className="flex flex-wrap items-center gap-1.5 max-w-[70%]">
            {item.pinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-[#FCD116] text-slate-950 shadow-md border border-amber-500/40 backdrop-blur-md">
                <Pin className="h-3.5 w-3.5 fill-slate-950 shrink-0" />
                PINNED
              </span>
            )}
            {item.category && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-md ${
                  categoryConfig?.badge ?? 'bg-background/90 text-foreground border border-border'
                }`}
              >
                {categoryConfig && <span className={`w-1.5 h-1.5 rounded-full ${categoryConfig.dot}`} />}
                {item.category}
              </span>
            )}
          </div>

          {item.scope && (
            <span
              className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md backdrop-blur-md border border-white/20 ${
                item.scope === 'both' || item.scope === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : item.scope === 'daine_1'
                    ? 'bg-[#0038A8] text-white'
                    : 'bg-[#CE1126] text-white'
              }`}
            >
              {item.scope === 'both' || item.scope === 'all'
                ? 'All Daine'
                : item.scope === 'daine_1'
                  ? 'Daine 1'
                  : 'Daine 2'}
            </span>
          )}
        </div>
      </div>

      {/* Header & Date */}
      <CardHeader className="pb-2 pt-4 px-5 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-primary/80 shrink-0" />
          <time dateTime={item.created_at}>
            {format(parseISO(item.created_at), 'MMMM d, yyyy')}
          </time>
        </div>
        <h2 className="text-lg font-black leading-snug tracking-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {item.title}
        </h2>
      </CardHeader>

      {/* Body preview */}
      <CardContent className="flex-1 pb-4 px-5">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {truncatedBody || 'Click below to read full advisory and details.'}
        </p>
      </CardContent>

      {/* Action Footer with Min 44px Trigger */}
      <CardFooter className="pt-3 pb-4 px-5 border-t border-border/60 bg-muted/20">
        <Button
          variant="outline"
          size="default"
          className="w-full justify-between text-[#002878] dark:text-[#93c5fd] hover:text-white dark:hover:text-white hover:bg-primary border-primary/40 hover:border-primary font-bold min-h-[44px] h-11 px-4 rounded-xl transition-all shadow-2xs group/btn cursor-pointer"
          asChild
        >
          <Link to={`/announcements/${item.id}` as any}>
            <span>Read Full Announcement</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function AnnouncementsRoute() {
  const announcements = Route.useLoaderData() ?? []
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { scope: activeBarangayScope, setScope } = useBarangayScope()

  const categories = ['All', 'Emergency', 'Advisory', 'Health', 'Infrastructure', 'Programs', 'General']

  // Find top emergency or weather alert
  const activeEmergencyAlert = useMemo(() => {
    return announcements.find((a: AnnouncementItem) => {
      const isEmergencyCat = a.category?.toLowerCase() === 'emergency'
      const hasAlertKeywords =
        a.title.toLowerCase().includes('bagyo') ||
        a.title.toLowerCase().includes('typhoon') ||
        a.title.toLowerCase().includes('warning') ||
        a.title.toLowerCase().includes('calamity') ||
        a.title.toLowerCase().includes('evacuation') ||
        a.title.toLowerCase().includes('emergency') ||
        a.title.toLowerCase().includes('disaster') ||
        a.title.toLowerCase().includes('alert')
      return (a.pinned || isEmergencyCat) && (isEmergencyCat || hasAlertKeywords)
    })
  }, [announcements])

  const filteredAnnouncements = useMemo(() => {
    let filtered = announcements

    // Filter by dual-barangay scope
    if (activeBarangayScope !== 'all') {
      const dbScope = activeBarangayScope === 'daine1' ? 'daine_1' : 'daine_2'
      filtered = filtered.filter((a: AnnouncementItem) => a.scope === 'both' || a.scope === 'all' || a.scope === dbScope)
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((a: AnnouncementItem) => a.category?.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a: AnnouncementItem) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [announcements, selectedCategory, activeBarangayScope, searchQuery])

  const pinned = filteredAnnouncements.filter((a: AnnouncementItem) => a.pinned)
  const regular = filteredAnnouncements.filter((a: AnnouncementItem) => !a.pinned)

  return (
    <div className="min-h-screen pb-20 bg-slate-50/50 dark:bg-background">
      {/* ── 1. Hero Civic Horizon Header ───────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#002675] via-[#0038A8] to-[#1E3A8A] text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        {/* National Flag Accent Ribbon */}
        <div
          className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]"
          aria-hidden="true"
        />

        {/* Ambient Glow */}
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
                <Megaphone className="h-3.5 w-3.5" />
                <span>Barangay Daine Civic Bulletin &bull; Public Information Desk</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Official Civic Bulletins
              </h1>
              <p className="text-blue-100 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed font-medium">
                Verified public notices, disaster advisories, community updates, and executive announcements from the Sangguniang Barangay of Daine 1 & Daine 2.
              </p>
            </div>

            {/* Emergency Hotline Quick Trigger */}
            <div className="shrink-0 flex items-center gap-3">
              <Button
                variant="destructive"
                size="default"
                className="bg-[#CE1126] hover:bg-[#a50e1e] text-white font-bold min-h-[44px] h-11 px-5 rounded-xl shadow-lg border border-red-400/40 flex items-center gap-2 cursor-pointer"
                asChild
              >
                <Link to="/emergency">
                  <PhoneCall className="h-4 w-4" />
                  <span>Emergency Desk</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. Pinned Weather / Disaster Emergency Alert Banner ─────────────────── */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl -mt-5 relative z-20">
        {activeEmergencyAlert ? (
          <div className="rounded-2xl border-2 border-red-500/80 bg-red-50 dark:bg-red-950/80 p-4 sm:p-5 text-red-950 dark:text-red-100 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in-50 duration-300">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 shadow-md ring-4 ring-red-500/20">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                    Active Emergency Advisory
                  </span>
                  <span className="text-xs font-bold text-red-800 dark:text-red-300 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-red-600" /> High Priority Alert
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-red-950 dark:text-red-50">
                  {activeEmergencyAlert.title}
                </h3>
                <p className="text-xs sm:text-sm text-red-900/90 dark:text-red-200/90 line-clamp-2 mt-0.5">
                  {activeEmergencyAlert.body}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                size="default"
                className="bg-red-600 hover:bg-red-700 text-white font-bold min-h-[44px] h-11 px-4 rounded-xl shadow-md border border-red-400 cursor-pointer"
                asChild
              >
                <Link to={`/announcements/${activeEmergencyAlert.id}` as any}>
                  <span>Read Emergency Protocol</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900/90 dark:to-blue-950/40 p-4 text-foreground shadow-md backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 shrink-0">
                <CloudRain className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                  Civic Weather & Calamity Watch: Normal Operations
                </p>
                <p className="text-xs text-muted-foreground">
                  No active typhoon or severe flood alerts in Indang, Cavite. Barangay emergency response units are on standby 24/7.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold min-h-[40px] h-10 px-3.5 rounded-xl border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                asChild
              >
                <Link to="/emergency">
                  <PhoneCall className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  View Calamity Directory
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Controls Bar: Dual-Barangay Scope Selector + Filters ─────────────── */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl mt-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-border">
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

          {/* Real-time Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[40px]"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 mr-1" />
          {categories.map(cat => {
            const isSelected = selectedCategory === cat
            return (
              <Button
                key={cat}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full min-h-[38px] px-4 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'shadow-md bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:border-primary/50'
                }`}
              >
                {cat}
              </Button>
            )
          })}
        </div>

        {/* ── 4. Civic Bulletin Grid ─────────────────────────────────────────── */}
        {filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-border rounded-3xl bg-card/50 p-6 mt-4">
            <div className="bg-primary/10 rounded-full p-6 text-primary ring-8 ring-primary/5">
              <Bell className="h-10 w-10" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-foreground">No matching announcements</h2>
              <p className="text-sm text-muted-foreground mt-1">
                No bulletins found for the selected scope or category filter. Try selecting "All" or clearing your search.
              </p>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setSelectedCategory('All')
                setSearchQuery('')
              }}
              className="min-h-[44px] h-11 px-5 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-10 mt-6">
            {/* Pinned Bulletins */}
            {pinned.length > 0 && (
              <section aria-labelledby="pinned-notices-heading">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1 rounded-md bg-[#FCD116] text-slate-950">
                    <Pin className="h-4 w-4 fill-slate-950" />
                  </div>
                  <h2
                    id="pinned-notices-heading"
                    className="text-sm font-black uppercase tracking-wider text-amber-700 dark:text-amber-400"
                  >
                    Pinned Civic Notices ({pinned.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pinned.map(item => (
                    <AnnouncementCard key={item.id} item={item} highlighted />
                  ))}
                </div>
              </section>
            )}

            {/* Regular Bulletins */}
            {regular.length > 0 && (
              <section aria-labelledby="regular-notices-heading">
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h2
                      id="regular-notices-heading"
                      className="text-sm font-black uppercase tracking-wider text-muted-foreground"
                    >
                      All Bulletins ({regular.length})
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Sorted by most recent
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regular.map(item => (
                    <AnnouncementCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
