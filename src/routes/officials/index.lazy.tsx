import { createLazyFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Search, Phone, Shield, Users, Network, LayoutGrid, Award, Calendar, X, RotateCcw, UserCheck } from 'lucide-react'
import { useState } from 'react'

import { Route as OfficialsRoute, type Official } from './index'

export const Route = createLazyFileRoute('/officials/')({
  component: OfficialsDirectoryRoute,
})

const POSITION_COLORS: Record<string, string> = {
  'Punong Barangay': 'bg-blue-600 text-white font-bold border-blue-700 shadow-sm',
  'Barangay Kagawad': 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 font-semibold',
  'SK Chairperson': 'bg-purple-100 text-purple-950 dark:bg-purple-950/60 dark:text-purple-200 border-purple-300 font-semibold',
  'Barangay Secretary': 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 font-semibold',
  'Barangay Treasurer': 'bg-teal-100 text-teal-950 dark:bg-teal-950/60 dark:text-teal-200 border-teal-300 font-semibold',
  'Chief Tanod': 'bg-rose-100 text-rose-950 dark:bg-rose-950/60 dark:text-rose-200 border-rose-300 font-semibold',
}

function getInitials(name: string) {
  return name
    .replace(/^Hon\.\s+|^Ms\.\s+|^Mr\.\s+/, '')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function OfficialCard({ official, variant = 'grid' }: { official: Official; variant?: 'captain' | 'kagawad' | 'officer' | 'grid' }) {
  const isCaptain = official.position === 'Punong Barangay' || variant === 'captain'
  const initials = getInitials(official.name)
  const positionBadgeClass = POSITION_COLORS[official.position] ?? 'bg-muted text-muted-foreground'

  if (variant === 'captain') {
    return (
      <Card className="border-2 border-primary/40 shadow-lg bg-gradient-to-b from-card to-primary/5 relative overflow-hidden text-center max-w-xl mx-auto">
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-[#0038A8] via-[#CE1126] to-[#FCD116]" />
        <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center">
          <div className="relative mb-4">
            <Avatar className="h-28 w-28 border-4 border-background shadow-md">
              {official.photo_url && <AvatarImage src={official.photo_url} alt={official.name} className="object-cover" />}
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-1 bg-[#FCD116] text-[#0038A8] p-1.5 rounded-full shadow-md border-2 border-background">
              <Award className="h-5 w-5" />
            </div>
          </div>

          <Badge className="mb-2 bg-[#0038A8] hover:bg-[#0038A8]/90 text-white text-xs px-3 py-1 uppercase tracking-wider font-bold shadow-sm">
            {official.position}
          </Badge>

          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{official.name}</h3>
          
          {official.committee && (
            <p className="text-sm font-medium text-primary mt-1 flex items-center justify-center gap-1.5">
              <Shield className="h-4 w-4 shrink-0" />
              {official.committee}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs text-muted-foreground pt-3 border-t border-border/60 w-full">
            <span className="inline-flex items-center gap-1 bg-background px-2.5 py-1 rounded-full border">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Term: {official.term}
            </span>
            {official.contact_number && (
              <a
                href={`tel:${official.contact_number}`}
                className="inline-flex items-center gap-1 bg-background px-2.5 py-1 rounded-full border hover:text-primary transition-colors font-medium min-h-[32px]"
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                {official.contact_number}
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full border hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-border shrink-0">
          {official.photo_url && <AvatarImage src={official.photo_url} alt={official.name} className="object-cover" />}
          <AvatarFallback className="text-base font-semibold bg-muted text-foreground">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Badge variant="outline" className={`text-[11px] px-2 py-0.5 mb-1 truncate max-w-full ${positionBadgeClass}`}>
            {official.position}
          </Badge>
          <CardTitle className="text-base font-bold truncate leading-snug">{official.name}</CardTitle>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{official.term}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0 space-y-3 flex-1 flex flex-col justify-between">
        {official.committee ? (
          <div className="text-xs bg-muted/50 p-2.5 rounded-lg border border-border/50">
            <span className="text-muted-foreground font-medium block text-[11px] uppercase tracking-wider mb-0.5">Committee / Role</span>
            <span className="font-semibold text-foreground">{official.committee}</span>
          </div>
        ) : (
          <div />
        )}

        {official.contact_number && (
          <div className="pt-2 border-t border-border/40">
            <a
              href={`tel:${official.contact_number}`}
              className="text-xs text-primary hover:underline flex items-center gap-1.5 font-medium min-h-[36px]"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{official.contact_number}</span>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OfficialsDirectoryRoute() {
  const officials = OfficialsRoute.useLoaderData()
  const [search, setSearch] = useState('')
  const [activeCommittee, setActiveCommittee] = useState<string>('All')

  // Org Chart Categorization
  const captain = officials.find((o) => o.position === 'Punong Barangay') || officials[0]
  const kagawads = officials.filter((o) => o.position === 'Barangay Kagawad')
  const officers = officials.filter((o) => o.position !== 'Punong Barangay' && o.position !== 'Barangay Kagawad')

  // Extract unique committees for filter
  const committees = ['All', ...Array.from(new Set(officials.map((o) => o.committee).filter(Boolean))) as string[]]

  const filteredOfficials = officials.filter((o) => {
    const matchesSearch =
      (o.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.position || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.committee || '').toLowerCase().includes(search.toLowerCase())
    const matchesCommittee =
      activeCommittee === 'All' || o.committee === activeCommittee
    return matchesSearch && matchesCommittee
  })

  function handleReset() {
    setSearch('')
    setActiveCommittee('All')
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-6xl">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-[#0038A8] to-slate-900 text-white p-8 md:p-10 mb-10 overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-[#FCD116] border border-white/20 mb-4">
            <Users className="h-3.5 w-3.5" />
            <span>Barangay Daine, Indang, Cavite</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-3 text-white">
            Barangay Officials & Governance Directory
          </h1>
          <p className="text-slate-200 text-sm md:text-base leading-relaxed">
            Meet the dedicated public servants of Barangay Daine. Explore our organizational structure, committee assignments, and contact information for transparent public governance.
          </p>
        </div>
      </div>

      {/* Tabs View Selector */}
      <Tabs defaultValue="org-chart" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Directory View</h2>
            <p className="text-xs text-muted-foreground">Switch between organizational chart and searchable grid</p>
          </div>
          <TabsList className="grid grid-cols-2 w-full sm:w-[320px]">
            <TabsTrigger value="org-chart" className="flex items-center gap-2 font-medium">
              <Network className="h-4 w-4" />
              <span>Org Chart</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex items-center gap-2 font-medium">
              <LayoutGrid className="h-4 w-4" />
              <span>Grid View</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ORGANIZATIONAL CHART VIEW */}
        <TabsContent value="org-chart" className="space-y-12">
          {captain && (
            <section className="space-y-4">
              <div className="text-center">
                <Badge variant="outline" className="text-xs font-bold uppercase tracking-widest text-primary border-primary/30 px-3 py-1">
                  Executive Leadership
                </Badge>
              </div>
              <OfficialCard official={captain} variant="captain" />
            </section>
          )}

          {/* Tree Line Connector */}
          <div className="relative flex justify-center items-center py-2">
            <div className="w-0.5 h-10 bg-border border-l-2 border-dashed border-primary/40" />
          </div>

          {/* Kagawads Level */}
          <section className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-center">
              <UserCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold tracking-tight">Barangay Council (Kagawads)</h3>
            </div>
            {kagawads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {kagawads.map((kagawad) => (
                  <OfficialCard key={kagawad.id} official={kagawad} variant="kagawad" />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">No Kagawads recorded.</p>
            )}
          </section>

          {/* Tree Line Connector */}
          <div className="relative flex justify-center items-center py-2">
            <div className="w-0.5 h-10 bg-border border-l-2 border-dashed border-primary/40" />
          </div>

          {/* Officers Level */}
          <section className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-center">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold tracking-tight">Appointed & Sectoral Officials</h3>
            </div>
            {officers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {officers.map((officer) => (
                  <OfficialCard key={officer.id} official={officer} variant="officer" />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">No appointed officers recorded.</p>
            )}
          </section>
        </TabsContent>

        {/* GRID VIEW */}
        <TabsContent value="grid" className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search official by name, position, committee..."
                className="pl-10 pr-10 h-11 text-sm rounded-xl"
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

            {/* Committee Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {committees.map((comm) => (
                <button
                  key={comm}
                  onClick={() => setActiveCommittee(comm)}
                  className={`shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 flex items-center justify-center ${
                    activeCommittee === comm
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                      : 'bg-background text-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {comm}
                </button>
              ))}
            </div>

            {/* Count indicator */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs font-medium text-muted-foreground">
                Showing {filteredOfficials.length} of {officials.length} officials
              </p>
              {(search || activeCommittee !== 'All') && (
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 min-h-[36px] px-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOfficials.map((official) => (
              <OfficialCard key={official.id} official={official} variant="grid" />
            ))}

            {filteredOfficials.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="p-3 bg-muted rounded-full">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">No officials found</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-0.5">
                    No official matches your current search or committee filter.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 min-h-[40px]">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
