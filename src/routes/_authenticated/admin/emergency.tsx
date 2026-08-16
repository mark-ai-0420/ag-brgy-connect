import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Pencil, Trash2, Plus, Phone, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  label: z.string().optional(),
  phone: z.string().min(7, 'Phone number is required'),
  display_order: z.coerce.number().default(0),
})

const getContacts = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('emergency_contacts')
    .select('*')
    .order('display_order', { ascending: true })
  return data ?? []
})

const upsertContact = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string().optional() }).merge(contactSchema).parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    if (data.id) {
      const { error } = await supabase.from('emergency_contacts')
        .update({ name: data.name, label: data.label, phone: data.phone, display_order: data.display_order })
        .eq('id', data.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('emergency_contacts')
        .insert({ name: data.name, label: data.label, phone: data.phone, display_order: data.display_order })
      if (error) throw new Error(error.message)
    }
    return { success: true }
  })

const deleteContact = createServerFn({ method: 'POST' })
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/emergency')({
  component: AdminEmergencyRoute,
  loader: () => getContacts(),
})

type Contact = Awaited<ReturnType<typeof getContacts>>[number]

function ContactForm({ defaultValues, onSuccess }: { defaultValues?: Partial<Contact>; onSuccess: () => void }) {
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? '',
      label: defaultValues?.label ?? '',
      phone: defaultValues?.phone ?? '',
      display_order: defaultValues?.display_order ?? 0,
    },
  })

  async function onSubmit(values: z.infer<typeof contactSchema>) {
    try {
      await upsertContact({ data: { id: defaultValues?.id, ...values } })
      toast.success(defaultValues?.id ? 'Contact updated!' : 'Contact added!')
      onSuccess()
    } catch {
      toast.error('Failed to save contact')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name / Organization</FormLabel>
            <FormControl><Input placeholder="e.g. Barangay Hall" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="label" render={({ field }) => (
          <FormItem>
            <FormLabel>Label (Optional)</FormLabel>
            <FormControl><Input placeholder="e.g. Emergency Hotline" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl><Input placeholder="09XX-XXX-XXXX" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="display_order" render={({ field }) => (
          <FormItem>
            <FormLabel>Display Order</FormLabel>
            <FormControl><Input type="number" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : defaultValues?.id ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function AdminEmergencyRoute() {
  const contacts = Route.useLoaderData()
  const router = useRouter()
  const [editItem, setEditItem] = useState<Contact | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return
    try {
      await deleteContact({ data: id })
      toast.success('Contact deleted')
      router.invalidate()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emergency Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage hotlines shown to the public.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px] px-4 font-semibold"><Plus className="h-4 w-4 mr-2" />Add Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Emergency Contact</DialogTitle></DialogHeader>
            <ContactForm onSuccess={() => { setCreateOpen(false); router.invalidate() }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {contacts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No contacts added yet.</CardContent>
          </Card>
        ) : contacts.map(contact => (
          <Card key={contact.id}>
            <CardContent className="py-3.5 px-4 flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
              <div className="bg-red-100 p-2.5 rounded-full shrink-0">
                <Phone className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{contact.name}</p>
                {contact.label && <p className="text-xs text-muted-foreground">{contact.label}</p>}
              </div>
              <p className="text-sm font-mono font-semibold">{contact.phone}</p>
              <div className="flex items-center gap-1 shrink-0">
                <Dialog open={editItem?.id === contact.id} onOpenChange={open => setEditItem(open ? contact : null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
                    <ContactForm defaultValues={contact} onSuccess={() => { setEditItem(null); router.invalidate() }} />
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                  onClick={() => handleDelete(contact.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
