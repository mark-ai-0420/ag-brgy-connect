import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { PlusCircle, FileText, Store, Clock, CheckCircle, XCircle, AlertCircle, Info, ShieldAlert, Search, Gavel, Ban, EyeOff, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { CertificatePrintModal } from '#/components/documents/CertificatePrintModal'

const DOC_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance',
  barangay_id: 'Barangay ID',
  certificate_of_residency: 'Certificate of Residency',
  certificate_of_indigency: 'Certificate of Indigency',
  business_permit: 'Business Permit',
  other: 'Other Document',
}

const getMyDocumentRequests = createServerFn({ method: 'GET' })
  .handler(async () => {
  const { user } = await getAuthSession()
  if (!user) return []
  const supabase = createSupabaseServerClient()
  const [{ data: reqs }, { data: profile }] = await Promise.all([
    supabase.from('document_requests').select('id, document_type, status, purpose, notes, created_at, updated_at, requester_id').eq('requester_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ])
  const residentName = profile?.full_name || 'Resident'
  return (reqs ?? []).map(r => ({
    ...r,
    resident_name: residentName,
  }))
})

const getMyBusinesses = createServerFn({ method: 'GET' })
  .handler(async () => {
  const { user } = await getAuthSession()
  if (!user) return []
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('businesses')
    .select('id, name, category, address, status, created_at, notes')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
  return data ?? []
})

const getMyComplaints = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { user } = await getAuthSession()
    if (!user) return []
    const supabase = createSupabaseServerClient()
    const { data } = await supabase
      .from('complaints')
      .select('id, title, status, priority, location, created_at')
      .eq('complainant_id', user.id)
      .order('created_at', { ascending: false })
    return data ?? []
  })

export const Route = createFileRoute('/_authenticated/dashboard')({
  beforeLoad: async () => {
    const session = await getAuthSession()
    if (session.role === 'admin' || session.role === 'moderator') {
      throw redirect({ to: '/admin' })
    }
  },
  component: DashboardRoute,
  loader: async () => {
    const [documents, businesses, complaints] = await Promise.all([
      getMyDocumentRequests(),
      getMyBusinesses(),
      getMyComplaints()
    ])
    return { documents, businesses, complaints }
  },
})

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'pending'
  if (s === 'completed' || s === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 capitalize whitespace-nowrap">
        <CheckCircle className="h-3.5 w-3.5" /> {s === 'ready' ? 'Ready for Pickup' : 'Completed'}
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </span>
    )
  }
  if (s === 'in_review') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 whitespace-nowrap">
        <AlertCircle className="h-3.5 w-3.5" /> In Review
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5" /> Pending
    </span>
  )
}

function ComplaintStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'pending'
  if (s === 'investigating') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 whitespace-nowrap">
        <Search className="h-3.5 w-3.5" /> Under Investigation
      </span>
    )
  }
  if (s === 'scheduled_hearing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 whitespace-nowrap">
        <Gavel className="h-3.5 w-3.5" /> Hearing Scheduled
      </span>
    )
  }
  if (s === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
        <CheckCircle className="h-3.5 w-3.5" /> Resolved
      </span>
    )
  }
  if (s === 'dismissed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300 whitespace-nowrap">
        <Ban className="h-3.5 w-3.5" /> Dismissed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5" /> Pending Review
    </span>
  )
}

function BusinessStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'pending'
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
        <CheckCircle className="h-3.5 w-3.5" /> Approved
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </span>
    )
  }
  if (s === 'archived') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 whitespace-nowrap">
        <Info className="h-3.5 w-3.5" /> Archived
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5" /> Pending Review
    </span>
  )
}

function DashboardRoute() {
  const { documents, businesses, complaints } = Route.useLoaderData();
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resident Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your document requests and business listings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Requests */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Document Requests
            </h2>
            <Button asChild size="default" className="min-h-[44px] px-4 font-semibold">
              <Link to="/documents/request">
                <PlusCircle className="mr-2 h-4 w-4" /> Request Document
              </Link>
            </Button>
          </div>
          
          <div className="space-y-3">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground space-y-3">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="text-sm">You haven't requested any barangay documents yet.</p>
                  <Button variant="outline" size="sm" asChild className="min-h-[40px]">
                    <Link to="/documents/request">Submit First Request</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              documents.map(doc => (
                <Card key={doc.id} className="hover:border-primary/40 transition-colors">
                  <CardHeader className="py-4 px-5 pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-bold">
                          {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                        </CardTitle>
                        {doc.purpose && (
                          <CardDescription className="text-xs mt-0.5 line-clamp-2">{doc.purpose}</CardDescription>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Submitted {format(new Date(doc.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                  </CardHeader>
                  {doc.notes && (
                    <CardContent className="pt-0 pb-4 px-5">
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-600" />
                        <span><span className="font-semibold">Barangay Staff:</span> {doc.notes}</span>
                      </div>
                    </CardContent>
                  )}
                  {(doc.status === 'ready' || doc.status === 'completed') && (
                    <CardFooter className="pt-0 pb-4 px-5 flex justify-end">
                      <Button
                        size="sm"
                        className="min-h-[40px] px-4 font-semibold gap-2 bg-amber-700 hover:bg-amber-800 text-white"
                        onClick={() => {
                          setSelectedDoc(doc)
                          setPrintModalOpen(true)
                        }}
                      >
                        <Printer className="h-4 w-4" />
                        Download / Print Official Document
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Business Listings */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" /> My Businesses
            </h2>
            <Button asChild size="default" variant="outline" className="min-h-[44px] px-4 font-semibold">
              <Link to="/businesses/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Business
              </Link>
            </Button>
          </div>
          
          <div className="space-y-3">
            {businesses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground space-y-3">
                  <Store className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="text-sm">No business listings added under your account.</p>
                  <Button variant="outline" size="sm" asChild className="min-h-[40px]">
                    <Link to="/businesses/new">List Your Business</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              businesses.map(biz => (
                <Card key={biz.id} className="hover:border-primary/40 transition-colors">
                  <CardHeader className="py-4 px-5 pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-base font-bold">{biz.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{biz.category} • {biz.address}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <BusinessStatusBadge status={biz.status} />
                        <Button variant="outline" size="sm" asChild className="min-h-[32px] px-3 text-xs font-medium">
                          <Link to={`/businesses/${biz.id}/edit` as any}>Edit Listing</Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {biz.status === 'rejected' && biz.notes && (
                    <CardContent className="pt-0 pb-4 px-5">
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-600" />
                        <span><span className="font-semibold">Review Notes:</span> {biz.notes}</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Complaints */}
      <section className="space-y-4 mt-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> My Incident Reports & Complaints
          </h2>
          <div className="flex items-center gap-3">
            <Link to="/complaints" className="text-sm text-primary hover:underline font-medium">
              View All →
            </Link>
            <Button asChild size="default" variant="outline" className="min-h-[44px] px-4 font-semibold">
              <Link to="/complaints/new">
                <PlusCircle className="mr-2 h-4 w-4" /> File Complaint
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {complaints.length === 0 ? (
            <Card className="lg:col-span-2">
              <CardContent className="py-12 text-center text-muted-foreground space-y-3">
                <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-sm">You haven't filed any complaints or incident reports.</p>
                <Button variant="outline" size="sm" asChild className="min-h-[40px]">
                  <Link to="/complaints/new">File a Complaint</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            complaints.map((comp: any) => (
              <Card key={comp.id} className="hover:border-primary/40 transition-colors">
                <CardHeader className="py-4 px-5 pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold truncate">
                          <Link to="/complaints/$complaintId" params={{ complaintId: comp.id }} className="hover:text-primary hover:underline transition-colors">
                            {comp.title}
                          </Link>
                        </CardTitle>
                        {comp.is_anonymous && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <EyeOff className="h-3 w-3" /> Anonymous
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-1">
                        <span className="font-semibold">{comp.category}</span>
                        {comp.location && ` • ${comp.location}`}
                        {comp.incident_date && ` • ${format(new Date(comp.incident_date), 'MMM d, yyyy')}`}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Filed {format(new Date(comp.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <ComplaintStatusBadge status={comp.status} />
                  </div>
                </CardHeader>
                {comp.admin_notes && (
                  <CardContent className="pt-0 pb-4 px-5">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                      <span><span className="font-semibold">Staff Notes:</span> {comp.admin_notes}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </section>

      <CertificatePrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        request={selectedDoc}
      />
    </div>
  )
}
