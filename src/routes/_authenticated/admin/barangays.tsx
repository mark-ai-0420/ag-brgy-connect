import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { z } from 'zod'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { useTenant } from '#/lib/tenant/TenantContext'
import { DEFAULT_BARANGAYS, type Barangay } from '#/server/tenant'
import { PageHeader } from '#/components/common/PageHeader'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  MapPin,
  Phone,
  Layers,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Power,
  RotateCcw,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

export interface AdminBarangayItem extends Barangay {
  resident_count?: number
  document_count?: number
  business_count?: number
}

/**
 * Server function: Get all registered barangays with stats
 */
export const getAdminBarangays = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    barangays: AdminBarangayItem[]
    isSuperAdmin: boolean
    canManage: boolean
  }> => {
    const supabase = createSupabaseServerClient()
    const { user, role } = await getAuthSession()

    if (!user || (role !== 'admin' && role !== 'moderator' && role !== 'super_admin')) {
      throw new Error('Unauthorized')
    }

    const isSuperAdmin = role === 'super_admin'
    const canManage = role === 'super_admin' || role === 'admin'

    try {
      const { data: rows, error } = await supabase
        .from('barangays')
        .select('*')
        .order('name', { ascending: true })

      if (error || !rows || rows.length === 0) {
        return {
          barangays: DEFAULT_BARANGAYS.map((b) => ({ ...b, resident_count: 0, document_count: 0, business_count: 0 })),
          isSuperAdmin,
          canManage,
        }
      }

      // Fetch aggregated counts per barangay_id
      const [profilesRes, docsRes, bizRes] = await Promise.all([
        supabase.from('profiles').select('barangay_id'),
        supabase.from('document_requests').select('barangay_id'),
        supabase.from('businesses').select('barangay_id'),
      ])

      const residentMap: Record<string, number> = {}
      profilesRes.data?.forEach((p) => {
        if (p.barangay_id) {
          residentMap[p.barangay_id] = (residentMap[p.barangay_id] || 0) + 1
        }
      })

      const docMap: Record<string, number> = {}
      docsRes.data?.forEach((d) => {
        if (d.barangay_id) {
          docMap[d.barangay_id] = (docMap[d.barangay_id] || 0) + 1
        }
      })

      const bizMap: Record<string, number> = {}
      bizRes.data?.forEach((b) => {
        if (b.barangay_id) {
          bizMap[b.barangay_id] = (bizMap[b.barangay_id] || 0) + 1
        }
      })

      const formatted: AdminBarangayItem[] = rows.map((r: any) => {
        let puroks: string[] = []
        if (Array.isArray(r.puroks)) {
          puroks = r.puroks.map(String)
        } else if (typeof r.puroks === 'string') {
          try {
            const p = JSON.parse(r.puroks)
            if (Array.isArray(p)) puroks = p.map(String)
          } catch {
            puroks = []
          }
        }

        return {
          id: r.id,
          slug: r.slug,
          code_prefix: r.code_prefix || 'BD',
          name: r.name,
          short_name: r.short_name || r.name,
          municipality: r.municipality || 'Indang',
          province: r.province || 'Cavite',
          region: r.region || 'Region IV-A (CALABARZON)',
          zip_code: r.zip_code || '4122',
          seal_url: r.seal_url || '/logo.jpg',
          logo_url: r.logo_url || '/logo.jpg',
          banner_url: r.banner_url || null,
          tagline: r.tagline || null,
          description: r.description || null,
          map_center_lat: Number(r.map_center_lat ?? 14.1955),
          map_center_lng: Number(r.map_center_lng ?? 120.8798),
          map_default_zoom: Number(r.map_default_zoom ?? 15),
          puroks,
          purok_landmarks: Array.isArray(r.purok_landmarks) ? r.purok_landmarks : null,
          emergency_hotline: r.emergency_hotline || null,
          police_hotline: r.police_hotline || null,
          health_center_hotline: r.health_center_hotline || null,
          is_active: Boolean(r.is_active ?? true),
          created_at: r.created_at,
          updated_at: r.updated_at,
          resident_count: residentMap[r.id] ?? 0,
          document_count: docMap[r.id] ?? 0,
          business_count: bizMap[r.id] ?? 0,
        }
      })

      return {
        barangays: formatted,
        isSuperAdmin,
        canManage,
      }
    } catch {
      return {
        barangays: DEFAULT_BARANGAYS.map((b) => ({ ...b, resident_count: 0, document_count: 0, business_count: 0 })),
        isSuperAdmin,
        canManage,
      }
    }
  }
)

/**
 * Server function: Upsert a barangay record
 */
export const upsertBarangayFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().optional(),
        slug: z
          .string()
          .min(2)
          .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
        code_prefix: z.string().min(2).max(10),
        name: z.string().min(2),
        short_name: z.string().min(2),
        municipality: z.string().min(2),
        province: z.string().min(2),
        region: z.string().min(2),
        zip_code: z.string().min(2),
        seal_url: z.string().optional().nullable(),
        logo_url: z.string().optional().nullable(),
        tagline: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        map_center_lat: z.number(),
        map_center_lng: z.number(),
        map_default_zoom: z.number().int().min(10).max(20),
        puroks: z.array(z.string()).min(1),
        emergency_hotline: z.string().optional().nullable(),
        police_hotline: z.string().optional().nullable(),
        health_center_hotline: z.string().optional().nullable(),
        is_active: z.boolean(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { user, role } = await getAuthSession()

    if (!user || (role !== 'admin' && role !== 'super_admin')) {
      throw new Error('Forbidden: Only administrators can modify barangay tenants')
    }

    const payload: any = {
      slug: data.slug.toLowerCase().trim(),
      code_prefix: data.code_prefix.toUpperCase().trim(),
      name: data.name.trim(),
      short_name: data.short_name.trim(),
      municipality: data.municipality.trim(),
      province: data.province.trim(),
      region: data.region.trim(),
      zip_code: data.zip_code.trim(),
      seal_url: data.seal_url || '/logo.jpg',
      logo_url: data.logo_url || '/logo.jpg',
      tagline: data.tagline?.trim() || null,
      description: data.description?.trim() || null,
      map_center_lat: data.map_center_lat,
      map_center_lng: data.map_center_lng,
      map_default_zoom: data.map_default_zoom,
      puroks: data.puroks,
      emergency_hotline: data.emergency_hotline?.trim() || null,
      police_hotline: data.police_hotline?.trim() || null,
      health_center_hotline: data.health_center_hotline?.trim() || null,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    }

    if (data.id) {
      payload.id = data.id
    }

    const { data: saved, error } = await supabase
      .from('barangays')
      .upsert(payload, { onConflict: 'slug' })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, barangay: saved }
  })

/**
 * Server function: Toggle active state of a barangay
 */
export const toggleBarangayStatusFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        is_active: z.boolean(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { user, role } = await getAuthSession()

    if (!user || (role !== 'admin' && role !== 'super_admin')) {
      throw new Error('Forbidden: Only administrators can toggle barangay status')
    }

    const { error } = await supabase
      .from('barangays')
      .update({ is_active: data.is_active, updated_at: new Date().toISOString() })
      .eq('id', data.id)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/barangays')({
  component: AdminBarangaysRoute,
  loader: () => getAdminBarangays(),
})

interface FormValues {
  id?: string
  slug: string
  code_prefix: string
  name: string
  short_name: string
  municipality: string
  province: string
  region: string
  zip_code: string
  seal_url: string
  tagline: string
  description: string
  map_center_lat: number
  map_center_lng: number
  map_default_zoom: number
  puroksText: string
  emergency_hotline: string
  police_hotline: string
  health_center_hotline: string
  is_active: boolean
}

const DEFAULT_FORM: FormValues = {
  slug: '',
  code_prefix: '',
  name: '',
  short_name: '',
  municipality: 'Indang',
  province: 'Cavite',
  region: 'Region IV-A (CALABARZON)',
  zip_code: '4122',
  seal_url: '/logo.jpg',
  tagline: '',
  description: '',
  map_center_lat: 14.1955,
  map_center_lng: 120.8798,
  map_default_zoom: 16,
  puroksText: 'Purok 1, Purok 2, Purok 3, Purok 4',
  emergency_hotline: '',
  police_hotline: '',
  health_center_hotline: '',
  is_active: true,
}

function AdminBarangaysRoute() {
  const { barangays = [], isSuperAdmin, canManage } = Route.useLoaderData() ?? {}
  const router = useRouter()
  const { activeBarangay, setTenantSlug } = useTenant()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<FormValues>(DEFAULT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Status toggle loading state
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Filtered barangays
  const filtered = barangays.filter((b: AdminBarangayItem) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.code_prefix.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      b.municipality.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? b.is_active
        : !b.is_active

    return matchesSearch && matchesStatus
  })

  // Quick stats
  const totalCount = barangays.length
  const activeCount = barangays.filter((b: AdminBarangayItem) => b.is_active).length
  const totalPuroks = barangays.reduce((acc: number, b: AdminBarangayItem) => acc + (b.puroks?.length || 0), 0)

  const handleOpenCreate = () => {
    setIsEditing(false)
    setFormData(DEFAULT_FORM)
    setModalOpen(true)
  }

  const handleOpenEdit = (b: AdminBarangayItem) => {
    setIsEditing(true)
    setFormData({
      id: b.id,
      slug: b.slug,
      code_prefix: b.code_prefix,
      name: b.name,
      short_name: b.short_name,
      municipality: b.municipality,
      province: b.province,
      region: b.region,
      zip_code: b.zip_code,
      seal_url: b.seal_url || '/logo.jpg',
      tagline: b.tagline || '',
      description: b.description || '',
      map_center_lat: b.map_center_lat,
      map_center_lng: b.map_center_lng,
      map_default_zoom: b.map_default_zoom || 16,
      puroksText: b.puroks ? b.puroks.join(', ') : '',
      emergency_hotline: b.emergency_hotline || '',
      police_hotline: b.police_hotline || '',
      health_center_hotline: b.health_center_hotline || '',
      is_active: b.is_active,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) {
      toast.error('Only administrators can create or edit barangays')
      return
    }

    const puroks = formData.puroksText
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    if (puroks.length === 0) {
      toast.error('At least one purok or sitio is required')
      return
    }

    setIsSubmitting(true)
    try {
      await upsertBarangayFn({
        data: {
          id: formData.id,
          slug: formData.slug,
          code_prefix: formData.code_prefix,
          name: formData.name,
          short_name: formData.short_name,
          municipality: formData.municipality,
          province: formData.province,
          region: formData.region,
          zip_code: formData.zip_code,
          seal_url: formData.seal_url || null,
          tagline: formData.tagline || null,
          description: formData.description || null,
          map_center_lat: formData.map_center_lat,
          map_center_lng: formData.map_center_lng,
          map_default_zoom: formData.map_default_zoom,
          puroks,
          emergency_hotline: formData.emergency_hotline || null,
          police_hotline: formData.police_hotline || null,
          health_center_hotline: formData.health_center_hotline || null,
          is_active: formData.is_active,
        },
      })

      toast.success(isEditing ? 'Barangay updated successfully' : 'New barangay onboarded successfully!')
      setModalOpen(false)
      router.invalidate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save barangay')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (b: AdminBarangayItem) => {
    if (!canManage) return
    setTogglingId(b.id)
    try {
      await toggleBarangayStatusFn({
        data: {
          id: b.id,
          is_active: !b.is_active,
        },
      })
      toast.success(`${b.name} is now ${!b.is_active ? 'Active' : 'Inactive'}`)
      router.invalidate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleSwitchTenant = async (slug: string) => {
    await setTenantSlug(slug)
    toast.success(`Switched active view to ${slug}`)
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Barangay Multi-Tenant Registry"
        description="Pluggable multi-tenant barangay management. Onboard, configure, and isolate jurisdictions across the LGU network."
        actions={
          canManage && (
            <Button onClick={handleOpenCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4" />
              Onboard Barangay
            </Button>
          )
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium tracking-wider">
              Registered Barangays
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {totalCount}
              <Building2 className="h-6 w-6 text-primary/40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Pluggable LGU jurisdictions registered
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium tracking-wider">
              Active Portals
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              {activeCount}
              <CheckCircle2 className="h-6 w-6 text-emerald-500/40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Live public-facing community portals
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium tracking-wider">
              Puroks & Sitios
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-primary flex items-center justify-between">
              {totalPuroks}
              <Layers className="h-6 w-6 text-primary/40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Geographic sub-units mapped
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium tracking-wider">
              Architecture Status
            </CardDescription>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
              <Layers className="h-5 w-5" />
              Multi-Tenant v2
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>{isSuperAdmin ? 'Super-Admin Mode' : 'Admin Mode'}</span>
            <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-wider font-mono">
              RLS Isolated
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, prefix, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex rounded-md border border-input p-1 bg-background text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Inactive ({totalCount - activeCount})
            </button>
          </div>
        </div>
      </div>

      {/* Barangays Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[280px]">Barangay & Code</TableHead>
              <TableHead>Location & Province</TableHead>
              <TableHead className="text-center">Puroks</TableHead>
              <TableHead className="text-center">Residents</TableHead>
              <TableHead className="text-center">Requests</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="font-medium text-sm">No barangays found</p>
                  <p className="text-xs">Adjust your search criteria or onboard a new barangay unit.</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b: AdminBarangayItem) => {
                const isCurrentlyActiveTenant = activeBarangay.slug === b.slug

                return (
                  <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={b.seal_url || '/logo.jpg'}
                          alt={b.name}
                          className="h-10 w-10 rounded-full border border-border object-contain bg-background p-0.5 shrink-0"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = '/logo.jpg'
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">{b.name}</span>
                            <Badge variant="secondary" className="font-mono text-[11px] font-bold px-1.5 py-0">
                              {b.code_prefix}
                            </Badge>
                            {isCurrentlyActiveTenant && (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
                                Current View
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">/{b.slug}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="font-medium">
                          {b.municipality}, {b.province}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {b.region} • {b.zip_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs font-normal">
                        {b.puroks?.length || 0} puroks
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium text-xs">
                      {b.resident_count ?? 0}
                    </TableCell>
                    <TableCell className="text-center font-medium text-xs">
                      {b.document_count ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {b.is_active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Switch portal view to this tenant"
                          onClick={() => handleSwitchTenant(b.slug)}
                          className="h-8 px-2 text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Preview</span>
                        </Button>

                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Barangay"
                              onClick={() => handleOpenEdit(b)}
                              className="h-8 px-2 text-xs"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title={b.is_active ? 'Deactivate Barangay' : 'Activate Barangay'}
                              onClick={() => handleToggleStatus(b)}
                              disabled={togglingId === b.id}
                              className={`h-8 px-2 text-xs ${
                                b.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                              }`}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Onboard / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {isEditing ? `Edit Barangay: ${formData.name}` : 'Onboard New Barangay Unit'}
            </DialogTitle>
            <DialogDescription>
              Provide administrative metadata, geographic boundaries, emergency contacts, and purok divisions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="identity">Identity & Code</TabsTrigger>
                <TabsTrigger value="geo">Location & Puroks</TabsTrigger>
                <TabsTrigger value="gis">GIS & Hotlines</TabsTrigger>
              </TabsList>

              {/* Tab 1: Identity */}
              <TabsContent value="identity" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold">
                      Full Barangay Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. Barangay Daine 3"
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setFormData((prev) => ({
                          ...prev,
                          name,
                          // auto-generate slug and short_name if not editing
                          ...(!isEditing && {
                            short_name: name.replace(/^Barangay\s+/i, ''),
                            slug: name
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-+|-+$/g, ''),
                          }),
                        }))
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="short_name" className="text-xs font-semibold">
                      Short Name *
                    </Label>
                    <Input
                      id="short_name"
                      placeholder="e.g. Daine 3"
                      value={formData.short_name}
                      onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="slug" className="text-xs font-semibold">
                      URL Slug *
                    </Label>
                    <Input
                      id="slug"
                      placeholder="e.g. daine-3"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                      required
                    />
                    <span className="text-[11px] text-muted-foreground">Used in routes and tenant cookie.</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="code_prefix" className="text-xs font-semibold">
                      Document Prefix Code *
                    </Label>
                    <Input
                      id="code_prefix"
                      placeholder="e.g. BD3"
                      value={formData.code_prefix}
                      onChange={(e) => setFormData({ ...formData, code_prefix: e.target.value.toUpperCase() })}
                      maxLength={10}
                      required
                    />
                    <span className="text-[11px] text-muted-foreground">Used for certificate tracking numbers.</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="seal_url" className="text-xs font-semibold">
                    Official Seal URL
                  </Label>
                  <Input
                    id="seal_url"
                    placeholder="/logo.jpg or https://..."
                    value={formData.seal_url}
                    onChange={(e) => setFormData({ ...formData, seal_url: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tagline" className="text-xs font-semibold">
                    Barangay Tagline / Motto
                  </Label>
                  <Input
                    id="tagline"
                    placeholder="e.g. Pamahalaang Barangay ng Daine"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Portal Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Short summary of this community unit and public services."
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </TabsContent>

              {/* Tab 2: Geo & Puroks */}
              <TabsContent value="geo" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="municipality" className="text-xs font-semibold">
                      Municipality / City *
                    </Label>
                    <Input
                      id="municipality"
                      value={formData.municipality}
                      onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="province" className="text-xs font-semibold">
                      Province *
                    </Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="region" className="text-xs font-semibold">
                      Region *
                    </Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="zip_code" className="text-xs font-semibold">
                      ZIP Code *
                    </Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="puroksText" className="text-xs font-semibold">
                    Puroks & Sitios (Comma-separated) *
                  </Label>
                  <Textarea
                    id="puroksText"
                    placeholder="Purok 1, Purok 2, Purok 3, Sitio Centro"
                    rows={3}
                    value={formData.puroksText}
                    onChange={(e) => setFormData({ ...formData, puroksText: e.target.value })}
                    required
                  />
                  <span className="text-[11px] text-muted-foreground">
                    These options populate dropdowns for resident registrations and document requests.
                  </span>
                </div>
              </TabsContent>

              {/* Tab 3: GIS & Hotlines */}
              <TabsContent value="gis" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="map_center_lat" className="text-xs font-semibold">
                      Center Latitude *
                    </Label>
                    <Input
                      id="map_center_lat"
                      type="number"
                      step="0.0001"
                      value={formData.map_center_lat}
                      onChange={(e) => setFormData({ ...formData, map_center_lat: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="map_center_lng" className="text-xs font-semibold">
                      Center Longitude *
                    </Label>
                    <Input
                      id="map_center_lng"
                      type="number"
                      step="0.0001"
                      value={formData.map_center_lng}
                      onChange={(e) => setFormData({ ...formData, map_center_lng: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="map_default_zoom" className="text-xs font-semibold">
                      Default Map Zoom
                    </Label>
                    <Input
                      id="map_default_zoom"
                      type="number"
                      min={10}
                      max={20}
                      value={formData.map_default_zoom}
                      onChange={(e) => setFormData({ ...formData, map_default_zoom: parseInt(e.target.value) || 16 })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="emergency_hotline" className="text-xs font-semibold">
                      Barangay Emergency Hotline
                    </Label>
                    <Input
                      id="emergency_hotline"
                      placeholder="e.g. (046) 415-0123 / 0917-123-4567"
                      value={formData.emergency_hotline}
                      onChange={(e) => setFormData({ ...formData, emergency_hotline: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="police_hotline" className="text-xs font-semibold">
                      Police Substation Hotline
                    </Label>
                    <Input
                      id="police_hotline"
                      placeholder="e.g. (046) 415-0211"
                      value={formData.police_hotline}
                      onChange={(e) => setFormData({ ...formData, police_hotline: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="health_center_hotline" className="text-xs font-semibold">
                      Health Center Hotline
                    </Label>
                    <Input
                      id="health_center_hotline"
                      placeholder="e.g. (046) 415-0102"
                      value={formData.health_center_hotline}
                      onChange={(e) => setFormData({ ...formData, health_center_hotline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active_cb"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Label htmlFor="is_active_cb" className="text-xs font-medium cursor-pointer">
                    Enable portal publicly immediately (Active)
                  </Label>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Onboard Barangay'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
