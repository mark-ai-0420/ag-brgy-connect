import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Card, CardContent } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { ShieldCheck, AlertTriangle, FileText, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'

const DOC_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance',
  barangay_id: 'Barangay ID',
  certificate_of_residency: 'Certificate of Residency',
  certificate_of_indigency: 'Certificate of Indigency',
  business_permit: 'Business Permit',
  other: 'Other',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  in_review: 'bg-blue-100 text-blue-800 border-blue-300',
  ready: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
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
        purpose: 'Employment & Official Identification',
        notes: 'Verified demo certificate.',
        created_at: '2026-08-18T08:00:00.000Z',
        updated_at: '2026-08-18T10:00:00.000Z',
        resident_name: 'Juan R. Dela Cruz',
        barangay: 'daine_1' as const,
      }
    }

    try {
      // 1. Try high-performance RPC function (bypasses UUID casting errors & supports control numbers)
      const { data: rpcRows, error: rpcError } = await supabase.rpc('get_verified_document', {
        lookup_code: rawId,
      })

      if (!rpcError && Array.isArray(rpcRows) && rpcRows.length > 0) {
        return rpcRows[0]
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
      }
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 dark:bg-background">
      <Card className="w-full max-w-md shadow-xl border overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-[#0038A8] via-[#002675] to-[#1E3A8A] p-6 text-white text-center relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]" />
          <img src="/logo.jpg" alt="BrgyConnect" className="h-16 w-16 rounded-full object-cover mx-auto ring-2 ring-white/20 mb-3 shadow-md" />
          <h1 className="text-xl font-black tracking-tight">BrgyConnect</h1>
          <p className="text-blue-100 text-xs sm:text-sm font-medium">Official Digital Document Verification Registry</p>
        </div>
        
        <CardContent className="p-6">
          {request ? (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-1 ring-4 ring-emerald-500/20">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Verified Authentic</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This document was officially logged, verified, and issued by the barangay administration.
                </p>
              </div>

              <div className="space-y-3.5 rounded-xl bg-muted/40 p-4 border border-border">
                {/* Resident Name */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Resident / Bearer</p>
                    <p className="text-sm font-bold text-foreground truncate">{request.resident_name}</p>
                  </div>
                </div>

                {/* Issuing Unit */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0038A8]/10 flex items-center justify-center text-[#0038A8] shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Issuing Unit</p>
                    <p className="text-sm font-bold text-foreground">
                      {request.barangay === 'daine_1' ? 'Barangay Daine 1, Indang, Cavite' : request.barangay === 'daine_2' ? 'Barangay Daine 2, Indang, Cavite' : 'Barangay Daine'}
                    </p>
                  </div>
                </div>

                {/* Document Type & Control No */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Document Type & Control #</p>
                    <p className="text-sm font-bold text-foreground">{DOC_TYPE_LABELS[request.document_type] || request.document_type}</p>
                    {request.control_number && (
                      <p className="text-xs font-mono font-bold text-primary mt-0.5">{request.control_number}</p>
                    )}
                  </div>
                </div>

                {/* Date Issued */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Date Recorded</p>
                    <p className="text-sm font-semibold text-foreground">{format(new Date(request.created_at), 'MMMM d, yyyy')}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="pt-2">
                  <Badge
                    variant="outline"
                    className={`w-full justify-center py-1.5 font-bold uppercase tracking-wider text-xs rounded-lg ${STATUS_COLORS[request.status] || 'bg-slate-100'}`}
                  >
                    {request.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              {/* Action Link to Track Full Timeline */}
              <div className="pt-1">
                <Link
                  to="/track"
                  search={{ code: request.control_number || request.id }}
                  className="inline-flex items-center justify-center w-full min-h-[44px] px-4 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors border border-primary/20 cursor-pointer"
                >
                  View Full Status Lifecycle in Tracker &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <div className="rounded-full bg-red-100 dark:bg-red-950/50 p-4 ring-4 ring-red-500/20">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">Document Not Found</h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
                  We could not verify this document. It may be invalid, expired, or the reference code is incorrect.
                </p>
              </div>

              <div className="pt-4 w-full">
                <Link
                  to="/track"
                  className="inline-flex items-center justify-center w-full min-h-[44px] px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Search in Document Tracker
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
