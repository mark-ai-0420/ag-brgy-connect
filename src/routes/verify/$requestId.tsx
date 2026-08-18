import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
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

    if (data.requestId === 'demo' || data.requestId.startsWith('demo-')) {
      return {
        id: data.requestId,
        requester_id: '00000000-0000-0000-0000-000000000001',
        document_type: 'barangay_clearance',
        status: 'completed',
        created_at: '2026-08-18T08:00:00.000Z',
        resident_name: 'Juan R. Dela Cruz',
      }
    }

    const { data: request, error } = await supabase
      .from('document_requests')
      .select('id, requester_id, document_type, status, created_at, profiles(full_name)')
      .eq('id', data.requestId)
      .single()

    if (error || !request) {
      return null
    }

    return {
      ...request,
      resident_name: (Array.isArray(request.profiles) ? (request.profiles[0] as any)?.full_name : (request.profiles as any)?.full_name) ?? 'Unknown Resident',
    }
  })

export const Route = createFileRoute('/verify/$requestId')({
  component: VerifyRoute,
  loader: ({ params }) => getVerificationData({ data: { requestId: params.requestId } }),
})

function VerifyRoute() {
  const request = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-lg border-t-0 overflow-hidden">
        <div className="bg-gradient-to-r from-[#0038A8] via-[#002675] to-[#1E3A8A] p-6 text-white text-center">
          <img src="/logo.jpg" alt="BrgyConnect" className="h-16 w-16 rounded-full object-cover mx-auto ring-2 ring-white/20 mb-3" />
          <h1 className="text-xl font-bold">BrgyConnect</h1>
          <p className="text-blue-100 text-sm">Official Document Verification</p>
        </div>
        
        <CardContent className="p-6">
          {request ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <ShieldCheck className="h-16 w-16 text-emerald-500 mb-2" />
                <h2 className="text-2xl font-bold text-slate-900">Verified Authentic</h2>
                <p className="text-sm text-slate-500">This document was officially issued by the barangay.</p>
              </div>

              <div className="space-y-4 rounded-lg bg-slate-50 p-4 border">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Resident Name</p>
                    <p className="text-sm font-semibold text-slate-900">{request.resident_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Document Type</p>
                    <p className="text-sm font-semibold text-slate-900">{DOC_TYPE_LABELS[request.document_type] || request.document_type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Date Issued</p>
                    <p className="text-sm font-semibold text-slate-900">{format(new Date(request.created_at), 'MMMM d, yyyy')}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Badge variant="outline" className={`w-full justify-center py-1 font-semibold uppercase tracking-wider ${STATUS_COLORS[request.status] || 'bg-slate-100'}`}>
                    {request.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <div className="rounded-full bg-red-100 p-4">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Document Not Found</h2>
                <p className="text-sm text-slate-500 mt-2">
                  We could not verify this document. It may be invalid, expired, or the QR code is damaged.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
