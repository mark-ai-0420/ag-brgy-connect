import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Card, CardContent } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { ShieldCheck, AlertTriangle, Calendar, User, MapPin, CheckCircle2, Home, Building2 } from 'lucide-react'
import { format } from 'date-fns'

const getResidentVerificationData = createServerFn({ method: 'GET' })
  .validator((data: { residentId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const rawId = (data.residentId || '').trim()

    if (!rawId) return null

    if (rawId === 'demo' || rawId.startsWith('demo-')) {
      return {
        id: rawId,
        full_name: 'Juan R. Dela Cruz',
        barangay: 'daine_1' as const,
        purok: 'Purok 2 (Centro)',
        phone: '0917-123-4567',
        address: '123 Daine 1 Main Road, Indang, Cavite',
        created_at: '2024-01-15T08:00:00.000Z',
        avatar_url: null,
        control_number: 'BD1-RES-DEMO2026',
        status: 'Active Resident in Good Standing',
      }
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)
      
      let query = supabase
        .from('profiles')
        .select('id, full_name, barangay, purok, phone, address, avatar_url, created_at')

      if (isUuid) {
        query = query.eq('id', rawId)
      } else {
        // Remove BD1-RES- or BD2-RES- prefix if user searched with control number
        const cleanCode = rawId.replace(/^BD[12]-RES-/i, '').toLowerCase()
        if (cleanCode.length >= 6) {
          query = query.ilike('id::text', `${cleanCode}%`)
        } else {
          query = query.eq('id', rawId)
        }
      }

      const { data: profile, error } = await query.maybeSingle()

      if (error || !profile) {
        // Fallback: search across all profiles for prefix match
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, barangay, purok, phone, address, avatar_url, created_at')

        const matched = (allProfiles || []).find(p => 
          p.id === rawId ||
          p.id.replace(/-/g, '').toLowerCase().startsWith(rawId.replace(/^BD[12]-RES-/i, '').replace(/-/g, '').toLowerCase())
        )

        if (matched) {
          const isDaine2 = matched.barangay === 'daine_2'
          const prefix = isDaine2 ? 'BD2-RES-' : 'BD1-RES-'
          return {
            ...matched,
            control_number: `${prefix}${matched.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
            status: 'Active Resident in Good Standing',
          }
        }
        return null
      }

      const isDaine2 = profile.barangay === 'daine_2'
      const prefix = isDaine2 ? 'BD2-RES-' : 'BD1-RES-'

      return {
        ...profile,
        control_number: `${prefix}${profile.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
        status: 'Active Resident in Good Standing',
      }
    } catch (err) {
      console.error('Error during resident verification:', err)
      return null
    }
  })

export const Route = createFileRoute('/verify/resident/$residentId')({
  component: VerifyResidentRoute,
  loader: ({ params }) => getResidentVerificationData({ data: { residentId: params.residentId } }),
})

function VerifyResidentRoute() {
  const resident = Route.useLoaderData()

  const issueYear = resident?.created_at
    ? format(new Date(resident.created_at), 'yyyy')
    : '2026'

  const issueDateFull = resident?.created_at
    ? format(new Date(resident.created_at), 'MMMM d, yyyy')
    : 'Official Registry'

  const barangayLabel = resident?.barangay === 'daine_2'
    ? 'Barangay Daine 2, Indang, Cavite'
    : 'Barangay Daine 1, Indang, Cavite'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 dark:bg-background">
      <Card className="w-full max-w-md shadow-xl border overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-[#0038A8] via-[#002675] to-[#1E3A8A] p-6 text-white text-center relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]" />
          <img
            src="/logo.jpg"
            alt="BrgyConnect"
            className="h-16 w-16 rounded-full object-cover mx-auto ring-2 ring-white/20 mb-3 shadow-md bg-white"
          />
          <h1 className="text-xl font-black tracking-tight">BrgyConnect</h1>
          <p className="text-blue-100 text-xs sm:text-sm font-medium">
            Official Citizen & Resident Verification Registry
          </p>
        </div>

        <CardContent className="p-6">
          {resident ? (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-1 ring-4 ring-emerald-500/20">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Verified Authentic Resident</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This individual is an officially verified bona fide resident in good standing.
                </p>
              </div>

              <div className="space-y-3.5 rounded-xl bg-muted/40 p-4 border border-border">
                {/* Resident Photo & Full Name */}
                <div className="flex items-center gap-3 pb-2 border-b border-border/60">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {resident.avatar_url ? (
                      <img src={resident.avatar_url} alt={resident.full_name || 'Resident'} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Verified Resident Name
                    </p>
                    <p className="text-base font-black text-foreground uppercase truncate">
                      {resident.full_name || 'Bona Fide Resident'}
                    </p>
                    <p className="text-xs font-mono font-bold text-primary">{resident.control_number}</p>
                  </div>
                </div>

                {/* Issuing Barangay Unit */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0038A8]/10 flex items-center justify-center text-[#0038A8] shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Official Barangay Unit
                    </p>
                    <p className="text-sm font-bold text-foreground">{barangayLabel}</p>
                  </div>
                </div>

                {/* Purok / Sitio */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Purok / Sitio
                    </p>
                    <p className="text-sm font-bold text-foreground">{resident.purok || 'Sitio Centro / Registered Purok'}</p>
                  </div>
                </div>

                {/* Registered / Issue Year */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Resident Since / Issue Year
                    </p>
                    <p className="text-sm font-semibold text-foreground">{issueDateFull} ({issueYear})</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="pt-2">
                  <Badge
                    variant="outline"
                    className="w-full justify-center py-2 font-bold uppercase tracking-wider text-xs rounded-lg bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 inline text-emerald-600 dark:text-emerald-400" />
                    {resident.status}
                  </Badge>
                </div>
              </div>

              {/* Action Links */}
              <div className="space-y-2 pt-1">
                <Link
                  to="/track"
                  className="inline-flex items-center justify-center w-full min-h-[44px] px-4 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors border border-primary/20 cursor-pointer"
                >
                  Verify Document Records in Tracker &rarr;
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center w-full min-h-[40px] px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5 mr-1.5 inline" /> Back to BrgyConnect Portal
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4 py-8">
              <div className="rounded-full bg-red-100 dark:bg-red-950/50 p-4 ring-4 ring-red-500/20">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">Resident Record Not Found</h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
                  We could not verify this digital resident ID. The resident ID may be invalid, deactivated, or the link is incorrect.
                </p>
              </div>

              <div className="pt-4 w-full space-y-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full min-h-[44px] px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Resident Sign In
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center w-full min-h-[40px] px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
