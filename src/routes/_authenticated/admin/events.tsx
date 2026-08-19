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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Pencil, Trash2, Plus, Calendar, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ImageUploader } from '#/components/common/ImageUploader'

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  location: z.string().optional(),
  starts_at: z.string().min(1, 'Start date/time is required'),
  ends_at: z.string().optional(),
  scope: z.enum(['daine_1', 'daine_2', 'both']).default('both'),
  image_url: z.string().nullable().optional(),
})

const getEvents = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('user_roles').select('barangay').eq('user_id', user.id).single()
  const adminScope = profile?.barangay || 'daine_1'

  let query = supabase
    .from('events')
    .select('id, title, description, location, starts_at, ends_at, created_at, scope, image_url')
    .order('starts_at', { ascending: true })

  if (adminScope !== 'both') {
    query = query.in('scope', [adminScope, 'both'])
  }

  const { data } = await query
  return { events: data ?? [], adminScope }
})

const upsertEvent = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string().optional() }).merge(eventSchema).parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { session } = await getAuthSession()
    if (!session) throw new Error('Not authenticated')

    if (data.id) {
      const { error } = await supabase.from('events')
        .update({
          title: data.title,
          description: data.description,
          location: data.location,
          starts_at: data.starts_at,
          ends_at: data.ends_at || null,
          scope: data.scope,
          image_url: data.image_url ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('events')
        .insert({
          title: data.title,
          description: data.description,
          location: data.location,
          starts_at: data.starts_at,
          ends_at: data.ends_at || null,
          scope: data.scope,
          image_url: data.image_url ?? null,
        })
      if (error) throw new Error(error.message)
    }
    return { success: true }
  })

const deleteEvent = createServerFn({ method: 'POST' })
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/events')({
  component: AdminEventsRoute,
  loader: () => getEvents(),
})

type Event = Awaited<ReturnType<typeof getEvents>>['events'][number]

function EventForm({ defaultValues, adminScope, onSuccess }: { defaultValues?: Partial<Event>; adminScope: string; onSuccess: () => void }) {
  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      location: defaultValues?.location ?? '',
      starts_at: defaultValues?.starts_at ? new Date(defaultValues.starts_at).toISOString().slice(0, 16) : '',
      ends_at: defaultValues?.ends_at ? new Date(defaultValues.ends_at).toISOString().slice(0, 16) : '',
      scope: (defaultValues?.scope as any) ?? (adminScope === 'both' ? 'both' : adminScope),
      image_url: defaultValues?.image_url ?? null,
    },
  })

  async function onSubmit(values: z.infer<typeof eventSchema>) {
    try {
      await upsertEvent({ data: { id: defaultValues?.id, ...values } })
      toast.success(defaultValues?.id ? 'Event updated!' : 'Event created!')
      onSuccess()
    } catch {
      toast.error('Failed to save event')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="image_url" render={({ field }) => (
          <FormItem>
            <FormLabel>Event Cover Photo (Optional)</FormLabel>
            <FormControl>
              <ImageUploader
                bucket="event-photos"
                value={field.value}
                onChange={field.onChange}
                label=""
                helperText="Upload event promotional poster or photo (JPEG, PNG, WebP up to 5MB)"
                aspectRatio="video"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Event Title</FormLabel>
            <FormControl><Input placeholder="Community meeting..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="starts_at" render={({ field }) => (
            <FormItem>
              <FormLabel>Starts At</FormLabel>
              <FormControl><Input type="datetime-local" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="ends_at" render={({ field }) => (
            <FormItem>
              <FormLabel>Ends At (Optional)</FormLabel>
              <FormControl><Input type="datetime-local" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl><Input placeholder="Barangay Hall, Multi-Purpose..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea className="resize-none min-h-[100px]" placeholder="Event details..." {...field} />
            </FormControl>
            <FormMessage />
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

function AdminEventsRoute() {
  const { events, adminScope } = Route.useLoaderData()
  const router = useRouter()
  const [editItem, setEditItem] = useState<Event | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    try {
      await deleteEvent({ data: id })
      toast.success('Event deleted')
      router.invalidate()
    } catch { toast.error('Failed to delete') }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage community events and activities.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px] px-4 font-semibold"><Plus className="h-4 w-4 mr-2" />New Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
            <EventForm adminScope={adminScope} onSuccess={() => { setCreateOpen(false); router.invalidate() }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No events scheduled.</CardContent>
          </Card>
        ) : events.map(ev => (
          <Card key={ev.id}>
            <CardHeader className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {ev.image_url && (
                    <img
                      src={ev.image_url}
                      alt={ev.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border shrink-0 mt-0.5"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{ev.title}</CardTitle>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {format(new Date(ev.starts_at), 'MMM d, yyyy • h:mm a')}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {ev.location}
                        </span>
                      )}
                      {ev.scope && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider self-center ${
                          ev.scope === 'both' ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200' :
                          ev.scope === 'daine_1' ? 'bg-[#0038A8]/10 text-[#0038A8]' :
                          'bg-[#CE1126]/10 text-[#CE1126]'
                        }`}>
                          {ev.scope === 'both' ? 'All Daine' : ev.scope === 'daine_1' ? 'Daine 1' : 'Daine 2'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Dialog open={editItem?.id === ev.id} onOpenChange={open => setEditItem(open ? ev : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
                      <EventForm adminScope={adminScope} defaultValues={ev} onSuccess={() => { setEditItem(null); router.invalidate() }} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(ev.id)}>
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
            Are you sure you want to delete this event? This action cannot be undone.
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

