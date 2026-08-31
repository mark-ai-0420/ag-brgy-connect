import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getAuthSession } from '#/server/auth'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { StatusBadge } from '#/components/common/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { format } from 'date-fns'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  EyeOff,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Scale,
  Building2,
  Printer,
  ShieldCheck,
  UserCheck,
  PhoneCall,
  FileText,
  ExternalLink,
  Info,
  Gavel,
  ShieldAlert,
} from 'lucide-react'

const getComplaintDetail = createServerFn({ method: 'GET' })
  .validator((data: string) => data)
  .handler(async ({ data: complaintId }) => {
    const { user } = await getAuthSession()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const supabase = createSupabaseServerClient()

    // Fetch user role to allow admins/moderators to view all complaints
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const isStaff = roleData?.role === 'admin' || roleData?.role === 'moderator'

    let query = supabase.from('complaints').select('*').eq('id', complaintId)

    // If regular resident, only allow viewing their own complaint
    if (!isStaff) {
      query = query.eq('complainant_id', user.id)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return null
    }

    return data
  })

export const Route = createFileRoute('/_authenticated/complaints/$complaintId')({
  component: ComplaintDetailPage,
  loader: async ({ params }) => {
    const complaint = await getComplaintDetail({ data: params.complaintId })
    if (!complaint) {
      throw notFound()
    }
    return complaint
  },
})

const PRIORITY_BADGES: Record<string, { label: string; className: string }> = {
  low: { label: 'Low Priority', className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
  medium: { label: 'Medium Priority', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300' },
  high: { label: 'High Priority', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' },
  urgent: { label: 'Urgent Priority', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300' },
}

interface MediationMilestone {
  key: string
  title: string
  subtitle: string
  stageOrder: number
}

const MEDIATION_STAGES: MediationMilestone[] = [
  {
    key: 'pending',
    title: 'Intake & Blotter Entry',
    subtitle: 'Recorded in barangay docket, assigned to Lupon Tagapamayapa',
    stageOrder: 1,
  },
  {
    key: 'investigating',
    title: 'Investigation & Summons (Patawag)',
    subtitle: 'Ground verification & issuance of Barangay Subpoena to parties',
    stageOrder: 2,
  },
  {
    key: 'scheduled_hearing',
    title: 'Mediation Hearing (Pangkat)',
    subtitle: 'Conciliation session at Barangay Hall presided by Lupon mediators',
    stageOrder: 3,
  },
  {
    key: 'resolved',
    title: 'Case Resolution / Kasunduan',
    subtitle: 'Signed Amicable Settlement or Certificate to File Action (CFA)',
    stageOrder: 4,
  },
]

function getStageIndex(status: string): number {
  switch (status.toLowerCase()) {
    case 'pending':
      return 1
    case 'investigating':
      return 2
    case 'scheduled_hearing':
      return 3
    case 'resolved':
    case 'dismissed':
      return 4
    default:
      return 1
  }
}

function ComplaintDetailPage() {
  const complaint = Route.useLoaderData()
  const currentStageOrder = getStageIndex(complaint.status)
  const isDismissed = complaint.status.toLowerCase() === 'dismissed'
  const isHearing = complaint.status.toLowerCase() === 'scheduled_hearing'
  const isResolved = complaint.status.toLowerCase() === 'resolved'

  const docketNumber = `BLOTTER-${complaint.barangay === 'daine_2' ? 'D2' : 'D1'}-${complaint.id.slice(0, 8).toUpperCase()}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <Button
            variant="ghost"
            asChild
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground inline-flex items-center gap-2 min-h-[44px]"
          >
            <Link to="/complaints">
              <ArrowLeft className="h-4 w-4" />
              Back to My Incident Reports
            </Link>
          </Button>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-muted text-foreground border border-border">
              {docketNumber}
            </span>
            <Badge variant="outline" className="text-xs uppercase font-semibold">
              {complaint.barangay === 'daine_2' ? 'Barangay Daine 2' : 'Barangay Daine 1'}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {complaint.title}
          </h1>
        </div>

        {/* Action Controls with min 44px touch targets */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="min-h-[44px] px-4 font-semibold inline-flex items-center gap-2 touch-target cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Blotter Extract</span>
          </Button>
          <Button
            asChild
            className="btn-tactile min-h-[44px] px-5 font-semibold inline-flex items-center gap-2 touch-target"
          >
            <Link to="/complaints/new">
              <FileText className="h-4 w-4" />
              <span>File Another Report</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Case Status & Badges Bar */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge status={complaint.status} domain="complaint" />

          <Badge variant="outline" className="text-xs font-semibold py-1 px-3">
            {complaint.category}
          </Badge>

          {complaint.priority && PRIORITY_BADGES[complaint.priority] && (
            <Badge
              variant="outline"
              className={`text-xs font-semibold py-1 px-3 ${PRIORITY_BADGES[complaint.priority].className}`}
            >
              {PRIORITY_BADGES[complaint.priority].label}
            </Badge>
          )}

          {complaint.is_anonymous ? (
            <Badge className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 gap-1.5 py-1 px-3 text-xs">
              <EyeOff className="h-3.5 w-3.5" /> Anonymous Whistleblower
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs">
              <UserCheck className="h-3.5 w-3.5" /> Verified Complainant
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          <span>Filed on {format(new Date(complaint.created_at), 'PPPp')}</span>
        </div>
      </div>

      {/* Active Hearing Alert Banner (If status is scheduled_hearing) */}
      {isHearing && (
        <div className="rounded-2xl border-2 border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-600 text-white shrink-0">
                <Gavel className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-purple-950 dark:text-purple-100">
                    Mediation Hearing Scheduled (Katarungang Pambarangay)
                  </h3>
                  <Badge className="bg-purple-600 text-white text-xs">Active Summon</Badge>
                </div>
                <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
                  Both complainant and respondent have been summoned (<em>Patawag</em>) to appear for conciliation at the Barangay Hall. Please arrive 15 minutes early with your identification.
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-purple-950 dark:text-purple-200">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                    Venue: Barangay Multi-Purpose Hall / Session Room
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                    Presiding: Punong Barangay / Pangkat Tagapagkasundo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mediation Hearing Schedule Timeline */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Mediation & Case Progress Timeline
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Official dispute milestones under Katarungang Pambarangay (Republic Act 7160)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Step {currentStageOrder} of 4
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-8 px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {MEDIATION_STAGES.map((stage, idx) => {
              const isPassed = currentStageOrder > stage.stageOrder
              const isCurrent = currentStageOrder === stage.stageOrder
              const isFuture = currentStageOrder < stage.stageOrder

              let stepTitle = stage.title
              if (stage.key === 'resolved' && isDismissed) {
                stepTitle = 'Case Dismissed / CFA Issued'
              }

              return (
                <div key={stage.key} className="relative flex flex-col items-start space-y-2.5">
                  {/* Step Indicator */}
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm border-2 transition-all ${
                        isPassed
                          ? 'bg-primary border-primary text-primary-foreground shadow-xs'
                          : isCurrent
                          ? 'bg-primary/10 border-primary text-primary ring-4 ring-primary/20 shadow-xs'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : (
                        <span>{stage.stageOrder}</span>
                      )}
                    </div>

                    {/* Step line for desktop */}
                    {idx < MEDIATION_STAGES.length - 1 && (
                      <div
                        className={`hidden md:block flex-1 h-1 rounded-full transition-colors ${
                          isPassed ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>

                  {/* Stage Text */}
                  <div className="space-y-1 pr-2">
                    <p
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-primary'
                          : isPassed
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {stepTitle}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main 2-Column Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Narrative, Evidence, Notes (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Incident Narrative Card */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Incident Narrative & Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="rounded-xl bg-muted/40 p-4 sm:p-5 border border-border/80">
                <p className="whitespace-pre-wrap text-sm sm:text-base text-foreground leading-relaxed font-normal">
                  {complaint.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attached Photo Evidence Card */}
          {complaint.photo_url && (
            <Card className="border-border shadow-xs overflow-hidden">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Photographic & Documentary Evidence
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="min-h-[44px] text-xs gap-1.5 touch-target"
                  >
                    <a href={complaint.photo_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Full Size
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <a
                  href={complaint.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden border border-border shadow-xs group cursor-pointer"
                >
                  <img
                    src={complaint.photo_url}
                    alt="Evidence attachment"
                    className="w-full h-auto max-h-[450px] object-cover group-hover:scale-[1.01] transition-transform duration-200"
                  />
                </a>
              </CardContent>
            </Card>
          )}

          {/* Official Barangay Staff Response & Admin Notes */}
          {complaint.admin_notes ? (
            <Card className="border-2 border-primary/30 bg-primary/5 shadow-xs">
              <CardHeader className="border-b border-primary/20 pb-4">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Official Barangay Action & Mediator Notes
                </CardTitle>
                <CardDescription className="text-xs">
                  Official updates recorded by the Barangay Secretary or Lupon Chairman
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-3">
                <div className="p-4 rounded-xl bg-background border border-primary/20 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {complaint.admin_notes}
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: This response is official and logged on the barangay dispute management record.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border shadow-xs bg-muted/20">
              <CardContent className="pt-6 pb-6 text-center text-muted-foreground space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">Awaiting Barangay Action Notes</p>
                <p className="text-xs max-w-md mx-auto">
                  The Barangay Peace & Order committee will review this intake and record official hearing notices or conciliation updates here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Metadata Details & Katarungang Pambarangay Guide (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold">Case Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time Filed</p>
                    <p className="font-semibold text-foreground">
                      {format(new Date(complaint.created_at), 'PPPp')}
                    </p>
                  </div>
                </div>

                {complaint.incident_date && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Incident Date</p>
                      <p className="font-semibold text-foreground">
                        {format(new Date(complaint.incident_date), 'PPPp')}
                      </p>
                    </div>
                  </div>
                )}

                {complaint.location && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Incident Location</p>
                      <p className="font-semibold text-foreground">{complaint.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Jurisdiction</p>
                    <p className="font-semibold text-foreground">
                      {complaint.barangay === 'daine_2' ? 'Barangay Daine 2' : 'Barangay Daine 1'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                    {complaint.is_anonymous ? <EyeOff className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Complainant Privacy</p>
                    <p className="font-semibold text-foreground">
                      {complaint.is_anonymous ? 'Anonymous Whistleblower' : 'Standard Verified Resident'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Katarungang Pambarangay Hearing Rules & Advisory */}
          <Card className="border-border shadow-xs bg-linear-to-b from-card to-muted/20">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Katarungang Pambarangay Advisory
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs text-muted-foreground leading-relaxed">
              <div className="p-3 rounded-lg bg-background border text-foreground space-y-1">
                <p className="font-bold text-xs flex items-center gap-1.5 text-primary">
                  <Gavel className="h-3.5 w-3.5" />
                  Legal Force of Kasunduan
                </p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  An amicable settlement reached during Lupon proceedings has the force and effect of a final judgment of a court after 10 days from the date of settlement.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-foreground text-xs">Section 415 Appearance Rule:</p>
                <p className="text-[11px]">
                  Lawyers are strictly prohibited from participating during Lupon conciliation hearings. All parties must appear in person.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-foreground text-xs">Certificate to File Action (CFA):</p>
                <p className="text-[11px]">
                  If no amicable settlement is reached after 3 hearings, the Punong Barangay will issue a CFA certifying that mediation was exhausted, enabling formal filing in Municipal Court.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Peace & Order Hotline */}
          <Card className="border-border shadow-xs bg-muted/30">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-foreground">Need Urgent Conciliation Assistance?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Contact the Barangay Secretary or Tanod desk for summons schedule status:
              </p>
              <div className="bg-background rounded-lg p-2.5 border text-xs font-mono font-semibold text-foreground flex items-center justify-between">
                <span>Lupon Desk:</span>
                <span className="text-primary font-bold">(046) 415-XXXX</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
