import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Badge } from '#/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Pin, PinOff, Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { ImageUploader } from '#/components/common/ImageUploader'

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  body: z.string().min(10, 'Body must be at least 10 characters'),
  pinned: z.boolean().default(false),
  category: z.enum(['General', 'Health', 'Infrastructure', 'Emergency', 'Advisory', 'Programs']).default('General'),
  scope: z.enum(['daine_1', 'daine_2', 'both']).default('both'),
  image_url: z.string().nullable().optional(),
})

const getAnnouncements = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('user_roles').select('barangay').eq('user_id', user.id).single()
  const adminScope = profile?.barangay || 'daine_1'

  let query = supabase
    .from('announcements')
    .select('id, title, body, pinned, author_id, created_at, category, scope, image_url')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (adminScope !== 'both') {
    query = query.in('scope', [adminScope, 'both'])
  }

  const { data } = await query
  return { announcements: data ?? [], adminScope }
})

const upsertAnnouncement = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string().optional() }).merge(announcementSchema).parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { session, role } = await getAuthSession()
    if (!session || (role !== 'admin' && role !== 'moderator')) throw new Error('Unauthorized')

    if (data.id) {
      const { error } = await supabase.from('announcements')
        .update({
          title: data.title,
          body: data.body,
          pinned: data.pinned,
          category: data.category,
          scope: data.scope,
          image_url: data.image_url ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('announcements')
        .insert({
          title: data.title,
          body: data.body,
          pinned: data.pinned,
          category: data.category,
          scope: data.scope,
          image_url: data.image_url ?? null,
          author_id: session.user.id
        })
      if (error) throw new Error(error.message)
    }
    return { success: true }
  })

const deleteAnnouncement = createServerFn({ method: 'POST' })
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => {
    const { session, role } = await getAuthSession()
    if (!session || (role !== 'admin' && role !== 'moderator')) throw new Error('Unauthorized')
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

const togglePin = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string().min(1), pinned: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    const { session, role } = await getAuthSession()
    if (!session || (role !== 'admin' && role !== 'moderator')) throw new Error('Unauthorized')
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.from('announcements')
      .update({ pinned: data.pinned, updated_at: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/announcements')({
  component: AdminAnnouncementsRoute,
  loader: async () => {
    const announcementsData = await getAnnouncements()
    return { announcements: announcementsData.announcements, adminScope: announcementsData.adminScope }
  },
})

type Announcement = Awaited<ReturnType<typeof getAnnouncements>>['announcements'][number]

function AnnouncementForm({
  defaultValues,
  adminScope,
  onSuccess,
}: {
  defaultValues?: Partial<Announcement>
  adminScope: string
  onSuccess: () => void
}) {
  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema) as any,
    defaultValues: {
      title: defaultValues?.title ?? '',
      body: defaultValues?.body ?? '',
      pinned: defaultValues?.pinned ?? false,
      category: (defaultValues?.category as any) ?? 'General',
      scope: (defaultValues?.scope as any) ?? (adminScope === 'both' ? 'both' : adminScope),
      image_url: defaultValues?.image_url ?? null,
    },
  })

  async function onSubmit(values: z.infer<typeof announcementSchema>) {
    try {
      await upsertAnnouncement({ data: { id: defaultValues?.id, ...values } })
      toast.success(defaultValues?.id ? 'Announcement updated!' : 'Announcement created!')
      onSuccess()
    } catch {
      toast.error('Failed to save announcement')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="image_url" render={({ field }) => (
          <FormItem>
            <FormLabel>Banner / Featured Photo (Optional)</FormLabel>
            <FormControl>
              <ImageUploader
                bucket="announcement-photos"
                value={field.value}
                onChange={field.onChange}
                label=""
                helperText="Upload an official banner or advisory poster (JPEG, PNG, WebP up to 5MB)"
                aspectRatio="video"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl><Input placeholder="Announcement title..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {['General', 'Health', 'Infrastructure', 'Emergency', 'Advisory', 'Programs'].map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="body" render={({ field }) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <Textarea className="resize-none min-h-[120px]" placeholder="Write the announcement..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="pinned" render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <input type="checkbox" id="pinned" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
            </FormControl>
            <FormLabel htmlFor="pinned" className="!mt-0 cursor-pointer">Pin to top</FormLabel>
          </FormItem>
        )} />
        {adminScope === 'both' && (
          <FormField control={form.control} name="scope" render={({ field }) => (
            <FormItem>
              <FormLabel>Jurisdiction (Scope)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="both">Both (All Daine)</SelectItem>
                  <SelectItem value="daine_1">Barangay Daine 1</SelectItem>
                  <SelectItem value="daine_2">Barangay Daine 2</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="submit" disabled={form.formState.isSubmitting} className="min-h-[44px]">
            {form.formState.isSubmitting ? 'Saving...' : defaultValues?.id ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function AdminAnnouncementsRoute() {
  const { announcements, adminScope } = Route.useLoaderData()
  const router = useRouter()
  const [editItem, setEditItem] = useState<Announcement | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncement({ data: id })
      toast.success('Deleted')
      router.invalidate()
    } catch { toast.error('Failed to delete') }
    setDeleteId(null)
  }

  async function handlePin(id: string, pinned: boolean) {
    try {
      await togglePin({ data: { id, pinned: !pinned } })
      router.invalidate()
    } catch { toast.error('Failed to update pin') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, edit, pin, and monitor community announcements.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px] px-4 font-semibold"><Plus className="h-4 w-4 mr-2" />New Announcement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
            <AnnouncementForm adminScope={adminScope} onSuccess={() => { setCreateOpen(false); router.invalidate() }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No announcements yet.</CardContent>
          </Card>
        ) : announcements.map(ann => (
          <Card key={ann.id} className={ann.pinned ? 'border-primary/40 bg-primary/5' : ''}>
            <CardHeader className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {ann.image_url && (
                    <img
                      src={ann.image_url}
                      alt={ann.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border shrink-0 mt-0.5"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {ann.pinned && <Badge variant="secondary" className="text-xs">Pinned</Badge>}
                      {ann.category && <Badge variant="outline" className="text-xs">{ann.category}</Badge>}
                      {ann.scope && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                          ann.scope === 'both' ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200' :
                          ann.scope === 'daine_1' ? 'bg-[#0038A8]/10 text-[#0038A8]' :
                          'bg-[#CE1126]/10 text-[#CE1126]'
                        }`}>
                          {ann.scope === 'both' ? 'All Daine' : ann.scope === 'daine_1' ? 'Daine 1' : 'Daine 2'}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{format(new Date(ann.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <CardTitle className="text-base truncate">{ann.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.body}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => handlePin(ann.id, ann.pinned)} title={ann.pinned ? 'Unpin' : 'Pin'}>
                    {ann.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </Button>
                  <Dialog open={editItem?.id === ann.id} onOpenChange={open => setEditItem(open ? ann : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Edit Announcement</DialogTitle></DialogHeader>
                      <AnnouncementForm adminScope={adminScope} defaultValues={ann} onSuccess={() => { setEditItem(null); router.invalidate() }} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(ann.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600">
            Are you sure you want to delete this announcement? This action cannot be undone.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
