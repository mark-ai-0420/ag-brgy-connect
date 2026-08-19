import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { CheckCircle, XCircle, Clock, ExternalLink, Store } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

const getBusinesses = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('businesses')
    .select('id, name, category, owner_id, status, created_at, notes, photo_url, menu_image_url, misc_image_url')
    .order('created_at', { ascending: false })
  return data ?? []
})

const updateBusinessStatus = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string(), status: z.enum(['pending', 'approved', 'rejected', 'archived']), notes: z.string().optional() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const updateData: any = { status: data.status, updated_at: new Date().toISOString() }
    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }
    const { error } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/businesses')({
  component: AdminBusinessesRoute,
  loader: () => getBusinesses(),
})

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 font-semibold',
  approved: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 font-semibold',
  rejected: 'bg-red-100 text-red-950 dark:bg-red-900/50 dark:text-red-200 border border-red-300 font-semibold',
  archived: 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 font-semibold',
}

function AdminBusinessesRoute() {
  const businesses = Route.useLoaderData()
  const router = useRouter()

  async function handleStatus(id: string, status: string) {
    let notes = undefined;
    if (status === 'rejected') {
      const reason = window.prompt('Please enter the reason for rejection (this will be visible to the resident):')
      if (reason === null) return // user cancelled
      notes = reason
    }
    if (status === 'archived') {
      if (!window.confirm('Are you sure you want to archive this business listing?')) return
    }

    try {
      await updateBusinessStatus({ data: { id, status, notes } })
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
                  <TableHead>Business</TableHead>
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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {biz.photo_url ? (
                          <img
                            src={biz.photo_url}
                            alt={biz.name}
                            className="w-10 h-10 rounded-lg object-cover border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border shrink-0 text-muted-foreground">
                            <Store className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            {biz.name}
                            <Link
                              to="/directory/$businessId"
                              params={{ businessId: biz.id }}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="View listing page"
                              target="_blank"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {[
                              biz.photo_url ? 'Storefront' : null,
                              biz.menu_image_url ? 'Menu' : null,
                              biz.misc_image_url ? 'Showcase' : null,
                            ]
                              .filter(Boolean)
                              .join(' • ') || 'No photos'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
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
                          <Button size="sm" variant="outline" className="min-h-[44px] px-3.5 text-emerald-900 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700 font-semibold"
                            onClick={() => handleStatus(biz.id, 'approved')}>
                            Approve
                          </Button>
                        )}
                        {biz.status !== 'rejected' && (
                          <Button size="sm" variant="outline" className="min-h-[44px] px-3.5 text-red-900 border-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-200 dark:border-red-700 font-semibold"
                            onClick={() => handleStatus(biz.id, 'rejected')}>
                            Reject
                          </Button>
                        )}
                        {biz.status !== 'archived' && (
                          <Button size="sm" variant="ghost" className="min-h-[44px] px-3 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
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
