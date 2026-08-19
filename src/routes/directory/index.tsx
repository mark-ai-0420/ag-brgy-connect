import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { Search, MapPin, Phone, Clock, Store, X, RotateCcw } from 'lucide-react'
import React, { useState, useMemo } from 'react'
import { FeedSkeleton } from '#/components/common/FeedSkeleton'

const getBusinesses = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, category, address, phone, hours, photo_url, menu_image_url, misc_image_url, description, map_url')
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
  component: DirectoryRoute,
  loader: () => getBusinesses(),
  pendingComponent: () => <FeedSkeleton />,
})

const CATEGORIES = [
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

type Category = (typeof CATEGORIES)[number]

const CATEGORY_COLORS: Record<string, string> = {
  'Sari-Sari Store': 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 font-semibold',
  'Eatery / Carenderia': 'bg-orange-100 text-orange-950 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-300 font-semibold',
  'Water Station': 'bg-blue-100 text-blue-950 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300 font-semibold',
  Laundry: 'bg-sky-100 text-sky-950 dark:bg-sky-900/50 dark:text-sky-200 border border-sky-300 font-semibold',
  Salon: 'bg-pink-100 text-pink-950 dark:bg-pink-900/50 dark:text-pink-200 border border-pink-300 font-semibold',
  'Repair Shop': 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 font-semibold',
  Clinic: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 font-semibold',
  Pharmacy: 'bg-teal-100 text-teal-950 dark:bg-teal-900/50 dark:text-teal-200 border border-teal-300 font-semibold',
  Tailoring: 'bg-purple-100 text-purple-950 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-300 font-semibold',
  Others: 'bg-gray-100 text-gray-950 dark:bg-slate-800 dark:text-slate-200 border border-gray-300 font-semibold',
}

function DirectoryRoute() {
  const MOCK_BUSINESSES = Route.useLoaderData()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('All')

  const filtered = React.useMemo(() => {
    return MOCK_BUSINESSES.filter((b: any) => {
      const matchesSearch =
        (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.address || '').toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        activeCategory === 'All' || b.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [MOCK_BUSINESSES, search, activeCategory])

  function handleReset() {
    setSearch('')
    setActiveCategory('All')
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Business Directory
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-0.5">
              Discover and support local establishments and services in Barangay Daine.
            </p>
          </div>
        </div>
        <Button asChild className="min-h-[44px] px-5 font-semibold shrink-0 gap-2">
          <Link to="/businesses/new">
            <Store className="h-4 w-4" /> Register Business
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id="directory-search"
          placeholder="Search by name, category, or address…"
          className="pl-10 pr-10 h-12 text-sm rounded-xl bg-card shadow-2xs"
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

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            id={`category-filter-${cat.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => setActiveCategory(cat as Category)}
            className={`shrink-0 min-h-[40px] px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 flex items-center justify-center ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                : 'bg-background text-slate-700 dark:text-slate-200 border-border hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-medium text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'business' : 'businesses'} found
        </p>
        {(search || activeCategory !== 'All') && (
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 min-h-[44px] px-2"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((business: any) => {
          const badgeClass =
            CATEGORY_COLORS[business.category as string] ??
            'bg-gray-100 text-gray-700 border-gray-200'
          return (
            <Link
              key={business.id}
              to="/directory/$businessId"
              params={{ businessId: business.id }}
              className="block group"
            >
              <Card className="h-full flex flex-col border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5 overflow-hidden bg-card">
                {/* Hero / Banner with hover zoom */}
                <div className="relative w-full h-44 overflow-hidden bg-muted/60">
                  {business.photo_url ? (
                    <img
                      src={business.photo_url}
                      alt={business.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 text-primary/40 group-hover:text-primary/60 transition-colors">
                      <div className="p-3 rounded-full bg-background/70 shadow-xs backdrop-blur-xs">
                        <Store className="h-6 w-6 text-primary/70" />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground/70 mt-2 tracking-wide uppercase">
                        Barangay Business
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 pointer-events-none">
                    <span
                      className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md ${badgeClass}`}
                    >
                      {business.category}
                    </span>
                  </div>
                </div>

                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-1">
                    {business.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground pb-4">
                  {business.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                      <span className="line-clamp-2 text-xs sm:text-sm">{business.address}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <span className="text-xs sm:text-sm">{business.phone}</span>
                    </div>
                  )}
                  {business.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <span className="text-xs sm:text-sm">{business.hours}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed rounded-2xl">
            <div className="p-4 bg-muted rounded-full">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">No businesses found</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                We couldn't find any results matching your search or category filter.
              </p>
            </div>
            <Button variant="outline" onClick={handleReset} className="min-h-[44px] gap-2 font-semibold">
              <RotateCcw className="h-4 w-4" /> Clear Search & Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
