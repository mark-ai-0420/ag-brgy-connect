import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import {
  PlusCircle,
  FileText,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ShieldAlert,
  Search,
  Gavel,
  Ban,
  EyeOff,
  Printer,
  ExternalLink,
  Building2,
  Sparkles,
  Edit,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { CertificatePrintModal } from '#/components/documents/CertificatePrintModal'
import { DigitalResidentID } from '#/components/resident/DigitalResidentID'

type DocFilterType = 'all' | 'active' | 'ready' | 'completed'

const DOC_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance',
  barangay_id: 'Barangay ID',
  certificate_of_residency: 'Certificate of Residency',
  certificate_of_indigency: 'Certificate of Indigency',
  business_permit: 'Business Permit',
  other: 'Other Document',
}

const getMyResidentProfile = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { user } = await getAuthSession()
    if (!user) return null
    const supabase = createSupabaseServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, purok, barangay, avatar_url, phone, address, created_at, email')
      .eq('id', user.id)
      .maybeSingle()

    return profile || {
      id: user.id,
      full_name: (user.user_metadata as any)?.full_name || 'Resident',
      barangay: 'daine_1',
      purok: null,
      avatar_url: null,
      phone: null,
      address: null,
      created_at: new Date().toISOString(),
      email: user.email,
    }
  })

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
    .select('id, name, category, address, barangay, purok, phone, messenger_link, photo_url, status, created_at, notes')
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
      .select('id, title, status, priority, location, created_at, category, incident_date, is_anonymous, admin_notes')
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
    const [documents, businesses, complaints, profile] = await Promise.all([
      getMyDocumentRequests(),
      getMyBusinesses(),
      getMyComplaints(),
      getMyResidentProfile(),
    ])
    return { documents, businesses, complaints, profile }
  },
})

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'pending'
  if (s === 'completed' || s === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 capitalize whitespace-nowrap">
        <CheckCircle className="h-3.5 w-3.5" /> {s === 'ready' ? 'Ready for Pickup' : 'Completed'}
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-rose-950/80 dark:text-rose-300 border border-red-300 dark:border-rose-800 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </span>
    )
  }
  if (s === 'in_review') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 whitespace-nowrap">
        <AlertCircle className="h-3.5 w-3.5" /> In Review
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5" /> Pending
    </span>
  )
}

function ComplaintStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'pending'
  if (s === 'investigating') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 whitespace-nowrap">
        <Search className="h-3.5 w-3.5" /> Under Investigation
      </span>
    )
  }
  if (s === 'scheduled_hearing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800 whitespace-nowrap">
        <Gavel className="h-3.5 w-3.5" /> Hearing Scheduled
      </span>
    )
  }
  if (s === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">
        <CheckCircle className="h-3.5 w-3.5" /> Resolved
      </span>
    )
  }
  if (s === 'dismissed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300 border border-gray-300 dark:border-slate-700 whitespace-nowrap">
        <Ban className="h-3.5 w-3.5" /> Dismissed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5" /> Pending Review
    </span>
  )
}

function BusinessStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'pending'
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 whitespace-nowrap shadow-2xs">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Approved
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 whitespace-nowrap shadow-2xs">
        <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Rejected
      </span>
    )
  }
  if (s === 'archived') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
        <Info className="h-3.5 w-3.5" /> Archived
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap shadow-2xs">
      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Pending Review
    </span>
  )
}

function DashboardRoute() {
  const { documents, businesses, complaints, profile } = Route.useLoaderData();
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [docFilter, setDocFilter] = useState<DocFilterType>('all');

  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  const handlePhotoUpdated = (newUrl: string) => {
    setCurrentProfile((prev: any) => (prev ? { ...prev, avatar_url: newUrl } : prev));
    router.invalidate();
  };

  // Metrics for Document Requests
  const readyDocsCount = useMemo(
    () => documents.filter(d => d.status === 'ready').length,
    [documents]
  );
  const activeDocsCount = useMemo(
    () => documents.filter(d => d.status === 'pending' || d.status === 'in_review' || d.status === 'processing').length,
    [documents]
  );
  const completedDocsCount = useMemo(
    () => documents.filter(d => d.status === 'completed').length,
    [documents]
  );

  // Metrics for Businesses
  const approvedBizCount = useMemo(
    () => businesses.filter(b => b.status === 'approved').length,
    [businesses]
  );
  const pendingBizCount = useMemo(
    () => businesses.filter(b => b.status === 'pending' || !b.status).length,
    [businesses]
  );

  // Metrics for Complaints
  const pendingComplaintsCount = useMemo(
    () => complaints.filter(c => c.status === 'pending' || c.status === 'investigating' || c.status === 'scheduled_hearing' || !c.status).length,
    [complaints]
  );
  const resolvedComplaintsCount = useMemo(
    () => complaints.filter(c => c.status === 'resolved').length,
    [complaints]
  );

  // Reactive Document Filtering
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (docFilter === 'all') return true;
      if (docFilter === 'active') {
        return doc.status === 'pending' || doc.status === 'in_review' || doc.status === 'processing';
      }
      if (docFilter === 'ready') {
        return doc.status === 'ready';
      }
      if (docFilter === 'completed') {
        return doc.status === 'completed';
      }
      return true;
    });
  }, [documents, docFilter]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resident Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Official citizen ID, document requests, business listings, and barangay services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="min-h-[38px] text-xs font-semibold">
            <Link to="/settings/profile">Edit Profile & Address</Link>
          </Button>
          <Button asChild size="sm" className="min-h-[38px] text-xs font-bold bg-primary">
            <Link to="/documents/request">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Request Document
            </Link>
          </Button>
        </div>
      </div>

      {/* 3 Citizen KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI Card 1: Document Requests */}
        <a
          href="#document-requests"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('document-requests');
          }}
          className="group block text-left focus:outline-hidden"
        >
          <Card className="h-full border border-border/80 shadow-2xs hover:shadow-md hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Document Requests</h3>
                    <p className="text-xs text-muted-foreground">Barangay Certifications</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>

              <div>
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {documents.length}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {readyDocsCount} Ready for Pickup
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="text-muted-foreground">
                    {activeDocsCount} In Progress
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </a>

        {/* KPI Card 2: My Registered Businesses */}
        <a
          href="#my-businesses"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('my-businesses');
          }}
          className="group block text-left focus:outline-hidden"
        >
          <Card className="h-full border border-border/80 shadow-2xs hover:shadow-md hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">My Registered Businesses</h3>
                    <p className="text-xs text-muted-foreground">Local MSME Growth Hub</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>

              <div>
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {businesses.length}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {approvedBizCount} Verified Active
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="text-muted-foreground">
                    {pendingBizCount} Pending
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </a>

        {/* KPI Card 3: Filed Incident Reports */}
        <a
          href="#incident-reports"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('incident-reports');
          }}
          className="group block text-left focus:outline-hidden"
        >
          <Card className="h-full border border-border/80 shadow-2xs hover:shadow-md hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Filed Incident Reports</h3>
                    <p className="text-xs text-muted-foreground">Peace & Order Desk</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>

              <div>
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {complaints.length}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {pendingComplaintsCount} Under Review
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="text-muted-foreground">
                    {resolvedComplaintsCount} Resolved
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* Prominent Digital Resident ID Card */}
      {currentProfile && (
        <section className="space-y-3">
          <DigitalResidentID
            profile={currentProfile}
            onPhotoUpdated={handlePhotoUpdated}
          />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Requests */}
        <section id="document-requests" className="space-y-4 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Document Requests
            </h2>
            <Button asChild size="default" className="min-h-[44px] px-4 font-semibold shrink-0">
              <Link to="/documents/request">
                <PlusCircle className="mr-2 h-4 w-4" /> Request Document
              </Link>
            </Button>
          </div>

          {/* Segmented Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setDocFilter('all')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer",
                docFilter === 'all'
                  ? "bg-background text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              All
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  docFilter === 'all'
                    ? "bg-primary/15 text-primary font-bold"
                    : "bg-muted-foreground/15 text-muted-foreground"
                )}
              >
                {documents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDocFilter('active')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer",
                docFilter === 'active'
                  ? "bg-background text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              In Progress
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  docFilter === 'active'
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold"
                    : "bg-muted-foreground/15 text-muted-foreground"
                )}
              >
                {activeDocsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDocFilter('ready')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer",
                docFilter === 'ready'
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 shadow-xs font-bold"
                  : "text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/5"
              )}
            >
              Ready for Pickup
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  readyDocsCount > 0
                    ? "bg-emerald-600 text-white font-bold"
                    : docFilter === 'ready'
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                      : "bg-muted-foreground/15 text-muted-foreground"
                )}
              >
                {readyDocsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDocFilter('completed')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer",
                docFilter === 'completed'
                  ? "bg-background text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              Completed
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  docFilter === 'completed'
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                    : "bg-muted-foreground/15 text-muted-foreground"
                )}
              >
                {completedDocsCount}
              </span>
            </button>
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
            ) : filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground space-y-3">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm">
                    No {docFilter === 'active' ? 'in-progress' : docFilter === 'ready' ? 'ready for pickup' : docFilter === 'completed' ? 'completed' : ''} document requests found.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDocFilter('all')}
                    className="min-h-[36px] text-xs font-semibold text-primary"
                  >
                    View All Document Requests ({documents.length})
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map(doc => {
                const isReady = doc.status === 'ready'
                return (
                  <Card
                    key={doc.id}
                    className={cn(
                      "transition-all shadow-xs overflow-hidden",
                      isReady
                        ? "border-emerald-500/40 dark:border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20"
                        : "hover:border-primary/40"
                    )}
                  >
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

                    {/* Staff Notes */}
                    {doc.notes && (
                      <CardContent className="pt-0 pb-3 px-5">
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                          <span><span className="font-semibold">Barangay Staff:</span> {doc.notes}</span>
                        </div>
                      </CardContent>
                    )}

                    {/* Ready for Pickup Banner */}
                    {isReady && (
                      <CardContent className="pt-0 pb-3 px-5">
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 text-xs text-emerald-950 dark:text-emerald-200">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Your official certificate has been signed & is ready for pickup or immediate digital printing!</span>
                        </div>
                      </CardContent>
                    )}

                    {/* Download / Print Actions */}
                    {(doc.status === 'ready' || doc.status === 'completed') && (
                      <CardFooter
                        className={cn(
                          "pt-2 pb-4 px-5 flex items-center justify-between border-t",
                          isReady
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-muted/10 border-border/60"
                        )}
                      >
                        <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                          {isReady ? (
                            <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Official document ready
                            </span>
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-emerald-600" /> Completed request
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className={cn(
                            "min-h-[40px] px-4 font-bold gap-2 shadow-xs cursor-pointer",
                            isReady
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-primary hover:bg-primary/90 text-primary-foreground"
                          )}
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
                )
              })
            )}
          </div>
        </section>

        {/* My Registered Businesses (MSME Growth Hub) */}
        <section id="my-businesses" className="space-y-4 scroll-mt-20">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" /> My Registered Businesses
            </h2>
            <Button asChild size="default" className="min-h-[44px] px-4 font-semibold shadow-xs gap-1.5">
              <Link to="/businesses/new">
                <PlusCircle className="h-4 w-4" /> Register New Business
              </Link>
            </Button>
          </div>
          
          <div className="space-y-4">
            {businesses.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-10 px-6 text-center space-y-4">
                  <div className="p-4 bg-primary/10 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center text-primary">
                    <Store className="h-7 w-7" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="font-bold text-base text-foreground">No Registered Businesses Yet</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed">
                      Promote your sari-sari store, carinderia, water station, or local service across Barangay Daine 1 & 2 for free. Get verified and discovered by your neighbors!
                    </p>
                  </div>
                  <Button asChild className="min-h-[44px] px-5 font-semibold">
                    <Link to="/businesses/new">
                      <Sparkles className="mr-2 h-4 w-4 text-amber-300" /> Register / List Your Business Free
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              businesses.map(biz => {
                const isDaine2 = biz.barangay === 'daine_2'
                return (
                  <Card key={biz.id} className="hover:border-primary/40 transition-all shadow-xs overflow-hidden">
                    <CardHeader className="py-4 px-5 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {biz.photo_url ? (
                            <img
                              src={biz.photo_url}
                              alt={biz.name}
                              className="w-14 h-14 rounded-xl object-cover border shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0 border text-muted-foreground">
                              <Store className="h-6 w-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <CardTitle className="text-base font-bold truncate leading-tight">
                              {biz.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">{biz.category}</span>
                              <span>•</span>
                              <span className={`inline-flex items-center gap-0.5 font-semibold text-[10px] px-2 py-0.2 rounded-full ${
                                isDaine2 
                                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300' 
                                  : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                <Building2 className="h-2.5 w-2.5" />
                                {isDaine2 ? 'Daine 2' : 'Daine 1'}
                              </span>
                              {biz.purok && (
                                <>
                                  <span>•</span>
                                  <span>{biz.purok}</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground/70 mt-1 truncate max-w-sm">
                              {biz.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <BusinessStatusBadge status={biz.status} />
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(biz.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Status Notice / Feedback Banner */}
                    {biz.status === 'approved' && (
                      <CardContent className="pt-0 pb-3 px-5">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
                          <span className="flex items-center gap-1.5 font-medium">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Live on Barangay Daine Directory
                          </span>
                          <Link
                            to="/directory/$businessId"
                            params={{ businessId: biz.id }}
                            className="text-emerald-700 dark:text-emerald-300 hover:underline font-bold inline-flex items-center gap-0.5"
                          >
                            View Listing <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </CardContent>
                    )}

                    {biz.status === 'pending' && (
                      <CardContent className="pt-0 pb-3 px-5">
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                          <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Under barangay review. Once verified by officials, your listing will become publicly visible.</span>
                        </div>
                      </CardContent>
                    )}

                    {biz.status === 'rejected' && biz.notes && (
                      <CardContent className="pt-0 pb-3 px-5">
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-600" />
                          <span><span className="font-semibold">Review Notes:</span> {biz.notes}</span>
                        </div>
                      </CardContent>
                    )}

                    {/* Footer Actions */}
                    <CardFooter className="pt-2 pb-4 px-5 flex items-center justify-end gap-2.5 border-t bg-muted/10">
                      {biz.status === 'approved' && (
                        <Button variant="ghost" size="sm" asChild className="min-h-[36px] px-3 text-xs font-semibold text-primary">
                          <Link to="/directory/$businessId" params={{ businessId: biz.id }}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1" /> View Public Card
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild className="min-h-[36px] px-3.5 text-xs font-semibold gap-1">
                        <Link to={`/businesses/${biz.id}/edit` as any}>
                          <Edit className="h-3.5 w-3.5" /> Edit Business
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })
            )}
          </div>
        </section>
      </div>

      {/* Complaints / Incident Reports */}
      <section id="incident-reports" className="space-y-4 mt-8 scroll-mt-20">
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
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
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
