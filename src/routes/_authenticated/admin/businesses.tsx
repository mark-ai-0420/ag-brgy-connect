import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

const getBusinesses = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('businesses')
    .select('id, name, category, owner_id, status, created_at')
    .order('created_at', { ascending: false })
  return data ?? []
})

const updateBusinessStatus = createServerFn({ method: 'POST' })
  .validator((data: { id: string; status: string }) => data)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('businesses')
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/businesses')({
  component: AdminBusinessesRoute,
  loader: () => getBusinesses(),
})

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-950 border border-amber-300 font-semibold',
  approved: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-semibold',
  rejected: 'bg-red-100 text-red-950 border border-red-300 font-semibold',
  archived: 'bg-slate-100 text-slate-950 border border-slate-300 font-semibold',
}

function AdminBusinessesRoute() {
  const businesses = Route.useLoaderData()
  const router = useRouter()

  async function handleStatus(id: string, status: string) {
    try {
      await updateBusinessStatus({ data: { id, status } })
      toast.success(`Business ${status}`)
      router.invalidate()
    } catch {
      toast.error('Failed to update business status')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Directory Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage business listings in Barangay Daine.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Businesses ({businesses.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No business listings found.
                    </TableCell>
                  </TableRow>
                ) : businesses.map(biz => (
                  <TableRow key={biz.id}>
                    <TableCell className="font-medium">{biz.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{biz.category}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{biz.owner_id?.slice(0, 8) ?? '—'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[biz.status] ?? ''}`}>
                        {biz.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                        {biz.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {biz.status === 'pending' && <Clock className="h-3 w-3" />}
                        {biz.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {biz.status !== 'approved' && (
                          <Button size="sm" variant="outline" className="min-h-[44px] px-3.5 text-emerald-900 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-semibold"
                            onClick={() => handleStatus(biz.id, 'approved')}>
                            Approve
                          </Button>
                        )}
                        {biz.status !== 'rejected' && (
                          <Button size="sm" variant="outline" className="min-h-[44px] px-3.5 text-red-900 border-red-300 bg-red-50 hover:bg-red-100 font-semibold"
                            onClick={() => handleStatus(biz.id, 'rejected')}>
                            Reject
                          </Button>
                        )}
                        {biz.status !== 'archived' && (
                          <Button size="sm" variant="ghost" className="min-h-[44px] px-3 text-slate-800 hover:bg-slate-100 font-semibold"
                            onClick={() => handleStatus(biz.id, 'archived')}>
                            Archive
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
