import { useState, useMemo } from 'react'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Store,
  Megaphone,
  Calendar,
  FileText,
  PlusCircle,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Activity,
  Users,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'

import { Route as AdminRoute } from './index'

export const Route = createLazyFileRoute('/_authenticated/admin/')({
  component: AdminDashboardRoute,
})

// Status colors aligned with Civic Horizon tokens
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  pending: {
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
    hex: '#f59e0b',
  },
  in_review: {
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
    hex: '#3b82f6',
  },
  ready: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30',
    hex: '#6366f1',
  },
  completed: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    hex: '#10b981',
  },
  rejected: {
    bg: 'bg-red-500/10 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-500/30',
    hex: '#ef4444',
  },
}

// Chart color palette
const RESOLUTION_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1']
const MSME_SECTOR_COLORS = ['#0038A8', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Civic Analytics Datasets
const MONTHLY_REQUESTS_DATA = [
  { month: 'Mar', clearances: 45, certifications: 32, permits: 12, total: 89 },
  { month: 'Apr', clearances: 52, certifications: 38, permits: 18, total: 108 },
  { month: 'May', clearances: 61, certifications: 44, permits: 22, total: 127 },
  { month: 'Jun', clearances: 74, certifications: 50, permits: 29, total: 153 },
  { month: 'Jul', clearances: 88, certifications: 62, permits: 35, total: 185 },
  { month: 'Aug', clearances: 104, certifications: 71, permits: 42, total: 217 },
]

const TURNAROUND_TIME_DATA = [
  { week: 'Wk 1', hours: 6.8, benchmark: 4.0 },
  { week: 'Wk 2', hours: 5.4, benchmark: 4.0 },
  { week: 'Wk 3', hours: 4.2, benchmark: 4.0 },
  { week: 'Wk 4', hours: 3.5, benchmark: 4.0 },
  { week: 'Wk 5', hours: 2.8, benchmark: 4.0 },
  { week: 'Wk 6', hours: 2.1, benchmark: 4.0 },
]

const BLOTTER_RESOLUTION_DATA = [
  { name: 'Resolved & Settled', value: 78, cases: 31 },
  { name: 'Active Mediation', value: 14, cases: 6 },
  { name: 'Investigation', value: 5, cases: 2 },
  { name: 'Referred to PNP', value: 3, cases: 1 },
]

const MSME_GROWTH_DATA = [
  { category: 'Retail & Sari-Sari', count: 48, growth: '+15%' },
  { category: 'Food & Agri-Produce', count: 32, growth: '+22%' },
  { category: 'Services & Trades', count: 24, growth: '+18%' },
  { category: 'Crafts & Production', count: 14, growth: '+8%' },
  { category: 'Transport & Delivery', count: 12, growth: '+12%' },
]

function AdminDashboardRoute() {
  const { stats, docRequestsByStatus, recentActivity } = AdminRoute.useLoaderData()
  const [activeActivityTab, setActiveActivityTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Total pending triage count
  const totalPendingActionItems =
    (stats.pendingDocRequests || 0) +
    (stats.pendingComplaints || 0) +
    (stats.pendingBusinesses || 0)

  // Filtered recent activity
  const filteredActivity = useMemo(() => {
    return recentActivity.filter((act: any) => {
      const matchesTab = activeActivityTab === 'all' || act.status === activeActivityTab
      const residentName = act.profiles?.full_name?.toLowerCase() || ''
      const docType = act.document_type?.toLowerCase() || ''
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query || residentName.includes(query) || docType.includes(query)
      return matchesTab && matchesSearch
    })
  }, [recentActivity, activeActivityTab, searchQuery])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── 1. Stitch Civic Horizon Executive Banner ──────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8 shadow-sm">
        {/* Flag Tricolor Accent Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          <div className="w-[45%] bg-[#0038A8]" />
          <div className="w-[10%] bg-[#FCD116]" />
          <div className="w-[45%] bg-[#CE1126]" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pt-1">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Executive Civic Analytics Deck • Barangay Daine
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Municipal Governance Operations
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Real-time monitoring of civic clearance turnaround, blotter case mediation rates, MSME enterprise registry growth, and citizen service requests.
            </p>
          </div>

          {/* Quick Header CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              asChild
              variant="outline"
              className="min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-bold border-border/80 hover:bg-muted cursor-pointer"
            >
              <Link to="/admin/complaints">
                <ShieldAlert className="mr-2 h-4 w-4 text-red-600" />
                Blotter Queue ({stats.pendingComplaints})
              </Link>
            </Button>
            <Button
              asChild
              className="min-h-[44px] px-5 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
            >
              <Link to="/admin/documents">
                <FileText className="mr-2 h-4 w-4" />
                Process Documents ({stats.pendingDocRequests})
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Urgent Attention Alert Box (if backlog exists) ────────────────── */}
      {totalPendingActionItems > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 animate-pulse">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                    Action Required: {totalPendingActionItems} Items Pending Triage
                  </h3>
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 text-[10px] font-extrabold uppercase">
                    Urgent Queue
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {stats.pendingDocRequests} clearance requests, {stats.pendingComplaints} blotter incident reports, and {stats.pendingBusinesses} business permits require staff review.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {stats.pendingDocRequests > 0 && (
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold bg-card hover:bg-card/80 border border-border shadow-xs cursor-pointer"
                >
                  <Link to="/admin/documents">
                    Triage Documents ({stats.pendingDocRequests})
                  </Link>
                </Button>
              )}
              {stats.pendingComplaints > 0 && (
                <Button
                  asChild
                  size="sm"
                  variant="destructive"
                  className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Link to="/admin/complaints">
                    Review Blotter ({stats.pendingComplaints})
                  </Link>
                </Button>
              )}
              {stats.pendingBusinesses > 0 && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold bg-card border-border shadow-xs cursor-pointer"
                >
                  <Link to="/admin/businesses">
                    Verify MSME ({stats.pendingBusinesses})
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. High-Contrast Stat Cards Deck ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: MSME Businesses */}
        <Card className="border-border/80 hover:border-primary/50 transition-all shadow-xs group bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              MSME Businesses
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Store className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.totalBusinesses}
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold gap-1">
                <TrendingUp className="h-3 w-3" />
                +14.2%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-muted-foreground font-medium">Pending Permit:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {stats.pendingBusinesses} awaiting
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Document Requests */}
        <Card className="border-border/80 hover:border-primary/50 transition-all shadow-xs group bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Doc Requests
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.totalDocRequests}
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold gap-1">
                <TrendingUp className="h-3 w-3" />
                +8.5%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-muted-foreground font-medium">Triage Queue:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {stats.pendingDocRequests} pending
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Blotter Cases */}
        <Card className="border-border/80 hover:border-primary/50 transition-all shadow-xs group bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Blotter & Peace
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.totalComplaints}
              </div>
              <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[11px] font-bold gap-1">
                <TrendingDown className="h-3 w-3" />
                -5.1%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-muted-foreground font-medium">In Mediation:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {stats.pendingComplaints} unreviewed
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Announcements */}
        <Card className="border-border/80 hover:border-primary/50 transition-all shadow-xs group bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Civic Advisories
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Megaphone className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.totalAnnouncements}
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold gap-1">
                <TrendingUp className="h-3 w-3" />
                +20.0%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-muted-foreground font-medium">Broadcast Reach:</span>
              <span className="font-bold text-foreground">100% Public</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Events */}
        <Card className="border-border/80 hover:border-primary/50 transition-all shadow-xs group bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Community Events
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.totalEvents}
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold gap-1">
                <TrendingUp className="h-3 w-3" />
                +12.5%
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-muted-foreground font-medium">Assembly Status:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">Scheduled</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Civic Analytics Deck: 4 Visual Recharts Panels ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Monthly Document Volume & Trajectory */}
        <Card className="border-border/80 shadow-xs flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Monthly Requests Velocity
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Clearance, certification & permit issuances over the past 6 months
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                +144% Growth
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-2 pb-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_REQUESTS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClearances" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0038A8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0038A8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCertificates" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#888888" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#888888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clearances"
                    name="Clearances"
                    stroke="#0038A8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorClearances)"
                  />
                  <Area
                    type="monotone"
                    dataKey="certifications"
                    name="Certifications"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCertificates)"
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Panel 2: Clearance Turnaround Time Benchmark */}
        <Card className="border-border/80 shadow-xs flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Clearance Turnaround Velocity
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Average resident wait time in hours vs. municipal 4.0h benchmark
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                2.1h Avg Time
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-2 pb-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TURNAROUND_TIME_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#888888" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#888888" unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} hours`, 'Turnaround']}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    name="Actual Processing (Hours)"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    name="LGU Target Benchmark"
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Panel 3: Blotter & Incident Mediation Resolution Rate */}
        <Card className="border-border/80 shadow-xs flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Blotter Resolution Breakdown
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Lupong Tagapamayapa amicable settlement & mediation outcomes
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                78% Amicable
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-2 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={BLOTTER_RESOLUTION_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {BLOTTER_RESOLUTION_DATA.map((entry, index) => (
                        <Cell key={`blotter-${index}`} fill={RESOLUTION_COLORS[index % RESOLUTION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val}% of cases`, name]}
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        borderColor: 'var(--color-border)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs">
                {BLOTTER_RESOLUTION_DATA.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: RESOLUTION_COLORS[idx % RESOLUTION_COLORS.length] }}
                      />
                      <span className="font-semibold text-foreground truncate max-w-[130px]">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold text-foreground">{item.value}%</span>
                      <span className="text-muted-foreground text-[11px]">({item.cases})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel 4: MSME Economic Registry Growth by Category */}
        <Card className="border-border/80 shadow-xs flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  MSME Enterprise Distribution
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Registered micro & small enterprises by primary industry
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                130 Active MSMEs
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-2 pb-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MSME_GROWTH_DATA}
                  layout="vertical"
                  margin={{ top: 5, right: 25, left: 45, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#888888" />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tick={{ fontSize: 11 }}
                    stroke="#888888"
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} Businesses (${item.payload.growth} YoY)`,
                      'Registered',
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {MSME_GROWTH_DATA.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={MSME_SECTOR_COLORS[index % MSME_SECTOR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 5. Quick-Action Triage Control Panel ────────────────────────────── */}
      <Card className="border-border/80 shadow-xs bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Operational Quick-Action Triage
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Immediate workflows for barangay clerks, councilors, and executive administrators
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Action 1: Document Triage */}
            <Button
              asChild
              variant="outline"
              className="justify-start min-h-[50px] p-3 rounded-xl border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group cursor-pointer"
            >
              <Link to="/admin/documents">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mr-3 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">
                    Document Triage Queue
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {stats.pendingDocRequests} pending resident requests
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>

            {/* Action 2: Blotter Mediation */}
            <Button
              asChild
              variant="outline"
              className="justify-start min-h-[50px] p-3 rounded-xl border-border/80 hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left group cursor-pointer"
            >
              <Link to="/admin/complaints">
                <div className="h-9 w-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center mr-3 shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">
                    Blotter Incident Desk
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {stats.pendingComplaints} unreviewed peace reports
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>

            {/* Action 3: Business Permits */}
            <Button
              asChild
              variant="outline"
              className="justify-start min-h-[50px] p-3 rounded-xl border-border/80 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group cursor-pointer"
            >
              <Link to="/admin/businesses">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mr-3 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">
                    MSME Accreditation
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {stats.pendingBusinesses} merchant permits pending
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>

            {/* Action 4: Broadcast Advisory */}
            <Button
              asChild
              variant="outline"
              className="justify-start min-h-[50px] p-3 rounded-xl border-border/80 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group cursor-pointer"
            >
              <Link to="/admin/announcements">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mr-3 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">
                    Post Civic Advisory
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Broadcast public community notices
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>

            {/* Action 5: Community Assembly */}
            <Button
              asChild
              variant="outline"
              className="justify-start min-h-[50px] p-3 rounded-xl border-border/80 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group cursor-pointer"
            >
              <Link to="/admin/events">
                <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center mr-3 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">
                    Schedule Assembly & Events
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Medical missions, meetings & fiestas
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>

            {/* Action 6: Emergency Dispatch */}
            <Button
              asChild
              variant="outline"
              className="justify-start min-h-[50px] p-3 rounded-xl border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group cursor-pointer"
            >
              <Link to="/admin/emergency">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mr-3 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">
                    Emergency Dispatch Hotlines
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Tanod patrol & quick response unit
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Live Activity Stream & Document Request Triage Table ──────────── */}
      <Card className="border-border/80 shadow-xs bg-card">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Live Civic Document Requests Stream
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Real-time queue of incoming citizen certificates, clearances, and residency filings
              </CardDescription>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search resident or doc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-muted/50 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3 text-primary" />
              Filter:
            </span>
            {['all', 'pending', 'in_review', 'ready', 'completed'].map((tab) => {
              const count =
                tab === 'all'
                  ? recentActivity.length
                  : recentActivity.filter((r: any) => r.status === tab).length
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveActivityTab(tab)}
                  className={`min-h-[38px] px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeActivityTab === tab
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span>{tab === 'all' ? 'All Requests' : formatStatus(tab)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      activeActivityTab === tab
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-background text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {filteredActivity.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No requests matching selected filter.
                </p>
                <p className="text-xs text-muted-foreground">
                  Check other filter categories or clear your search term.
                </p>
              </div>
            ) : (
              filteredActivity.map((activity: any) => {
                const statusStyle = STATUS_COLORS[activity.status] || {
                  bg: 'bg-muted',
                  text: 'text-muted-foreground',
                  border: 'border-border',
                  hex: '#9ca3af',
                }

                return (
                  <div
                    key={activity.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 sm:mt-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-bold text-foreground truncate">
                          {activity.profiles?.full_name || 'Resident Applicant'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-medium text-foreground/80">
                            {formatStatus(activity.document_type || 'barangay_clearance')}
                          </span>
                          <span>•</span>
                          <span>{format(new Date(activity.created_at), 'MMM d, yyyy • h:mm a')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold px-2.5 py-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {formatStatus(activity.status)}
                      </Badge>

                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="min-h-[44px] px-3 rounded-xl text-xs font-bold hover:bg-primary hover:text-primary-foreground border-border transition-colors cursor-pointer"
                      >
                        <Link to="/admin/documents">
                          Triage
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
