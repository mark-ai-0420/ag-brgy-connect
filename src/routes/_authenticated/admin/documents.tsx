import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Badge } from '#/components/ui/badge'
import { toast } from 'sonner'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  FileText,
  Filter,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  MoreHorizontal,
  Sparkles,
  ShieldCheck,
  Building2,
  Home,
  Award,
  IdCard,
  RefreshCw,
  Eye,
  Send,
  User,
  Phone,
  Layers,
  FileCheck2,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { CertificatePrintModal } from '#/components/documents/CertificatePrintModal'

const STATUSES = ['pending', 'in_review', 'ready', 'completed', 'rejected'] as const
type DocumentStatus = (typeof STATUSES)[number]

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string; icon: typeof Clock }
> = {
  pending: {
    label: 'Pending Review',
    badge:
      'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  in_review: {
    label: 'Approved / In Review',
    badge:
      'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
    icon: FileCheck2,
  },
  ready: {
    label: 'Ready for Pickup',
    badge:
      'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    icon: Sparkles,
  },
  completed: {
    label: 'Released / Completed',
    badge:
      'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected / On Hold',
    badge:
      'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
    icon: XCircle,
  },
}

const DOC_TYPE_META: Record<
  string,
  { label: string; icon: typeof FileText; color: string }
> = {
  barangay_clearance: {
    label: 'Barangay Clearance',
    icon: ShieldCheck,
    color: 'text-amber-600 dark:text-amber-400',
  },
  barangay_id: {
    label: 'Barangay Resident ID',
    icon: IdCard,
    color: 'text-blue-600 dark:text-blue-400',
  },
  certificate_of_residency: {
    label: 'Certificate of Residency',
    icon: Home,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  certificate_of_indigency: {
    label: 'Certificate of Indigency',
    icon: Award,
    color: 'text-purple-600 dark:text-purple-400',
  },
  business_permit: {
    label: 'Business Clearance / Permit',
    icon: Building2,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  other: {
    label: 'Other Certification',
    icon: FileText,
    color: 'text-slate-600 dark:text-slate-400',
  },
}

const QUICK_REMARK_TEMPLATES = [
  'Ready for pickup at Barangay Hall Counter 1 during office hours (8AM - 5PM). Bring valid ID.',
  'Document verified and signed by Punong Barangay. Official dry seal affixed.',
  'Please provide a 2x2 ID photo and cedula upon claiming.',
  'Payment for barangay clearance fee settled. Ready for release.',
  'Request placed on hold: Please submit updated proof of residency.',
]

const getDocumentRequests = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('user_roles')
    .select('barangay')
    .eq('user_id', user.id)
    .single()
  const adminScope = profile?.barangay || 'daine_1'

  // Query document requests
  let query = supabase
    .from('document_requests')
    .select(
      'id, requester_id, document_type, purpose, status, notes, created_at, updated_at, barangay, control_number, profiles(full_name, phone, address)'
    )
    .order('created_at', { ascending: false })

  if (adminScope !== 'both') {
    query = query.eq('barangay', adminScope)
  }

  const { data: requests, error } = await query

  let mappedRequests: any[] = []
  if (!error && requests) {
    mappedRequests = requests.map((req) => {
      const prof = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles
      const ctrl =
        req.control_number ||
        `${req.barangay === 'daine_2' ? 'BD2-' : 'BD1-'}${req.id.slice(0, 8).toUpperCase()}`
      return {
        ...req,
        control_number: ctrl,
        resident_name: prof?.full_name ?? 'Unknown Resident',
        phone: prof?.phone ?? null,
        address: prof?.address ?? null,
      }
    })
  } else {
    let fallbackQuery = supabase
      .from('document_requests')
      .select('id, requester_id, document_type, purpose, status, notes, created_at, updated_at, barangay, control_number')
      .order('created_at', { ascending: false })
    if (adminScope !== 'both') fallbackQuery = fallbackQuery.eq('barangay', adminScope)
    const [{ data: reqs }, { data: profs }] = await Promise.all([
      fallbackQuery,
      supabase.from('profiles').select('id, full_name, phone, address'),
    ])
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]))
    mappedRequests = (reqs ?? []).map((req) => {
      const prof = profMap.get(req.requester_id)
      const ctrl =
        req.control_number ||
        `${req.barangay === 'daine_2' ? 'BD2-' : 'BD1-'}${req.id.slice(0, 8).toUpperCase()}`
      return {
        ...req,
        control_number: ctrl,
        resident_name: prof?.full_name ?? 'Unknown Resident',
        phone: prof?.phone ?? null,
        address: prof?.address ?? null,
      }
    })
  }

  return { requests: mappedRequests, adminScope }
})

const updateRequestStatus = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z
      .object({
        id: z.string(),
        status: z.enum(['pending', 'in_review', 'ready', 'completed', 'rejected']),
        notes: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('document_requests')
      .update({
        status: data.status,
        notes: data.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/documents')({
  component: AdminDocumentsRoute,
  loader: () => getDocumentRequests(),
})

type RequestItem = Awaited<ReturnType<typeof getDocumentRequests>>['requests'][number]

function CopyTrackingCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success(`Tracking code copied: ${code}`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy tracking code"
      className="group inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/70 hover:bg-muted text-foreground font-mono text-xs font-bold border border-border/80 transition-colors cursor-pointer select-all"
    >
      <span>{code}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  )
}

function StatusBadgeDisplay({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' '),
    badge: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-slate-400',
    icon: Clock,
  }
  const Icon = cfg.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap shadow-2xs ${cfg.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      <Icon className="h-3 w-3 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  )
}

function JurisdictionBadge({ barangay }: { barangay?: string }) {
  if (barangay === 'daine_2') {
    return (
      <Badge
        variant="outline"
        className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
      >
        Daine 2
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="text-[11px] font-bold text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
    >
      Daine 1
    </Badge>
  )
}

interface DetailedUpdateModalProps {
  request: RequestItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function DetailedUpdateModal({ request, open, onOpenChange, onSuccess }: DetailedUpdateModalProps) {
  const [status, setStatus] = useState<DocumentStatus>('pending')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Sync state on open
  const initFromReq = () => {
    if (request) {
      setStatus((request.status as DocumentStatus) || 'pending')
      setNotes(request.notes || '')
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) initFromReq()
    onOpenChange(nextOpen)
  }

  async function handleSave() {
    if (!request) return
    setLoading(true)
    try {
      await updateRequestStatus({
        data: {
          id: request.id,
          status,
          notes,
        },
      })
      toast.success(`Request ${request.control_number} status updated to "${STATUS_CONFIG[status]?.label || status}"`)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update request')
    } finally {
      setLoading(false)
    }
  }

  if (!request) return null

  const docMeta = DOC_TYPE_META[request.document_type] || DOC_TYPE_META.other

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">Update Clearance Request</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {request.control_number} • {request.resident_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Summary Box */}
          <div className="rounded-xl bg-muted/50 p-3.5 border border-border grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5 font-medium">Resident:</span>
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                {request.resident_name}
              </span>
              {request.phone && (
                <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {request.phone}
                </span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5 font-medium">Document Type:</span>
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <docMeta.icon className={`h-3.5 w-3.5 ${docMeta.color}`} />
                {docMeta.label}
              </span>
              <span className="text-muted-foreground block mt-0.5">
                Jurisdiction: {request.barangay === 'daine_2' ? 'Barangay Daine 2' : 'Barangay Daine 1'}
              </span>
            </div>
            {request.purpose && (
              <div className="col-span-2 pt-1 border-t border-border/60">
                <span className="text-muted-foreground block font-medium">Purpose:</span>
                <span className="font-medium text-foreground">{request.purpose}</span>
              </div>
            )}
          </div>

          {/* Status Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Workflow Status
            </label>
            <Select value={status} onValueChange={(val) => setStatus(val as DocumentStatus)}>
              <SelectTrigger className="min-h-[44px] text-sm">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => {
                  const cfg = STATUS_CONFIG[s]
                  const Icon = cfg.icon
                  return (
                    <SelectItem key={s} value={s} className="min-h-[40px] cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{cfg.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Remarks Templates */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Quick Remarks Templates
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REMARK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNotes(tmpl)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary border border-border transition-colors text-left truncate max-w-full cursor-pointer"
                >
                  {tmpl.slice(0, 48)}...
                </button>
              ))}
            </div>
          </div>

          {/* Notes for Resident */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Instructions & Remarks for Resident
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none text-sm min-h-[95px]"
              placeholder="Enter pickup instructions, verified requirements, or remarks..."
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              * This message will be sent in real-time to the resident and displayed on their tracking portal.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 sm:pt-0">
          <Button
            variant="outline"
            type="button"
            className="min-h-[44px] px-4 font-medium"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="min-h-[44px] px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground btn-tactile cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Save & Notify Resident
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AdminDocumentsRoute() {
  const { requests, adminScope } = Route.useLoaderData()
  const router = useRouter()

  // State
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [barangayFilter, setBarangayFilter] = useState<string>('all')
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all')

  // Modals state
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [selectedPrintRequest, setSelectedPrintRequest] = useState<RequestItem | null>(null)
  const [detailedModalOpen, setDetailedModalOpen] = useState(false)
  const [selectedEditRequest, setSelectedEditRequest] = useState<RequestItem | null>(null)
  const [isUpdatingFast, setIsUpdatingFast] = useState<string | null>(null)

  // 1-Click Quick Status Transition
  async function handleFastStatusUpdate(req: RequestItem, newStatus: DocumentStatus) {
    setIsUpdatingFast(req.id)
    try {
      let defaultRemark = req.notes || ''
      if (newStatus === 'ready' && !defaultRemark) {
        defaultRemark = 'Your document is verified, signed, and ready for pickup at the Barangay Hall operations counter.'
      } else if (newStatus === 'completed' && !defaultRemark) {
        defaultRemark = 'Document officially issued and released to resident.'
      } else if (newStatus === 'in_review' && !defaultRemark) {
        defaultRemark = 'Document request is approved and undergoing secretary record validation.'
      }

      await updateRequestStatus({
        data: {
          id: req.id,
          status: newStatus,
          notes: defaultRemark,
        },
      })
      toast.success(
        `Updated ${req.control_number} to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`
      )
      router.invalidate()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status')
    } finally {
      setIsUpdatingFast(null)
    }
  }

  // Filter computation
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requests.filter((r) => {
      // Status filter
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      // Barangay unit filter
      if (adminScope === 'both' && barangayFilter !== 'all' && r.barangay !== barangayFilter) {
        return false
      }
      // Document type filter
      if (docTypeFilter !== 'all' && r.document_type !== docTypeFilter) return false
      // Search query (resident name, tracking code, purpose, notes, id)
      if (q) {
        const matchesName = r.resident_name?.toLowerCase().includes(q)
        const matchesCode = r.control_number?.toLowerCase().includes(q)
        const matchesPurpose = r.purpose?.toLowerCase().includes(q)
        const matchesNotes = r.notes?.toLowerCase().includes(q)
        const matchesId = r.id?.toLowerCase().includes(q)
        if (!matchesName && !matchesCode && !matchesPurpose && !matchesNotes && !matchesId) {
          return false
        }
      }
      return true
    })
  }, [requests, search, filterStatus, barangayFilter, docTypeFilter, adminScope])

  // Count computation based on current barangay & doc type filter
  const counts = useMemo(() => {
    const base = requests.filter((r) => {
      if (adminScope === 'both' && barangayFilter !== 'all' && r.barangay !== barangayFilter) {
        return false
      }
      if (docTypeFilter !== 'all' && r.document_type !== docTypeFilter) return false
      return true
    })
    const map: Record<string, number> = { all: base.length }
    STATUSES.forEach((s) => {
      map[s] = base.filter((r) => r.status === s).length
    })
    return map
  }, [requests, barangayFilter, docTypeFilter, adminScope])

  // Open detailed edit modal
  const openEditModal = (req: RequestItem) => {
    setSelectedEditRequest(req)
    setDetailedModalOpen(true)
  }

  // Open print / seal certification modal
  const openPrintModal = (req: RequestItem) => {
    setSelectedPrintRequest(req)
    setPrintModalOpen(true)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileCheck2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Document Requests & Clearance Queue
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            High-density clearance processing, 1-click status validation, and digital certificate stamping.
          </p>
        </div>

        {/* Header Right Badges / Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {adminScope !== 'both' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs font-semibold">
              <span className="text-muted-foreground">Jurisdiction:</span>
              <JurisdictionBadge barangay={adminScope} />
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs px-3 py-1.5 gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Dual-Barangay Master Scope
            </Badge>
          )}

          <Button
            variant="outline"
            onClick={() => router.invalidate()}
            className="min-h-[44px] px-3.5 font-semibold text-xs gap-1.5 cursor-pointer touch-target"
            title="Refresh Queue"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total In Queue</span>
            <p className="text-2xl font-black text-foreground">{counts.all ?? 0}</p>
            <span className="text-[11px] text-muted-foreground">All logged requests</span>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Pending
            </span>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-200">{counts.pending ?? 0}</p>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400">Requires triage</span>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              In Review
            </span>
            <p className="text-2xl font-black text-blue-900 dark:text-blue-200">{counts.in_review ?? 0}</p>
            <span className="text-[11px] text-blue-700/80 dark:text-blue-400">Record check</span>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
              Ready Pickup
            </span>
            <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200">{counts.ready ?? 0}</p>
            <span className="text-[11px] text-indigo-700/80 dark:text-indigo-400">At Hall desk</span>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Released
            </span>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200">{counts.completed ?? 0}</p>
            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400">Claimed by citizen</span>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Rejected
            </span>
            <p className="text-2xl font-black text-rose-900 dark:text-rose-200">{counts.rejected ?? 0}</p>
            <span className="text-[11px] text-rose-700/80 dark:text-rose-400">Disapproved / Fix</span>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Search & Filters */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by resident name, tracking code (e.g. BD1-XXXX), or purpose..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px] text-sm bg-background"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Jurisdiction segmented tabs & Document Type Filter */}
            <div className="flex flex-wrap items-center gap-3">
              {adminScope === 'both' && (
                <div className="flex bg-muted p-1 rounded-xl border shrink-0">
                  {[
                    { id: 'all', label: 'All Jurisdictions' },
                    { id: 'daine_1', label: 'Daine 1' },
                    { id: 'daine_2', label: 'Daine 2' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBarangayFilter(b.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                        barangayFilter === b.id
                          ? 'bg-background shadow-xs text-foreground font-extrabold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Document Type Dropdown */}
              <div className="w-full sm:w-56">
                <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
                  <SelectTrigger className="min-h-[44px] text-xs font-semibold">
                    <SelectValue placeholder="All Document Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="min-h-[40px] text-xs font-medium">
                      All Document Types
                    </SelectItem>
                    {Object.entries(DOC_TYPE_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key} className="min-h-[40px] text-xs font-medium">
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Status Filter Tabs Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-border/60">
            <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mr-1 shrink-0">
              <Filter className="h-3.5 w-3.5" />
              Status:
            </span>
            {['all', ...STATUSES].map((s) => {
              const count = counts[s] ?? 0
              const isSelected = filterStatus === s
              let label = s === 'all' ? 'All Requests' : STATUS_CONFIG[s]?.label || s.replace(/_/g, ' ')
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* High-Density Clearance Queue Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/20 border-b px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-foreground">Clearance Queue</CardTitle>
              <Badge variant="outline" className="text-xs font-bold">
                {filtered.length} {filtered.length === 1 ? 'record' : 'records'} matching
              </Badge>
            </div>

            {search && (
              <span className="text-xs text-muted-foreground">
                Filtered by: <span className="font-semibold text-foreground">"{search}"</span>
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[140px] font-bold text-xs">Tracking Code</TableHead>
                  <TableHead className="font-bold text-xs">Resident</TableHead>
                  <TableHead className="font-bold text-xs">Document Type</TableHead>
                  <TableHead className="font-bold text-xs">Purpose / Remarks</TableHead>
                  <TableHead className="font-bold text-xs">Jurisdiction</TableHead>
                  <TableHead className="font-bold text-xs">Submitted</TableHead>
                  <TableHead className="font-bold text-xs">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs pr-6">Actions & Quick Update</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground/60">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">No document requests found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Try adjusting your search term, jurisdiction scope, or status filter.
                        </p>
                      </div>
                      {(search || filterStatus !== 'all' || docTypeFilter !== 'all' || barangayFilter !== 'all') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearch('')
                            setFilterStatus('all')
                            setDocTypeFilter('all')
                            setBarangayFilter('all')
                          }}
                          className="min-h-[44px] px-4 font-semibold text-xs mt-2 cursor-pointer touch-target"
                        >
                          Reset All Filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((req) => {
                    const docMeta = DOC_TYPE_META[req.document_type] || DOC_TYPE_META.other
                    const DocIcon = docMeta.icon
                    const isBusy = isUpdatingFast === req.id

                    return (
                      <TableRow
                        key={req.id}
                        className="hover:bg-muted/40 transition-colors group border-b border-border/60"
                      >
                        {/* Tracking Reference Code */}
                        <TableCell className="align-middle">
                          <CopyTrackingCode code={req.control_number} />
                        </TableCell>

                        {/* Resident Info */}
                        <TableCell className="align-middle">
                          <div className="space-y-0.5">
                            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              <span>{req.resident_name}</span>
                            </div>
                            {req.phone ? (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3 text-primary/70" />
                                <span>{req.phone}</span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-muted-foreground/70 italic">No contact phone</p>
                            )}
                          </div>
                        </TableCell>

                        {/* Document Type with Icon */}
                        <TableCell className="align-middle whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 py-1 px-2 rounded-lg bg-muted/30 border border-border/50">
                            <DocIcon className={`h-4 w-4 shrink-0 ${docMeta.color}`} />
                            <span className="font-semibold text-xs text-foreground">{docMeta.label}</span>
                          </div>
                        </TableCell>

                        {/* Purpose & Remarks */}
                        <TableCell className="align-middle max-w-[200px]">
                          <div className="space-y-1">
                            <p className="text-xs text-foreground font-medium truncate" title={req.purpose || 'N/A'}>
                              {req.purpose || <span className="italic text-muted-foreground">No stated purpose</span>}
                            </p>
                            {req.notes && (
                              <p
                                className="text-[11px] text-muted-foreground italic truncate bg-muted/40 px-1.5 py-0.5 rounded border border-border/40"
                                title={req.notes}
                              >
                                Remarks: {req.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Jurisdiction */}
                        <TableCell className="align-middle">
                          <JurisdictionBadge barangay={req.barangay} />
                        </TableCell>

                        {/* Submitted Date */}
                        <TableCell className="align-middle whitespace-nowrap text-xs text-muted-foreground">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground">
                              {format(new Date(req.created_at), 'MMM d, yyyy')}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {format(new Date(req.created_at), 'h:mm a')}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="align-middle">
                          <StatusBadgeDisplay status={req.status} />
                        </TableCell>

                        {/* Actions (Min 44px touch targets) */}
                        <TableCell className="align-middle text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            {/* Digital Seal & Certificate Print Direct Trigger */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => openPrintModal(req)}
                              className="min-h-[44px] px-3.5 font-bold text-xs gap-1.5 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 shadow-2xs cursor-pointer touch-target shrink-0"
                              title="Print Official Certificate & Dry Seal"
                            >
                              <Printer className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                              <span className="hidden sm:inline">Stamp & Print</span>
                            </Button>

                            {/* 1-Click Fast Status Popover / Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={isBusy}
                                  className="min-h-[44px] min-w-[44px] px-3 font-semibold text-xs gap-1 cursor-pointer touch-target"
                                  title="1-Click Status Update"
                                >
                                  {isBusy ? (
                                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                                  ) : (
                                    <>
                                      <span>Status</span>
                                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                    </>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end" className="w-56 p-1">
                                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1.5">
                                  1-Click Status Update
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleFastStatusUpdate(req, 'in_review')}
                                  className="min-h-[40px] cursor-pointer gap-2 font-semibold text-xs"
                                >
                                  <FileCheck2 className="h-4 w-4 text-blue-600" />
                                  <span>Mark In Review</span>
                                  {req.status === 'in_review' && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleFastStatusUpdate(req, 'ready')}
                                  className="min-h-[40px] cursor-pointer gap-2 font-semibold text-xs"
                                >
                                  <Sparkles className="h-4 w-4 text-indigo-600" />
                                  <span>Mark Ready for Pickup</span>
                                  {req.status === 'ready' && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleFastStatusUpdate(req, 'completed')}
                                  className="min-h-[40px] cursor-pointer gap-2 font-semibold text-xs text-emerald-700 dark:text-emerald-400"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <span>Mark Released & Claimed</span>
                                  {req.status === 'completed' && (
                                    <Check className="h-3.5 w-3.5 ml-auto text-emerald-600" />
                                  )}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleFastStatusUpdate(req, 'rejected')}
                                  className="min-h-[40px] cursor-pointer gap-2 font-semibold text-xs text-rose-700 dark:text-rose-400"
                                >
                                  <XCircle className="h-4 w-4 text-rose-600" />
                                  <span>Mark as Rejected / Hold</span>
                                  {req.status === 'rejected' && <Check className="h-3.5 w-3.5 ml-auto text-rose-600" />}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => openEditModal(req)}
                                  className="min-h-[40px] cursor-pointer gap-2 font-bold text-xs text-primary"
                                >
                                  <Send className="h-4 w-4 text-primary" />
                                  <span>Custom Notes & Edit...</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Detailed Edit Modal Trigger */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => openEditModal(req)}
                              className="min-h-[44px] px-3 font-semibold text-xs text-foreground hover:bg-muted cursor-pointer touch-target shrink-0"
                            >
                              Edit
                            </Button>
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

      {/* Detailed Edit & Custom Notes Dialog */}
      <DetailedUpdateModal
        request={selectedEditRequest}
        open={detailedModalOpen}
        onOpenChange={setDetailedModalOpen}
        onSuccess={() => router.invalidate()}
      />

      {/* Official Certificate & Dry Seal Print Modal */}
      <CertificatePrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        request={selectedPrintRequest}
      />
    </div>
  )
}
