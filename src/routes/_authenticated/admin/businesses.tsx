import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useState } from 'react'
import { PageHeader } from '#/components/common/PageHeader'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Badge } from '#/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import {
  Store,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Building2,
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  Eye,
  Search,
  Check,
  X,
  AlertTriangle,
  Copy,
  Layers,
  Sparkles,
  ShoppingBag,
  Utensils,
  Droplet,
  Shirt,
  Scissors,
  Wrench,
  Stethoscope,
  Pill,
  HelpCircle,
  Archive,
  Maximize2
} from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { format } from 'date-fns'

const getBusinesses = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role, barangay')
    .eq('user_id', user.id)
    .maybeSingle()

  const adminScope = roleData?.barangay ?? 'both'

  let query = supabase
    .from('businesses')
    .select('id, name, category, description, address, phone, hours, owner_id, status, notes, photo_url, menu_image_url, misc_image_url, barangay, purok, messenger_link, facebook_url, latitude, longitude, payment_methods, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (adminScope !== 'both') {
    query = query.eq('barangay', adminScope)
  }

  const { data: businesses, error } = await query
  if (error) {
    console.error('Error fetching businesses:', error)
    return { businesses: [], adminScope }
  }

  return { businesses: businesses ?? [], adminScope }
})

const updateBusinessStatus = createServerFn({ method: 'POST' })
  .validator(
    (data: unknown) =>
      z
        .object({
          id: z.string(),
          status: z.enum(['pending', 'approved', 'rejected', 'archived']),
          notes: z.string().optional(),
        })
        .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const updateData: { status: string; updated_at: string; notes?: string } = {
      status: data.status,
      updated_at: new Date().toISOString(),
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }
    const { error } = await supabase.from('businesses').update(updateData).eq('id', data.id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/businesses')({
  component: AdminBusinessesRoute,
  loader: () => getBusinesses(),
})

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  'Sari-Sari Store': { icon: Store, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800' },
  'Eatery / Carenderia': { icon: Utensils, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' },
  'Water Station': { icon: Droplet, color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-800' },
  'Laundry': { icon: Shirt, color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800' },
  'Salon': { icon: Scissors, color: 'text-pink-700 dark:text-pink-300', bg: 'bg-pink-50 dark:bg-pink-950/40', border: 'border-pink-200 dark:border-pink-800' },
  'Repair Shop': { icon: Wrench, color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800' },
  'Clinic': { icon: Stethoscope, color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800' },
  'Pharmacy': { icon: Pill, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
  'Tailoring': { icon: ShoppingBag, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800' },
  'Others': { icon: HelpCircle, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
}

const COMMON_REJECTION_REASONS = [
  'Storefront photo is unclear or not of an actual physical location.',
  'Purok / Barangay address does not match local jurisdiction.',
  'Incomplete contact information or unverified business operator.',
  'Duplicate merchant entry or unauthorized representation.',
  'Invalid business category or prohibited goods/services.',
]

type BusinessItem = Awaited<ReturnType<typeof getBusinesses>>['businesses'][number]

function AdminBusinessesRoute() {
  const { businesses, adminScope } = Route.useLoaderData()
  const router = useRouter()

  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [barangayFilter, setBarangayFilter] = useState<'all' | 'daine_1' | 'daine_2'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modals state
  const [selectedPhotoBiz, setSelectedPhotoBiz] = useState<BusinessItem | null>(null)
  const [activePhotoTab, setActivePhotoTab] = useState<'photo' | 'menu' | 'misc'>('photo')
  const [detailBiz, setDetailBiz] = useState<BusinessItem | null>(null)
  const [actionTarget, setActionTarget] = useState<{ biz: BusinessItem; type: 'reject' | 'archive' } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  // Filtering
  const filtered = businesses.filter((b: BusinessItem) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      b.name?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q) ||
      b.purok?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q) ||
      b.owner_id?.toLowerCase().includes(q)

    const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter
    const matchesBarangay = barangayFilter === 'all' ? true : b.barangay === barangayFilter
    const matchesCategory = categoryFilter === 'all' ? true : b.category === categoryFilter

    return matchesSearch && matchesStatus && matchesBarangay && matchesCategory
  })

  // Counters
  const pendingCount = businesses.filter((b: BusinessItem) => b.status === 'pending').length
  const approvedCount = businesses.filter((b: BusinessItem) => b.status === 'approved').length
  const rejectedCount = businesses.filter((b: BusinessItem) => b.status === 'rejected').length
  const archivedCount = businesses.filter((b: BusinessItem) => b.status === 'archived').length

  // Quick 1-click Approve
  async function handleQuickApprove(biz: BusinessItem) {
    try {
      await updateBusinessStatus({ data: { id: biz.id, status: 'approved' } })
      toast.success(`"${biz.name}" approved successfully!`)
      router.invalidate()
    } catch {
      toast.error('Failed to approve business')
    }
  }

  // Submit Reject / Archive with reason
  async function handleConfirmAction() {
    if (!actionTarget) return
    setIsSubmittingAction(true)
    try {
      await updateBusinessStatus({
        data: {
          id: actionTarget.biz.id,
          status: actionTarget.type === 'reject' ? 'rejected' : 'archived',
          notes: rejectionReason.trim() || undefined,
        },
      })
      toast.success(
        actionTarget.type === 'reject'
          ? `Listing rejected: "${actionTarget.biz.name}"`
          : `Listing archived: "${actionTarget.biz.name}"`
      )
      setActionTarget(null)
      setRejectionReason('')
      if (detailBiz?.id === actionTarget.biz.id) {
        setDetailBiz(null)
      }
      if (selectedPhotoBiz?.id === actionTarget.biz.id) {
        setSelectedPhotoBiz(null)
      }
      router.invalidate()
    } catch {
      toast.error(`Failed to ${actionTarget.type} business`)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  function copyCoordinates(lat: number, lng: number) {
    navigator.clipboard.writeText(`${lat}, ${lng}`)
    toast.success('GPS coordinates copied to clipboard!')
  }

  const categoriesList = Array.from(new Set(businesses.map((b: BusinessItem) => b.category))).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Civic Horizon Header */}
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            MSME Economic Registry & Verification
          </span>
        }
        title="MSME Merchant Approval Queue"
        description="Verify local merchant credentials, examine storefront & menu proof photos, inspect GPS Purok coordinates, and moderate business directory listings."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/directory"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors min-h-[44px]"
            >
              <Store className="h-4 w-4 text-primary" />
              Public Directory
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        }
      />

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Review</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approved MSMEs</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{approvedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-red-50/20 dark:bg-red-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rejected</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">{rejectedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-500 bg-slate-50/20 dark:bg-slate-900/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Listings</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{businesses.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <Card className="p-4 space-y-3 shadow-sm">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b pb-3">
          {[
            { key: 'all', label: 'All Listings', count: businesses.length },
            { key: 'pending', label: 'Pending Approval', count: pendingCount, highlight: true },
            { key: 'approved', label: 'Approved', count: approvedCount },
            { key: 'rejected', label: 'Rejected', count: rejectedCount },
            { key: 'archived', label: 'Archived', count: archivedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                statusFilter === tab.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.key
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : tab.highlight && tab.count > 0
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                      : 'bg-background text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Scope & Category Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by merchant name, purok, owner ID, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 min-h-[44px] text-sm"
            />
          </div>

          <div className="sm:col-span-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="min-h-[44px] text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="min-h-[40px]">All Categories</SelectItem>
                {categoriesList.map((cat) => (
                  <SelectItem key={cat} value={cat} className="min-h-[40px]">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {adminScope === 'both' && (
            <div className="sm:col-span-3">
              <Select value={barangayFilter} onValueChange={(val: any) => setBarangayFilter(val)}>
                <SelectTrigger className="min-h-[44px] text-sm">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="min-h-[40px]">All Barangay Units</SelectItem>
                  <SelectItem value="daine_1" className="min-h-[40px]">Barangay Daine 1</SelectItem>
                  <SelectItem value="daine_2" className="min-h-[40px]">Barangay Daine 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Main Merchant Table */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="py-4 px-5 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              MSME Registry ({filtered.length} listings)
            </CardTitle>
            {statusFilter !== 'all' && (
              <Badge variant="outline" className="capitalize text-xs font-semibold">
                Filtering: {statusFilter}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[280px]">Business & Storefront</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>GPS & Purok Verification</TableHead>
                  <TableHead>Photos & Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[240px]">Actions (1-Click)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Store className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="font-semibold text-foreground">No business listings match your criteria.</p>
                      <p className="text-xs text-muted-foreground mt-1">Try changing filters or clearing your search term.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((biz: BusinessItem) => {
                    const isDaine2 = biz.barangay === 'daine_2'
                    const catStyle = CATEGORY_CONFIG[biz.category] ?? CATEGORY_CONFIG['Others']
                    const CatIcon = catStyle.icon
                    const hasPhotos = Boolean(biz.photo_url || biz.menu_image_url || biz.misc_image_url)
                    const photoCount = [biz.photo_url, biz.menu_image_url, biz.misc_image_url].filter(Boolean).length
                    const hasGps = Boolean(biz.latitude && biz.longitude)

                    return (
                      <TableRow key={biz.id} className="hover:bg-muted/30 transition-colors">
                        {/* Business details */}
                        <TableCell className="align-top py-3.5">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPhotoBiz(biz)
                                setActivePhotoTab(biz.photo_url ? 'photo' : biz.menu_image_url ? 'menu' : 'misc')
                              }}
                              className="group relative w-12 h-12 rounded-xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
                              title="Click to review photos"
                            >
                              {biz.photo_url ? (
                                <>
                                  <img
                                    src={biz.photo_url}
                                    alt={biz.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Maximize2 className="h-4 w-4" />
                                  </div>
                                </>
                              ) : (
                                <Store className="h-6 w-6 text-muted-foreground" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground text-sm truncate max-w-[180px]">{biz.name}</span>
                                <Link
                                  to="/directory/$businessId"
                                  params={{ businessId: biz.id }}
                                  target="_blank"
                                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                                  title="View Public Store Page"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {biz.address || 'No street address given'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                {biz.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {biz.phone}
                                  </span>
                                )}
                                {biz.created_at && (
                                  <span>{format(new Date(biz.created_at), 'MMM d, yyyy')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="align-top py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${catStyle.bg} ${catStyle.color} ${catStyle.border}`}
                          >
                            <CatIcon className="h-3.5 w-3.5" />
                            {biz.category}
                          </span>
                        </TableCell>

                        {/* GPS & Purok Verification */}
                        <TableCell className="align-top py-3.5">
                          <div className="space-y-1.5">
                            {/* Barangay & Purok badge */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  isDaine2
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                                    : 'bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                                }`}
                              >
                                <Building2 className="h-3 w-3" />
                                {isDaine2 ? 'Daine 2' : 'Daine 1'}
                              </span>

                              {biz.purok ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                  <MapPin className="h-3 w-3 text-emerald-600" />
                                  {biz.purok}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  Purok Unassigned
                                </span>
                              )}
                            </div>

                            {/* GPS coordinates & Google Maps link */}
                            {hasGps ? (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Navigation className="h-3 w-3 text-primary shrink-0" />
                                <span className="font-mono text-[11px]">
                                  {biz.latitude?.toFixed(4)}, {biz.longitude?.toFixed(4)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyCoordinates(biz.latitude!, biz.longitude!)}
                                  className="text-muted-foreground hover:text-foreground p-0.5"
                                  title="Copy GPS coordinates"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${biz.latitude},${biz.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-0.5 text-[11px] font-medium ml-1"
                                >
                                  Maps <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                                No GPS Pin saved
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Photos Review Cell */}
                        <TableCell className="align-top py-3.5">
                          {hasPhotos ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPhotoBiz(biz)
                                setActivePhotoTab(biz.photo_url ? 'photo' : biz.menu_image_url ? 'menu' : 'misc')
                              }}
                              className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors group"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                              <span>Inspect Photos ({photoCount})</span>
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No photos submitted</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="align-top py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                              biz.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300'
                                : biz.status === 'rejected'
                                  ? 'bg-red-100 text-red-950 dark:bg-red-950/60 dark:text-red-200 border border-red-300'
                                  : biz.status === 'archived'
                                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200 border border-slate-300'
                                    : 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300'
                            }`}
                          >
                            {biz.status === 'approved' && <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
                            {biz.status === 'rejected' && <XCircle className="h-3.5 w-3.5 text-red-600" />}
                            {biz.status === 'pending' && <Clock className="h-3.5 w-3.5 text-amber-600" />}
                            {biz.status === 'archived' && <Archive className="h-3.5 w-3.5 text-slate-500" />}
                            {biz.status}
                          </span>
                          {biz.notes && (
                            <p className="text-[11px] text-muted-foreground mt-1 max-w-[150px] truncate" title={biz.notes}>
                              Note: {biz.notes}
                            </p>
                          )}
                        </TableCell>

                        {/* Actions (Min 44px buttons) */}
                        <TableCell className="align-top py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View / Details modal */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="min-h-[44px] min-w-[44px] px-2 text-foreground hover:bg-muted"
                              onClick={() => setDetailBiz(biz)}
                              title="View MSME full verification sheet"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* 1-Click Approve */}
                            {biz.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-h-[44px] px-3 font-semibold text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                                onClick={() => handleQuickApprove(biz)}
                                title="Approve this MSME immediately"
                              >
                                <Check className="h-4 w-4 mr-1 text-emerald-600" />
                                Approve
                              </Button>
                            )}

                            {/* 1-Click Reject modal trigger */}
                            {biz.status !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-h-[44px] px-3 font-semibold text-red-700 bg-red-50 border-red-300 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700"
                                onClick={() => {
                                  setActionTarget({ biz, type: 'reject' })
                                  setRejectionReason('')
                                }}
                                title="Reject listing with reason"
                              >
                                <X className="h-4 w-4 mr-1 text-red-600" />
                                Reject
                              </Button>
                            )}

                            {/* Archive / Suspend */}
                            {biz.status !== 'archived' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="min-h-[44px] px-2.5 text-muted-foreground hover:text-foreground font-semibold"
                                onClick={() => {
                                  setActionTarget({ biz, type: 'archive' })
                                  setRejectionReason('')
                                }}
                                title="Suspend or archive listing"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Photo Review Lightbox Dialog */}
      <Dialog open={Boolean(selectedPhotoBiz)} onOpenChange={(open) => !open && setSelectedPhotoBiz(null)}>
        <DialogContent className="max-w-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>Photo Verification: {selectedPhotoBiz?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Review uploaded storefront, menu/price list, and showcase proof images to verify business legitimacy.
            </DialogDescription>
          </DialogHeader>

          {selectedPhotoBiz && (
            <div className="space-y-4 pt-2">
              {/* Photo Selector Tabs */}
              <div className="flex items-center gap-2 border-b pb-2">
                {selectedPhotoBiz.photo_url && (
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('photo')}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      activePhotoTab === 'photo'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Storefront Photo
                  </button>
                )}
                {selectedPhotoBiz.menu_image_url && (
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('menu')}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      activePhotoTab === 'menu'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Menu / Price List
                  </button>
                )}
                {selectedPhotoBiz.misc_image_url && (
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('misc')}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      activePhotoTab === 'misc'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Showcase / Products
                  </button>
                )}
              </div>

              {/* Display Active Photo */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 border flex items-center justify-center">
                {activePhotoTab === 'photo' && selectedPhotoBiz.photo_url && (
                  <img
                    src={selectedPhotoBiz.photo_url}
                    alt="Storefront photo"
                    className="max-h-[400px] w-full object-contain"
                  />
                )}
                {activePhotoTab === 'menu' && selectedPhotoBiz.menu_image_url && (
                  <img
                    src={selectedPhotoBiz.menu_image_url}
                    alt="Menu / Price List"
                    className="max-h-[400px] w-full object-contain"
                  />
                )}
                {activePhotoTab === 'misc' && selectedPhotoBiz.misc_image_url && (
                  <img
                    src={selectedPhotoBiz.misc_image_url}
                    alt="Showcase photo"
                    className="max-h-[400px] w-full object-contain"
                  />
                )}
                {!selectedPhotoBiz.photo_url && !selectedPhotoBiz.menu_image_url && !selectedPhotoBiz.misc_image_url && (
                  <p className="text-sm text-muted-foreground">No photos uploaded for this merchant.</p>
                )}
              </div>

              {/* Quick Actions inside Photo Modal */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Location: </span>
                  {selectedPhotoBiz.purok || 'Purok N/A'}, {selectedPhotoBiz.barangay === 'daine_2' ? 'Barangay Daine 2' : 'Barangay Daine 1'}
                </div>

                <div className="flex items-center gap-2">
                  {selectedPhotoBiz.status !== 'approved' && (
                    <Button
                      size="sm"
                      className="min-h-[44px] px-4 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        handleQuickApprove(selectedPhotoBiz)
                        setSelectedPhotoBiz(null)
                      }}
                    >
                      <Check className="h-4 w-4 mr-1.5" /> Approve Listing
                    </Button>
                  )}
                  {selectedPhotoBiz.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="min-h-[44px] px-4 font-semibold"
                      onClick={() => {
                        setActionTarget({ biz: selectedPhotoBiz, type: 'reject' })
                        setSelectedPhotoBiz(null)
                      }}
                    >
                      <X className="h-4 w-4 mr-1.5" /> Reject Listing
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection / Archive Reason Modal */}
      <Dialog open={Boolean(actionTarget)} onOpenChange={(open) => !open && setActionTarget(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {actionTarget?.type === 'reject' ? (
                <>
                  <XCircle className="h-5 w-5 text-destructive" /> Reject Merchant Listing
                </>
              ) : (
                <>
                  <Archive className="h-5 w-5 text-amber-500" /> Archive / Suspend Listing
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionTarget?.type === 'reject'
                ? `Provide an official reason for rejecting "${actionTarget?.biz.name}". This will be communicated to the merchant owner.`
                : `Suspend or archive "${actionTarget?.biz.name}" from public searches and directory views.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {actionTarget?.type === 'reject' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Common Reasons (Click to insert):</label>
                <div className="space-y-1">
                  {COMMON_REJECTION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      className="text-left text-xs p-2 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground w-full transition-colors border"
                    >
                      • {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {actionTarget?.type === 'reject' ? 'Rejection Feedback / Notes:' : 'Archive Notes (Optional):'}
              </label>
              <Textarea
                placeholder={
                  actionTarget?.type === 'reject'
                    ? 'Enter specific instructions or requirements for resubmission...'
                    : 'Reason for archiving...'
                }
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] px-4 font-medium"
              onClick={() => setActionTarget(null)}
              disabled={isSubmittingAction}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={actionTarget?.type === 'reject' ? 'destructive' : 'default'}
              className="min-h-[44px] px-5 font-semibold"
              onClick={handleConfirmAction}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction
                ? 'Processing...'
                : actionTarget?.type === 'reject'
                  ? 'Confirm Rejection'
                  : 'Archive Listing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deep-Dive MSME Verification Sheet / Modal */}
      <Dialog open={Boolean(detailBiz)} onOpenChange={(open) => !open && setDetailBiz(null)}>
        <DialogContent className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span>{detailBiz?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Complete MSME registration profile & verification credentials.
            </DialogDescription>
          </DialogHeader>

          {detailBiz && (
            <div className="space-y-5 pt-2">
              {/* Category & Status overview */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="text-xs font-semibold py-1 px-3">
                  {detailBiz.category}
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold py-1 px-3">
                  {detailBiz.barangay === 'daine_2' ? 'Barangay Daine 2' : 'Barangay Daine 1'}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Owner ID: {detailBiz.owner_id || 'Unassigned'}
                </span>
              </div>

              {/* Business Description */}
              {detailBiz.description && (
                <div className="bg-muted/40 p-3.5 rounded-xl border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">About Business</p>
                  <p className="text-sm text-foreground leading-relaxed">{detailBiz.description}</p>
                </div>
              )}

              {/* Coordinates and Purok Location Box */}
              <div className="bg-muted/30 p-4 rounded-xl border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    Purok & GIS Location
                  </span>
                  {detailBiz.latitude && detailBiz.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${detailBiz.latitude},${detailBiz.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Open in Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-foreground font-medium">
                  {detailBiz.address || 'No specific street address'}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Purok: <strong className="text-foreground">{detailBiz.purok || 'Unassigned'}</strong></span>
                  {detailBiz.latitude && detailBiz.longitude && (
                    <span>GPS: <strong className="text-foreground">{detailBiz.latitude}, {detailBiz.longitude}</strong></span>
                  )}
                </div>
              </div>

              {/* Contact Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                  <p className="text-sm font-semibold">{detailBiz.phone || 'Not provided'}</p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Operating Hours</p>
                  <p className="text-sm font-semibold">{detailBiz.hours || 'Standard hours'}</p>
                </div>
                {detailBiz.messenger_link && (
                  <div className="p-3 rounded-xl border bg-card col-span-full">
                    <p className="text-xs text-muted-foreground mb-1">Messenger Link</p>
                    <a
                      href={detailBiz.messenger_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline font-medium break-all"
                    >
                      {detailBiz.messenger_link}
                    </a>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              {detailBiz.payment_methods && detailBiz.payment_methods.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Accepted Payment Methods</p>
                  <div className="flex flex-wrap gap-2">
                    {detailBiz.payment_methods.map((method: string) => (
                      <span key={method} className="px-2.5 py-1 rounded-md bg-muted text-xs font-semibold text-foreground border">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos Preview in Sheet */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Uploaded Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {detailBiz.photo_url && (
                    <div
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedPhotoBiz(detailBiz)
                        setActivePhotoTab('photo')
                      }}
                    >
                      <img src={detailBiz.photo_url} alt="Storefront" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Storefront</span>
                    </div>
                  )}
                  {detailBiz.menu_image_url && (
                    <div
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedPhotoBiz(detailBiz)
                        setActivePhotoTab('menu')
                      }}
                    >
                      <img src={detailBiz.menu_image_url} alt="Menu" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Menu</span>
                    </div>
                  )}
                  {detailBiz.misc_image_url && (
                    <div
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedPhotoBiz(detailBiz)
                        setActivePhotoTab('misc')
                      }}
                    >
                      <img src={detailBiz.misc_image_url} alt="Showcase" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Showcase</span>
                    </div>
                  )}
                  {!detailBiz.photo_url && !detailBiz.menu_image_url && !detailBiz.misc_image_url && (
                    <p className="text-xs text-muted-foreground col-span-3 italic">No verification photos attached.</p>
                  )}
                </div>
              </div>

              {/* Action Footer in Detail Sheet */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t">
                {detailBiz.status !== 'approved' && (
                  <Button
                    size="sm"
                    className="min-h-[44px] px-4 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      handleQuickApprove(detailBiz)
                      setDetailBiz(null)
                    }}
                  >
                    <Check className="h-4 w-4 mr-1.5" /> Approve Listing
                  </Button>
                )}
                {detailBiz.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="min-h-[44px] px-4 font-semibold"
                    onClick={() => {
                      setActionTarget({ biz: detailBiz, type: 'reject' })
                    }}
                  >
                    <X className="h-4 w-4 mr-1.5" /> Reject Listing
                  </Button>
                )}
                {detailBiz.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] px-3 font-semibold"
                    onClick={() => {
                      setActionTarget({ biz: detailBiz, type: 'archive' })
                    }}
                  >
                    <Archive className="h-4 w-4 mr-1" /> Archive
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
