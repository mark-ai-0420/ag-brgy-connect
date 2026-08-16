import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { uploadOfficialPhoto } from '#/lib/upload'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Pencil, Trash2, Plus, Users, Upload, Loader2, Phone, Calendar, ArrowUpDown, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export interface Official {
  id: string
  name: string
  position: string
  committee: string | null
  photo_url: string | null
  contact_number: string | null
  term: string
  display_order: number
  created_at: string
}

const officialSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  position: z.string().min(2, 'Position is required'),
  committee: z.string().optional(),
  contact_number: z.string().optional(),
  term: z.string().min(1, 'Term is required'),
  display_order: z.coerce.number().min(0, 'Display order must be 0 or greater'),
  photo_url: z.string().optional(),
})

const POSITIONS = [
  'Punong Barangay',
  'Barangay Kagawad',
  'SK Chairperson',
  'Barangay Secretary',
  'Barangay Treasurer',
  'Chief Tanod',
] as const

const COMMITTEES = [
  'Executive / Overall Governance',
  'Committee on Appropriations & Finance',
  'Committee on Peace & Order and Safety',
  'Committee on Health & Sanitation',
  'Committee on Infrastructure & Public Works',
  'Committee on Agriculture & Livelihood',
  'Committee on Education & Culture',
  'Committee on Youth & Sports Development',
  'Administrative Operations & Records',
  'Financial Operations & Disbursing',
  'Ways and Means',
] as const

const getAdminOfficials = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('barangay_officials')
    .select('id, name, position, committee, photo_url, contact_number, term, display_order, created_at')
    .order('display_order', { ascending: true })
  if (error) console.error('Error fetching admin officials:', error)
  return (data as Official[]) ?? []
})

const upsertOfficial = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string().optional() }).merge(officialSchema).parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { session } = await getAuthSession()
    if (!session) throw new Error('Not authenticated')

    if (data.id) {
      const { error } = await supabase
        .from('barangay_officials')
        .update({
          name: data.name,
          position: data.position,
          committee: data.committee || null,
          photo_url: data.photo_url || null,
          contact_number: data.contact_number || null,
          term: data.term,
          display_order: data.display_order,
        })
        .eq('id', data.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase
        .from('barangay_officials')
        .insert({
          name: data.name,
          position: data.position,
          committee: data.committee || null,
          photo_url: data.photo_url || null,
          contact_number: data.contact_number || null,
          term: data.term,
          display_order: data.display_order,
        })
      if (error) throw new Error(error.message)
    }
    return { success: true }
  })

const deleteOfficial = createServerFn({ method: 'POST' })
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { session } = await getAuthSession()
    if (!session) throw new Error('Not authenticated')

    const { error } = await supabase.from('barangay_officials').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/officials')({
  component: AdminOfficialsRoute,
  loader: () => getAdminOfficials(),
})

function OfficialForm({ defaultValues, onSuccess }: { defaultValues?: Partial<Official>; onSuccess: () => void }) {
  const [uploading, setUploading] = useState(false)

  const form = useForm<z.infer<typeof officialSchema>>({
    resolver: zodResolver(officialSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? '',
      position: defaultValues?.position ?? 'Barangay Kagawad',
      committee: defaultValues?.committee ?? '',
      contact_number: defaultValues?.contact_number ?? '',
      term: defaultValues?.term ?? '2023 - 2026',
      display_order: defaultValues?.display_order ?? 0,
      photo_url: defaultValues?.photo_url ?? '',
    },
  })

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadOfficialPhoto(file, defaultValues?.id)
      if (url) {
        form.setValue('photo_url', url)
        toast.success('Photo uploaded successfully')
      } else {
        toast.error('Failed to upload photo')
      }
    } catch {
      toast.error('Error uploading photo')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof officialSchema>) {
    try {
      await upsertOfficial({ data: { id: defaultValues?.id, ...values } })
      toast.success(defaultValues?.id ? 'Official updated!' : 'Official added!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save official')
    }
  }

  const currentPhoto = form.watch('photo_url')
  const currentName = form.watch('name')

  const initials = (currentName || 'Official')
    .replace(/^Hon\.\s+|^Ms\.\s+|^Mr\.\s+/, '')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Photo Upload Section */}
        <div className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-xl border border-dashed border-border">
          <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
            {currentPhoto && <AvatarImage src={currentPhoto} alt="Official Photo" className="object-cover" />}
            <AvatarFallback className="text-lg font-semibold bg-muted text-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" className="gap-2 pointer-events-none min-h-[36px]">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {currentPhoto ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
            {currentPhoto && (
              <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue('photo_url', '')} className="text-destructive text-xs min-h-[36px]">
                Remove
              </Button>
            )}
          </div>
        </div>

        {/* Name */}
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name & Title</FormLabel>
            <FormControl>
              <Input placeholder="Hon. Juan Dela Cruz" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Position */}
        <FormField control={form.control} name="position" render={({ field }) => (
          <FormItem>
            <FormLabel>Position</FormLabel>
            <div className="space-y-2">
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select official position" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Or enter custom position..." {...field} />
            </div>
            <FormMessage />
          </FormItem>
        )} />

        {/* Committee */}
        <FormField control={form.control} name="committee" render={({ field }) => (
          <FormItem>
            <FormLabel>Committee / Designation (Optional)</FormLabel>
            <div className="space-y-2">
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select committee or assignment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COMMITTEES.map((comm) => (
                    <SelectItem key={comm} value={comm}>
                      {comm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Or enter custom committee name..." {...field} />
            </div>
            <FormMessage />
          </FormItem>
        )} />

        {/* Contact & Term */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="contact_number" render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <Input placeholder="0917-123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="term" render={({ field }) => (
            <FormItem>
              <FormLabel>Term of Office</FormLabel>
              <FormControl>
                <Input placeholder="2023 - 2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Display Order */}
        <FormField control={form.control} name="display_order" render={({ field }) => (
          <FormItem>
            <FormLabel>Display Order (Priority)</FormLabel>
            <FormControl>
              <Input type="number" min={0} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button type="submit" disabled={form.formState.isSubmitting || uploading} className="min-h-[44px] px-6">
            {form.formState.isSubmitting ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
            ) : defaultValues?.id ? (
              'Update Official'
            ) : (
              'Add Official'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function AdminOfficialsRoute() {
  const officials = Route.useLoaderData()
  const router = useRouter()
  const [editItem, setEditItem] = useState<Official | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{id: string, name: string} | null>(null)

  async function handleDelete(id: string) {
    try {
      await deleteOfficial({ data: id })
      toast.success('Official deleted successfully')
      router.invalidate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete official')
    }
    setDeleteItem(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Barangay Officials</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Manage Barangay Daine leadership, Kagawad committees, and organizational chart order.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px] px-4 font-semibold shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Add Official
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Barangay Official</DialogTitle>
            </DialogHeader>
            <OfficialForm
              defaultValues={{ display_order: (officials.length ?? 0) + 1 }}
              onSuccess={() => {
                setCreateOpen(false)
                router.invalidate()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* List / Cards */}
      <div className="space-y-3">
        {officials.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No barangay officials added yet. Click "Add Official" to add the first official.
            </CardContent>
          </Card>
        ) : (
          officials.map((official) => {
            const initials = official.name
              .replace(/^Hon\.\s+|^Ms\.\s+|^Mr\.\s+/, '')
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <Card key={official.id} className="hover:border-primary/40 transition-colors">
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Avatar className="h-14 w-14 border shrink-0">
                        {official.photo_url && <AvatarImage src={official.photo_url} alt={official.name} className="object-cover" />}
                        <AvatarFallback className="font-semibold bg-muted text-foreground">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/20">
                            Order #{official.display_order}
                          </Badge>
                          <Badge className="text-xs font-semibold">
                            {official.position}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {official.term}
                          </span>
                        </div>

                        <CardTitle className="text-base font-bold truncate">{official.name}</CardTitle>

                        {official.committee && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{official.committee}</span>
                          </p>
                        )}

                        {official.contact_number && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{official.contact_number}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Dialog open={editItem?.id === official.id} onOpenChange={(open) => setEditItem(open ? official : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Official Details</DialogTitle>
                          </DialogHeader>
                          <OfficialForm
                            defaultValues={official}
                            onSuccess={() => {
                              setEditItem(null)
                              router.invalidate()
                            }}
                          />
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteItem({ id: official.id, name: official.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600">
            Are you sure you want to delete <strong>{deleteItem?.name}</strong> from officials? This action cannot be undone.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteItem && handleDelete(deleteItem.id)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
