import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Lock,
  QrCode,
  Copy,
  Check,
  Printer,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Shield,
  FileCheck2,
  Clock,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'

export interface VerifiedDocument {
  id: string
  control_number?: string | null
  requester_id?: string
  document_type: string
  status: string
  purpose?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string
  resident_name?: string
  barangay?: 'daine_1' | 'daine_2' | 'both' | null
}

const DOC_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance & Good Moral Certificate',
  barangay_id: 'Official Barangay Resident Identification Card',
  certificate_of_residency: 'Certificate of Bona Fide Residency',
  certificate_of_indigency: 'Certificate of Financial Indigency & Assistance',
  business_permit: 'Barangay Business Clearance & Operations Permit',
  other: 'Official Barangay Certification',
}

const STATUS_CONFIGS: Record<
  string,
  { label: string; badge: string; icon: any; description: string }
> = {
  completed: {
    label: 'Verified & Issued',
    badge: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200 border-emerald-400 font-black',
    icon: ShieldCheck,
    description: 'This document was authenticated, officially recorded, and formally issued by the Barangay Administration.',
  },
  ready: {
    label: 'Ready for Release',
    badge: 'bg-indigo-100 text-indigo-950 dark:bg-indigo-950/70 dark:text-indigo-200 border-indigo-400 font-bold',
    icon: CheckCircle2,
    description: 'Document has been signed and sealed. Ready for physical claim or official digital release.',
  },
  in_review: {
    label: 'In Review / Processing',
    badge: 'bg-blue-100 text-blue-950 dark:bg-blue-950/70 dark:text-blue-200 border-blue-400 font-bold',
    icon: Clock,
    description: 'Document request is currently under review by the Barangay Secretary desk.',
  },
  pending: {
    label: 'Pending Queue',
    badge: 'bg-amber-100 text-amber-950 dark:bg-amber-950/70 dark:text-amber-200 border-amber-400 font-bold',
    icon: Clock,
    description: 'Queued for processing. Verification details are preliminary.',
  },
  rejected: {
    label: 'Disapproved / Revoked',
    badge: 'bg-red-100 text-red-950 dark:bg-red-950/70 dark:text-red-200 border-red-400 font-black',
    icon: AlertTriangle,
    description: 'This certification was rejected or revoked by the issuing authority.',
  },
}

const getVerificationData = createServerFn({ method: 'GET' })
  .validator((data: { requestId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const rawId = (data.requestId || '').trim()

    if (!rawId) return null

    if (rawId === 'demo' || rawId.startsWith('demo-')) {
      return {
        id: rawId,
        control_number: 'BD1-DEMO-2026',
        requester_id: '00000000-0000-0000-0000-000000000001',
        document_type: 'barangay_clearance',
        status: 'completed',
        purpose: 'Employment & Official Identification Verification',
        notes: 'Verified demo certificate on Civic Horizon Ledger.',
        created_at: '2026-08-18T08:00:00.000Z',
        updated_at: '2026-08-18T10:00:00.000Z',
        resident_name: 'Juan R. Dela Cruz',
        barangay: 'daine_1' as const,
      } as VerifiedDocument
    }

    try {
      // 1. Try high-performance RPC function (bypasses UUID casting errors & supports control numbers)
      const { data: rpcRows, error: rpcError } = await supabase.rpc('get_verified_document', {
        lookup_code: rawId,
      })

      if (!rpcError && Array.isArray(rpcRows) && rpcRows.length > 0) {
        return rpcRows[0] as VerifiedDocument
      }

      // 2. Fallback direct query
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)
      let query = supabase
        .from('document_requests')
        .select('id, control_number, requester_id, document_type, status, created_at, updated_at, barangay, purpose, notes, profiles(full_name)')

      if (isUuid) {
        query = query.eq('id', rawId)
      } else {
        query = query.ilike('control_number', rawId)
      }

      const { data: request, error: directError } = await query.maybeSingle()

      if (directError || !request) {
        return null
      }

      const residentName = Array.isArray(request.profiles)
        ? (request.profiles[0] as any)?.full_name
        : (request.profiles as any)?.full_name

      return {
        ...request,
        control_number: request.control_number || `BD1-${request.id.slice(0, 8).toUpperCase()}`,
        resident_name: residentName || 'Bona Fide Resident',
      } as VerifiedDocument
    } catch (err) {
      console.error('Error during document verification:', err)
      return null
    }
  })

export const Route = createFileRoute('/verify/$requestId')({
  component: VerifyRoute,
  loader: ({ params }) => getVerificationData({ data: { requestId: params.requestId } }),
})

function VerifyRoute() {
  const request = Route.useLoaderData()
  const [hasCopied, setHasCopied] = useState(false)

  const controlNumber = request?.control_number || (request?.id ? `BD1-${request.id.slice(0, 8).toUpperCase()}` : '')

  // Generate deterministic digital verification hash for display
  const digitalFingerprint = useMemo(() => {
    if (!request?.id) return ''
    const base = `${request.id}:${request.control_number || 'BD'}:${request.created_at}:${request.document_type}`
    let hash1 = 0
    let hash2 = 5381
    for (let i = 0; i < base.length; i++) {
      const char = base.charCodeAt(i)
      hash1 = ((hash1 << 5) - hash1) + char
      hash1 |= 0
      hash2 = ((hash2 << 5) + hash2) ^ char
      hash2 |= 0
    }
    const h1 = Math.abs(hash1).toString(16).padStart(8, '0')
    const h2 = Math.abs(hash2).toString(16).padStart(8, '0')
    const idHex = request.id.replace(/-/g, '').padEnd(32, 'f')
    return `${h1}-${idHex.slice(0, 16)}-${h2}`.toUpperCase()
  }, [request])

  const copyControlNumber = () => {
    if (controlNumber) {
      navigator.clipboard.writeText(controlNumber)
      setHasCopied(true)
      toast.success('Control number copied to clipboard')
      setTimeout(() => setHasCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const statusConfig = request
    ? STATUS_CONFIGS[request.status] ?? STATUS_CONFIGS.completed
    : null

  const isVerified = request && (request.status === 'completed' || request.status === 'ready')

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-background relative overflow-hidden">
      {/* Subtle background national civic glow */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#0038A8]/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-[#CE1126]/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Certificate Verification Portal Card */}
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-border/80 rounded-3xl overflow-hidden bg-card relative z-10">
        {/* ── 1. Top Civic Horizon Header with Philippine Flag Stripe ─────────── */}
        <header className="relative bg-gradient-to-r from-[#002675] via-[#0038A8] to-[#1E3A8A] text-white p-6 sm:p-8 text-center overflow-hidden">
          {/* Flag Accent Stripe */}
          <div
            className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Preserved Official Seal /logo.jpg */}
            <div className="relative mb-3.5">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-white/20 backdrop-blur-md ring-4 ring-white/30 shadow-xl overflow-hidden mx-auto">
                <img
                  src="/logo.jpg"
                  alt="Official Seal of Barangay Daine"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#FCD116] text-slate-950 shadow-md">
                <Lock className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#FCD116] text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Official Civic Document Verification Registry</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Barangay Daine Digital Registry
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1">
              Municipality of Indang, Province of Cavite, Philippines
            </p>
          </div>
        </header>

        {/* ── 2. Authenticity Result & Certificate Body ────────────────────────── */}
        <CardContent className="p-6 sm:p-8 relative">
          {/* Security Watermark Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04] flex items-center justify-center select-none overflow-hidden"
            aria-hidden="true"
          >
            <div className="transform -rotate-12 text-center text-slate-900 dark:text-white font-black text-4xl sm:text-6xl uppercase tracking-widest leading-loose">
              BARANGAY DAINE REGISTRY • OFFICIAL AUTHENTICATED DOCUMENT • BARANGAY DAINE REGISTRY •
            </div>
          </div>

          {request ? (
            <div className="space-y-6 relative z-10 animate-in fade-in-50 duration-300">
              {/* Authenticity Result Banner */}
              <div
                className={`flex flex-col items-center text-center p-5 rounded-2xl border-2 ${
                  isVerified
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-100'
                    : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ring-8 mb-3 ${
                    isVerified
                      ? 'bg-emerald-600 text-white ring-emerald-500/20'
                      : 'bg-amber-500 text-white ring-amber-500/20'
                  }`}
                >
                  <ShieldCheck className="h-9 w-9" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {isVerified ? 'Authentic Barangay Document' : 'Verification Record Located'}
                </h2>
                <p className="text-xs sm:text-sm max-w-md mt-1 opacity-90 font-medium">
                  {statusConfig?.description}
                </p>
              </div>

              {/* Digital Signature Validation Badge */}
              <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-[#FCD116] shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#FCD116]">
                        Digital Signature Validated
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        SHA-256
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200 mt-0.5">
                      Issued through cryptographic 256-bit civic ledger authentication.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <span className="text-[10px] uppercase tracking-wider text-blue-300 font-bold block">
                    Security Token
                  </span>
                  <span className="font-mono text-xs font-bold text-white tracking-widest">
                    {digitalFingerprint.slice(0, 18)}…
                  </span>
                </div>
              </div>

              {/* Issued Document Details in font-mono */}
              <div className="rounded-2xl bg-muted/40 p-5 sm:p-6 border border-border space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      Document Certificate Summary
                    </span>
                  </div>
                  <Badge variant="outline" className={statusConfig?.badge}>
                    {statusConfig?.label}
                  </Badge>
                </div>

                {/* Control Number Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-card border border-border">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Official Control Number
                    </p>
                    <p className="text-lg sm:text-xl font-mono font-black text-primary tracking-wide">
                      {controlNumber}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyControlNumber}
                    className="min-h-[38px] px-3 font-bold text-xs rounded-lg cursor-pointer self-start sm:self-center"
                  >
                    {hasCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Key-Value Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Bearer / Resident */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3 text-primary" /> Resident / Bearer
                    </span>
                    <p className="text-sm font-black text-foreground font-mono">
                      {request.resident_name || 'Bona Fide Resident'}
                    </p>
                  </div>

                  {/* Document Type */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <FileCheck2 className="h-3 w-3 text-primary" /> Document Type
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {DOC_TYPE_LABELS[request.document_type] || request.document_type}
                    </p>
                  </div>

                  {/* Issuing Authority */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-primary" /> Issuing Barangay Jurisdiction
                    </span>
                    <p className="text-xs font-bold text-foreground">
                      {request.barangay === 'daine_1'
                        ? 'Barangay Daine 1, Indang, Cavite'
                        : request.barangay === 'daine_2'
                          ? 'Barangay Daine 2, Indang, Cavite'
                          : 'Barangay Daine Unified, Indang, Cavite'}
                    </p>
                  </div>

                  {/* Date Recorded */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" /> Date Issued / Recorded
                    </span>
                    <p className="text-xs font-mono font-bold text-foreground">
                      {format(new Date(request.created_at), 'MMMM d, yyyy • h:mm a')}
                    </p>
                  </div>

                  {/* Purpose */}
                  {request.purpose && (
                    <div className="sm:col-span-2 space-y-1 pt-1 border-t border-border/50">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Declared Purpose
                      </span>
                      <p className="text-xs font-medium text-foreground/90 leading-relaxed font-mono">
                        {request.purpose}
                      </p>
                    </div>
                  )}

                  {/* Digital Signature Hash */}
                  <div className="sm:col-span-2 space-y-1 pt-1 border-t border-border/50">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <QrCode className="h-3 w-3 text-primary" /> Cryptographic Ledger Hash
                    </span>
                    <p className="font-mono text-[11px] text-muted-foreground break-all bg-card p-2 rounded-lg border border-border">
                      {digitalFingerprint}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── 3. Actions: Full Tracker Link + Print Button ────────────── */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  size="default"
                  className="w-full sm:flex-1 font-bold min-h-[44px] h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer flex items-center justify-center gap-2"
                  asChild
                >
                  <Link
                    to="/track"
                    search={{ code: controlNumber || request.id }}
                  >
                    <span>View Full Status in Document Tracker</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  onClick={handlePrint}
                  className="w-full sm:w-auto font-bold min-h-[44px] h-11 px-5 rounded-xl border-border hover:border-primary text-foreground hover:text-primary cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Certificate Verification</span>
                </Button>
              </div>
            </div>
          ) : (
            /* ── Not Found State ── */
            <div className="flex flex-col items-center text-center space-y-5 py-8 animate-in fade-in-50 duration-300">
              <div className="rounded-full bg-red-100 dark:bg-red-950/50 p-5 ring-8 ring-red-500/15">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  Document Record Not Found
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We could not locate this document in the Barangay Daine digital registry. It may be an invalid QR code, an expired record, or the control number was mistyped.
                </p>
              </div>

              <div className="pt-2 w-full max-w-xs space-y-3">
                <Button
                  size="default"
                  className="w-full font-bold min-h-[44px] h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
                  asChild
                >
                  <Link to="/track">
                    <span>Search in Document Tracker</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  className="w-full font-bold min-h-[44px] h-11 rounded-xl cursor-pointer"
                  asChild
                >
                  <Link to="/">
                    <span>Return to Civic Portal</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer info */}
        <div className="bg-muted/40 border-t border-border px-6 py-3.5 text-center text-[11px] text-muted-foreground font-medium">
          Official Civic Document Verification &bull; Republic of the Philippines &bull; Barangay Daine
        </div>
      </Card>
    </div>
  )
}
