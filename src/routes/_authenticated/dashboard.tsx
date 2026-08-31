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
  CheckCircle2,
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
  ArrowRight,
  FileCheck,
  UserCheck,
  MapPin,
  Flame,
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
  business_permit: 'Barangay Business Permit',
  other: 'Barangay Certificate',
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
  if (s === 'ready') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs animate-pulse whitespace-nowrap">
        <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        Ready for Pickup
      </span>
    )
  }
  if (s === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        Completed
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        Rejected
      </span>
    )
  }
  if (s === 'in_review' || s === 'processing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 whitespace-nowrap">
        <AlertCircle className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
        In Review
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      Pending Review
    </span>
  )
}

function ComplaintStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'pending'
  if (s === 'investigating') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 whitespace-nowrap">
        <Search className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
        Under Investigation
      </span>
    )
  }
  if (s === 'scheduled_hearing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800 whitespace-nowrap">
        <Gavel className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
        Hearing Scheduled
      </span>
    )
  }
  if (s === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        Resolved
      </span>
    )
  }
  if (s === 'dismissed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
        <Ban className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        Dismissed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
      Pending Review
    </span>
  )
}

function BusinessStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'pending'
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 whitespace-nowrap shadow-2xs">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        Verified & Live
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 whitespace-nowrap shadow-2xs">
        <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        Needs Action
      </span>
    )
  }
  if (s === 'archived') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
        <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        Archived
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap shadow-2xs">
      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      Pending Review
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
  const readyDocs = useMemo(
    () => documents.filter(d => d.status === 'ready'),
    [documents]
  );
  const readyDocsCount = readyDocs.length;
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

  const isDaine2 = currentProfile?.barangay === 'daine_2';
  const barangayLabel = isDaine2 ? 'Barangay Daine 2' : 'Barangay Daine 1';

  return (
    <div className="container mx-auto py-8 sm:py-10 px-4 sm:px-6 md:px-8 space-y-8 max-w-6xl">
      {/* Stitch Civic Horizon Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8 shadow-sm">
        {/* Philippine Flag Subtle Civic Accent Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          <div className="w-[45%] bg-[#0038A8]" />
          <div className="w-[10%] bg-[#FCD116]" />
          <div className="w-[45%] bg-[#CE1126]" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pt-1">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Civic Citizen Portal • {barangayLabel}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Mabuhay, {currentProfile?.full_name?.split(' ')[0] || 'Resident'}!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Access your official digital ID, fast-track barangay clearances and certifications, manage registered MSMEs, and file peace & order reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              asChild
              variant="outline"
              size="default"
              className="min-h-[44px] px-4 rounded-xl text-sm font-semibold border-border/80 hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <Link to="/settings/profile">
                <UserCheck className="mr-2 h-4 w-4 text-primary" />
                Profile & Address
              </Link>
            </Button>
            <Button
              asChild
              size="default"
              className="min-h-[44px] px-5 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-200 cursor-pointer"
            >
              <Link to="/documents/request">
                <PlusCircle className="mr-2 h-4 w-4" />
                Request Document
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 3 Citizen KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI Card 1: Document Requests */}
        <a
          href="#document-requests"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('document-requests');
          }}
          className="group block text-left focus:outline-hidden"
        >
          <Card className="h-full rounded-2xl border border-border/80 shadow-xs hover:shadow-lg hover:border-sky-500/50 dark:hover:border-sky-400/50 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-sky-500/5">
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-sky-500/10 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      Document Requests
                    </h3>
                    <p className="text-xs text-muted-foreground">Barangay Certifications</p>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-muted/60 group-hover:bg-sky-500/10 text-muted-foreground group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                  {documents.length}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {readyDocsCount > 0 ? (
                    <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      {readyDocsCount} Ready for Pickup
                    </span>
                  ) : (
                    <span className="font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-muted/40">
                      0 Ready
                    </span>
                  )}
                  <span className="text-muted-foreground/60">•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md bg-sky-500/10">
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
          <Card className="h-full rounded-2xl border border-border/80 shadow-xs hover:shadow-lg hover:border-amber-500/50 dark:hover:border-amber-400/50 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-amber-500/5">
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      My Businesses
                    </h3>
                    <p className="text-xs text-muted-foreground">MSME Growth & Directory</p>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-muted/60 group-hover:bg-amber-500/10 text-muted-foreground group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                  {businesses.length}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    {approvedBizCount} Verified Active
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md bg-amber-500/10">
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
          <Card className="h-full rounded-2xl border border-border/80 shadow-xs hover:shadow-lg hover:border-rose-500/50 dark:hover:border-rose-400/50 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-rose-500/5">
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      Incident Reports
                    </h3>
                    <p className="text-xs text-muted-foreground">Peace & Order Desk</p>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-muted/60 group-hover:bg-rose-500/10 text-muted-foreground group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                  {complaints.length}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                    <Clock className="h-3 w-3 text-amber-600" />
                    {pendingComplaintsCount} Active Review
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-500/10">
                    {resolvedComplaintsCount} Resolved
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* Holographic Digital Resident ID Section */}
      {currentProfile && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Digital Resident Identity Card
            </h2>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Secured with Cryptographic QR Verification
            </div>
          </div>
          <DigitalResidentID
            profile={currentProfile}
            onPhotoUpdated={handlePhotoUpdated}
          />
        </section>
      )}

      {/* Main Grid: Document Requests & MSME Businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Requests Section */}
        <section id="document-requests" className="space-y-5 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Document Requests
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official certificates & clearances processed by the barangay
              </p>
            </div>
            <Button
              asChild
              size="default"
              className="min-h-[44px] px-4 font-bold rounded-xl shrink-0 cursor-pointer shadow-xs"
            >
              <Link to="/documents/request">
                <PlusCircle className="mr-2 h-4 w-4" />
                Request Document
              </Link>
            </Button>
          </div>

          {/* Highlighted Ready for Pickup Print Action Card */}
          {readyDocs.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-card p-5 sm:p-6 shadow-md ring-1 ring-emerald-500/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    Action Required • Ready for Pickup
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {DOC_TYPE_LABELS[readyDocs[0].document_type] ?? readyDocs[0].document_type}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                    Your official document has been validated and digitally signed. You may download and print the high-resolution certificate now or pick up the printed copy at the Barangay Hall.
                  </p>
                </div>

                <Button
                  size="default"
                  onClick={() => {
                    setSelectedDoc(readyDocs[0]);
                    setPrintModalOpen(true);
                  }}
                  className="min-h-[44px] px-5 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all duration-200 gap-2 shrink-0 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Print / Download Certificate
                </Button>
              </div>
            </div>
          )}

          {/* Segmented Document Filter Tabs (Touch Target Compliant min-h 44px) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-muted/60 dark:bg-muted/30 rounded-2xl border border-border/60">
            <button
              type="button"
              onClick={() => setDocFilter('all')}
              className={cn(
                "min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold cursor-pointer",
                docFilter === 'all'
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              All Requests
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-extrabold",
                  docFilter === 'all'
                    ? "bg-primary/15 text-primary"
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
                "min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold cursor-pointer",
                docFilter === 'active'
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              In Progress
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-extrabold",
                  docFilter === 'active'
                    ? "bg-sky-500/20 text-sky-700 dark:text-sky-300"
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
                "min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold cursor-pointer",
                docFilter === 'ready'
                  ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 shadow-xs"
                  : "text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10"
              )}
            >
              Ready
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-extrabold",
                  readyDocsCount > 0
                    ? "bg-emerald-600 text-white"
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
                "min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold cursor-pointer",
                docFilter === 'completed'
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              Completed
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-extrabold",
                  docFilter === 'completed'
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted-foreground/15 text-muted-foreground"
                )}
              >
                {completedDocsCount}
              </span>
            </button>
          </div>
          
          {/* Document Requests List */}
          <div className="space-y-4">
            {documents.length === 0 ? (
              <Card className="rounded-2xl border border-dashed border-border/80">
                <CardContent className="py-12 text-center text-muted-foreground space-y-4">
                  <div className="p-3.5 rounded-2xl bg-primary/10 text-primary w-14 h-14 mx-auto flex items-center justify-center">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-foreground">No Document Requests Yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Need a Barangay Clearance, Certificate of Residency, or Indigency? Apply digitally in under 2 minutes.
                    </p>
                  </div>
                  <Button variant="default" size="default" asChild className="min-h-[44px] px-5 rounded-xl font-bold">
                    <Link to="/documents/request">Submit First Request</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : filteredDocuments.length === 0 ? (
              <Card className="rounded-2xl border border-border/80">
                <CardContent className="py-10 text-center text-muted-foreground space-y-3">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm font-medium">
                    No {docFilter === 'active' ? 'in-progress' : docFilter === 'ready' ? 'ready for pickup' : docFilter === 'completed' ? 'completed' : ''} document requests found.
                  </p>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setDocFilter('all')}
                    className="min-h-[44px] px-4 rounded-xl text-xs font-semibold cursor-pointer"
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
                      "rounded-2xl transition-all duration-200 shadow-xs overflow-hidden border",
                      isReady
                        ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                        : "border-border/80 hover:border-primary/40 hover:bg-muted/15"
                    )}
                  >
                    <CardHeader className="py-4 px-5 pb-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <CardTitle className="text-base font-bold text-foreground">
                            {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                          </CardTitle>
                          {doc.purpose && (
                            <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                              {doc.purpose}
                            </CardDescription>
                          )}
                          <p className="text-[11px] text-muted-foreground/80">
                            Submitted {format(new Date(doc.created_at), 'MMMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>
                    </CardHeader>

                    {/* Staff Notes */}
                    {doc.notes && (
                      <CardContent className="pt-0 pb-3 px-5">
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-950 dark:text-sky-200">
                          <Info className="h-4 w-4 mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
                          <div>
                            <span className="font-bold">Barangay Secretariat Note:</span> {doc.notes}
                          </div>
                        </div>
                      </CardContent>
                    )}

                    {/* Ready for Pickup Banner */}
                    {isReady && (
                      <CardContent className="pt-0 pb-3 px-5">
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200">
                          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-medium leading-relaxed">
                            Official certificate has been verified & approved. Digital copy ready for instant high-res printing!
                          </span>
                        </div>
                      </CardContent>
                    )}

                    {/* Download / Print Actions */}
                    {(doc.status === 'ready' || doc.status === 'completed') && (
                      <CardFooter
                        className={cn(
                          "pt-3 pb-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t",
                          isReady
                            ? "bg-emerald-500/10 border-emerald-500/20"
                            : "bg-muted/10 border-border/60"
                        )}
                      >
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          {isReady ? (
                            <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Official Document Ready
                            </span>
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Completed Record
                            </span>
                          )}
                        </div>
                        <Button
                          size="default"
                          className={cn(
                            "min-h-[44px] px-5 rounded-xl font-bold gap-2 shadow-xs cursor-pointer w-full sm:w-auto",
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
                          Download / Print Certificate
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
        <section id="my-businesses" className="space-y-5 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                My Registered Businesses
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your local sari-sari store, carinderia, or services
              </p>
            </div>
            <Button
              asChild
              size="default"
              className="min-h-[44px] px-4 font-bold rounded-xl shadow-xs gap-2 shrink-0 cursor-pointer"
            >
              <Link to="/businesses/new">
                <PlusCircle className="h-4 w-4" />
                Register New Business
              </Link>
            </Button>
          </div>
          
          <div className="space-y-4">
            {businesses.length === 0 ? (
              <Card className="rounded-2xl border-2 border-dashed border-border/80">
                <CardContent className="py-12 px-6 text-center space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-14 h-14 mx-auto flex items-center justify-center">
                    <Store className="h-7 w-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-bold text-base text-foreground">No Registered Businesses Yet</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      Promote your sari-sari store, carinderia, water station, or local service across Barangay Daine 1 & 2 for free. Get verified and discovered by your neighbors!
                    </p>
                  </div>
                  <Button asChild size="default" className="min-h-[44px] px-6 rounded-xl font-bold bg-primary hover:bg-primary/90">
                    <Link to="/businesses/new">
                      <Sparkles className="mr-2 h-4 w-4 text-amber-300" /> Register / List Your Business Free
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              businesses.map(biz => {
                const isBizDaine2 = biz.barangay === 'daine_2'
                return (
                  <Card key={biz.id} className="rounded-2xl border border-border/80 hover:border-primary/40 transition-all shadow-xs overflow-hidden">
                    <CardHeader className="py-4 px-5 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {biz.photo_url ? (
                            <img
                              src={biz.photo_url}
                              alt={biz.name}
                              className="w-14 h-14 rounded-2xl object-cover border border-border/80 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center shrink-0 border border-border/60 text-muted-foreground">
                              <Store className="h-6 w-6" />
                            </div>
                          )}
                          <div className="min-w-0 space-y-0.5">
                            <CardTitle className="text-base font-bold truncate text-foreground">
                              {biz.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">{biz.category}</span>
                              <span>•</span>
                              <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                                isBizDaine2 
                                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300' 
                                  : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                <Building2 className="h-2.5 w-2.5" />
                                {isBizDaine2 ? 'Daine 2' : 'Daine 1'}
                              </span>
                              {biz.purok && (
                                <>
                                  <span>•</span>
                                  <span>{biz.purok}</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground/70 truncate max-w-sm">
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
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Live on Barangay Daine Directory
                          </span>
                          <Link
                            to="/directory/$businessId"
                            params={{ businessId: biz.id }}
                            className="min-h-[32px] inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 hover:underline font-bold"
                          >
                            View Listing <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </CardContent>
                    )}

                    {biz.status === 'pending' && (
                      <CardContent className="pt-0 pb-3 px-5">
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>Under barangay review. Once verified by officials, your listing will become publicly visible.</span>
                        </div>
                      </CardContent>
                    )}

                    {biz.status === 'rejected' && biz.notes && (
                      <CardContent className="pt-0 pb-3 px-5">
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
                          <div>
                            <span className="font-bold">Review Notes:</span> {biz.notes}
                          </div>
                        </div>
                      </CardContent>
                    )}

                    {/* Footer Actions (Compliant 44px min-height touch targets) */}
                    <CardFooter className="pt-3 pb-4 px-5 flex items-center justify-end gap-2.5 border-t border-border/60 bg-muted/10">
                      {biz.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="default"
                          asChild
                          className="min-h-[44px] px-4 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          <Link to="/directory/$businessId" params={{ businessId: biz.id }}>
                            <ExternalLink className="h-4 w-4 mr-1.5" /> View Public Card
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="default"
                        asChild
                        className="min-h-[44px] px-4 rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:bg-muted/80 cursor-pointer"
                      >
                        <Link to={`/businesses/${biz.id}/edit` as any}>
                          <Edit className="h-4 w-4" /> Edit Business
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

      {/* Complaints / Peace & Order Reports Section */}
      <section id="incident-reports" className="space-y-5 pt-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              My Incident Reports & Peace & Order
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Secure blotter tickets, mediation records, and incident reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/complaints"
              className="min-h-[44px] inline-flex items-center text-sm text-primary hover:underline font-bold px-2"
            >
              View All Complaints →
            </Link>
            <Button
              asChild
              size="default"
              variant="outline"
              className="min-h-[44px] px-4 font-bold rounded-xl border-border/80 hover:bg-muted/80 cursor-pointer"
            >
              <Link to="/complaints/new">
                <PlusCircle className="mr-2 h-4 w-4" /> File Incident Report
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {complaints.length === 0 ? (
            <Card className="lg:col-span-2 rounded-2xl border border-dashed border-border/80">
              <CardContent className="py-12 text-center text-muted-foreground space-y-4">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 w-14 h-14 mx-auto flex items-center justify-center">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-foreground">No Incident Reports Filed</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Report local disturbances, disputes, or security concerns directly to the Lupon Tagapamayapa & Barangay Tanod.
                  </p>
                </div>
                <Button variant="outline" size="default" asChild className="min-h-[44px] px-5 rounded-xl font-bold">
                  <Link to="/complaints/new">File an Incident Report</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            complaints.map((comp: any) => (
              <Card key={comp.id} className="rounded-2xl border border-border/80 hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="py-4 px-5 pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold truncate">
                          <Link
                            to="/complaints/$complaintId"
                            params={{ complaintId: comp.id }}
                            className="hover:text-primary hover:underline transition-colors min-h-[32px] inline-flex items-center"
                          >
                            {comp.title}
                          </Link>
                        </CardTitle>
                        {comp.is_anonymous && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <EyeOff className="h-3 w-3" /> Anonymous
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-foreground">{comp.category}</span>
                        {comp.location && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {comp.location}
                            </span>
                          </>
                        )}
                        {comp.incident_date && (
                          <>
                            <span>•</span>
                            <span>{format(new Date(comp.incident_date), 'MMM d, yyyy')}</span>
                          </>
                        )}
                      </CardDescription>
                      <p className="text-[11px] text-muted-foreground/70">
                        Filed on {format(new Date(comp.created_at), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <ComplaintStatusBadge status={comp.status} />
                  </div>
                </CardHeader>
                {comp.admin_notes && (
                  <CardContent className="pt-0 pb-4 px-5">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div>
                        <span className="font-bold">Barangay Action Update:</span> {comp.admin_notes}
                      </div>
                    </div>
                  </CardContent>
                )}
                <CardFooter className="py-2.5 px-5 border-t border-border/60 flex justify-end">
                  <Button
                    asChild
                    variant="ghost"
                    size="default"
                    className="min-h-[44px] px-3 text-xs font-bold text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <Link to="/complaints/$complaintId" params={{ complaintId: comp.id }}>
                      View Details & Updates <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Official Certificate Print Modal */}
      <CertificatePrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        request={selectedDoc}
      />
    </div>
  )
}
