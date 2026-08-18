import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { Badge } from '#/components/ui/badge'
import { toast } from 'sonner'
import { z } from 'zod'
import { format } from 'date-fns'
import { FileText, Filter, Printer } from 'lucide-react'
import { useState } from 'react'
import { CertificatePrintModal } from '#/components/documents/CertificatePrintModal'

const STATUSES = ['pending', 'in_review', 'ready', 'completed', 'rejected']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-300',
  in_review: 'bg-blue-100 text-blue-800 border border-blue-300',
  ready: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
  completed: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  rejected: 'bg-red-100 text-red-800 border border-red-300',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance',
  barangay_id: 'Barangay ID',
  certificate_of_residency: 'Certificate of Residency',
  certificate_of_indigency: 'Certificate of Indigency',
  business_permit: 'Business Permit',
  other: 'Other',
}

const getDocumentRequests = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('admin_scope').eq('id', user.id).single()
  const adminScope = profile?.admin_scope || 'daine_1'

  // Try relational embedding
  let query = supabase
    .from('document_requests')
    .select('id, requester_id, document_type, purpose, status, notes, created_at, barangay, profiles(full_name)')
    .order('created_at', { ascending: false })
    
  if (adminScope !== 'both') {
    query = query.eq('barangay', adminScope)
  }

  const { data: requests, error } = await query

  let mappedRequests: any[] = []
  if (!error && requests) {
    mappedRequests = requests.map(req => ({
      ...req,
      resident_name: (Array.isArray(req.profiles) ? (req.profiles[0] as any)?.full_name : (req.profiles as any)?.full_name) ?? 'Unknown Resident',
    }))
  } else {
    let fallbackQuery = supabase.from('document_requests').select('id, requester_id, document_type, purpose, status, notes, created_at, barangay').order('created_at', { ascending: false })
    if (adminScope !== 'both') fallbackQuery = fallbackQuery.eq('barangay', adminScope)
    const [{ data: reqs }, { data: profs }] = await Promise.all([
      fallbackQuery,
      supabase.from('profiles').select('id, full_name'),
    ])
    const profMap = new Map((profs ?? []).map(p => [p.id, p.full_name]))
    mappedRequests = (reqs ?? []).map(req => ({
      ...req,
      resident_name: profMap.get(req.requester_id) ?? 'Unknown Resident',
    }))
  }

  return { requests: mappedRequests, adminScope }
})

const updateRequestStatus = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string(), status: z.enum(['pending', 'in_review', 'ready', 'completed', 'rejected']), notes: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('document_requests')
      .update({ status: data.status, notes: data.notes, updated_at: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/documents')({
  component: AdminDocumentsRoute,
  loader: () => getDocumentRequests(),
})

type Request = Awaited<ReturnType<typeof getDocumentRequests>>['requests'][number]

function UpdateStatusDialog({ request, onSuccess }: { request: Request; onSuccess: () => void }) {
  const [status, setStatus] = useState(request.status)
  const [notes, setNotes] = useState(request.notes ?? '')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      await updateRequestStatus({ data: { id: request.id, status, notes } })
      toast.success('Request updated successfully')
      setOpen(false)
      onSuccess()
    } catch {
      toast.error('Failed to update request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="min-h-[40px] px-4 font-medium">Update</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Document Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-0.5">Resident</p>
              <p className="font-semibold">{request.resident_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Document</p>
              <p className="font-semibold">{DOC_TYPE_LABELS[request.document_type] ?? request.document_type}</p>
            </div>
            {request.purpose && (
              <div className="col-span-2">
                <p className="text-muted-foreground mb-0.5">Purpose</p>
                <p className="font-medium">{request.purpose}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-1.5">Update Status</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="min-h-[40px]">
                    <span className="capitalize">{s.replace(/_/g, ' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium mb-1.5">Notes for Resident</p>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="resize-none text-sm min-h-[90px]"
              placeholder="Add pickup instructions, requirements, or any remarks..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" className="min-h-[44px] px-4" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="min-h-[44px] px-5 font-semibold">
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AdminDocumentsRoute() {
  const { requests, adminScope } = Route.useLoaderData()
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [barangayFilter, setBarangayFilter] = useState<string>('all')
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [selectedPrintRequest, setSelectedPrintRequest] = useState<Request | null>(null)

  const filtered = requests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (adminScope === 'both' && barangayFilter !== 'all' && r.barangay !== barangayFilter) return false;
    return true;
  })

  const counts: Record<string, number> = { all: filtered.length }
  STATUSES.forEach(s => { counts[s] = filtered.filter(r => r.status === s).length })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and update resident document request statuses.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-amber-500" />
          <span className="text-amber-600">{counts['pending'] ?? 0} pending</span>
          <span className="text-muted-foreground">•</span>
          <span>{requests.length} total</span>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {['all', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors min-h-[32px] ${
                filterStatus === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {s.replace(/_/g, ' ')} {counts[s] !== undefined ? `(${counts[s]})` : ''}
            </button>
          ))}
        </div>
        
        {adminScope === 'both' && (
          <div className="flex bg-muted p-1 rounded-lg shrink-0">
            {['all', 'daine_1', 'daine_2'].map(b => (
              <button
                key={b}
                onClick={() => setBarangayFilter(b)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  barangayFilter === b
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {b === 'all' ? 'All Units' : b === 'daine_1' ? 'Daine 1' : 'Daine 2'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-5">
          <CardTitle className="text-base font-semibold">
            {filterStatus === 'all' ? 'All Requests' : `${filterStatus.replace(/_/g, ' ')} Requests`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm">No {filterStatus !== 'all' ? filterStatus.replace(/_/g, ' ') + ' ' : ''}requests found.</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.map(req => (
                  <TableRow key={req.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-sm whitespace-nowrap">
                      {req.resident_name}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {DOC_TYPE_LABELS[req.document_type] ?? req.document_type}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {req.purpose ?? <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(req.created_at), 'MMM d, yyyy')}
                      {adminScope === 'both' && req.barangay && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-md bg-muted text-[10px] uppercase font-semibold">
                          {req.barangay === 'daine_1' ? 'Daine 1' : 'Daine 2'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize whitespace-nowrap ${STATUS_COLORS[req.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {req.status?.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {req.notes ?? <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(req.status === 'ready' || req.status === 'completed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[40px] px-3 font-medium text-amber-900 border-amber-300 hover:bg-amber-50"
                            onClick={() => {
                              setSelectedPrintRequest(req)
                              setPrintModalOpen(true)
                            }}
                          >
                            <Printer className="h-4 w-4 mr-1.5" />
                            Print
                          </Button>
                        )}
                        <UpdateStatusDialog request={req} onSuccess={() => router.invalidate()} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CertificatePrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        request={selectedPrintRequest}
      />
    </div>
  )
}
