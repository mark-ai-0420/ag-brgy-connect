import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '#/components/common/PageHeader'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '#/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Badge } from '#/components/ui/badge'
import {
  Phone,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Shield,
  Flame,
  Ambulance,
  Radio,
  Zap,
  Droplets,
  HelpCircle,
  Building2,
  PhoneCall,
  Search,
  Check,
  AlertCircle,
  SlidersHorizontal,
  ExternalLink,
  LifeBuoy
} from 'lucide-react'
import { toast } from 'sonner'

const contactSchema = z.object({
  name: z.string().min(2, 'Name or organization is required'),
  label: z.string().optional(),
  phone: z.string().min(3, 'Phone number is required'),
  display_order: z.coerce.number().default(0),
  scope: z.enum(['daine_1', 'daine_2', 'both']).default('both'),
})

const getContacts = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role, barangay')
    .eq('user_id', user.id)
    .maybeSingle()

  const adminScope = roleData?.barangay ?? 'both'

  let query = supabase
    .from('emergency_contacts')
    .select('*')
    .order('display_order', { ascending: true })

  if (adminScope !== 'both') {
    query = query.in('scope', [adminScope, 'both'])
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching emergency contacts:', error)
    return { contacts: [], adminScope }
  }

  return { contacts: data ?? [], adminScope }
})

const upsertContact = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string().optional() }).merge(contactSchema).parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    if (data.id) {
      const { error } = await supabase
        .from('emergency_contacts')
        .update({
          name: data.name,
          label: data.label,
          phone: data.phone,
          display_order: data.display_order,
          scope: data.scope,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase
        .from('emergency_contacts')
        .insert({
          name: data.name,
          label: data.label,
          phone: data.phone,
          display_order: data.display_order,
          scope: data.scope,
        })
      if (error) throw new Error(error.message)
    }
    return { success: true }
  })

const reorderContacts = createServerFn({ method: 'POST' })
  .validator(
    (data: unknown) =>
      z
        .object({
          items: z.array(
            z.object({
              id: z.string(),
              display_order: z.number(),
            })
          ),
        })
        .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    for (const item of data.items) {
      await supabase
        .from('emergency_contacts')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
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

type Contact = Awaited<ReturnType<typeof getContacts>>['contacts'][number]

function getHotlineCategory(name: string, label?: string | null) {
  const text = `${name} ${label || ''}`.toLowerCase()
  if (text.includes('pnp') || text.includes('police') || text.includes('pulis')) {
    return { icon: Shield, label: 'Law Enforcement', color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' }
  }
  if (text.includes('bfp') || text.includes('fire') || text.includes('bumbero')) {
    return { icon: Flame, label: 'Fire & Rescue', color: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' }
  }
  if (text.includes('rhu') || text.includes('health') || text.includes('ambulance') || text.includes('hospital') || text.includes('medical')) {
    return { icon: Ambulance, label: 'Medical & Health', color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' }
  }
  if (text.includes('mdrrmo') || text.includes('disaster') || text.includes('rescue')) {
    return { icon: Radio, label: 'Disaster & MDRRMO', color: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' }
  }
  if (text.includes('electric') || text.includes('power') || text.includes('batelec') || text.includes('meralco')) {
    return { icon: Zap, label: 'Power Utility', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' }
  }
  if (text.includes('water') || text.includes('tubig')) {
    return { icon: Droplets, label: 'Water Utility', color: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800' }
  }
  return { icon: LifeBuoy, label: 'Public Assistance', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' }
}

function ContactForm({
  defaultValues,
  adminScope,
  onSuccess,
  onCancel,
}: {
  defaultValues?: Partial<Contact>
  adminScope: string
  onSuccess: () => void
  onCancel?: () => void
}) {
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? '',
      label: defaultValues?.label ?? '',
      phone: defaultValues?.phone ?? '',
      display_order: defaultValues?.display_order ?? 0,
      scope: (defaultValues?.scope as any) ?? (adminScope === 'both' ? 'both' : adminScope),
    },
  })

  async function onSubmit(values: z.infer<typeof contactSchema>) {
    try {
      await upsertContact({ data: { id: defaultValues?.id, ...values } })
      toast.success(defaultValues?.id ? 'Emergency contact updated!' : 'Emergency contact created!')
      onSuccess()
    } catch {
      toast.error('Failed to save emergency contact')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">Service Name / Agency</FormLabel>
              <FormControl>
                <Input placeholder="e.g. MDRRMO Indang / Barangay Daine Tanod Outpost" className="min-h-[44px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">Classification / Tag (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 24/7 Hotline / Primary Dispatch" className="min-h-[44px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">Phone / Hotline Number</FormLabel>
                <FormControl>
                  <Input placeholder="09XX-XXX-XXXX or (046) XXX-XXXX" className="min-h-[44px] font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="display_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">Display Priority (Lower # = Higher)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" className="min-h-[44px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {adminScope === 'both' && (
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Jurisdiction (Dual Scope)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="both" className="min-h-[40px]">Both (All Daine / Inter-Barangay)</SelectItem>
                      <SelectItem value="daine_1" className="min-h-[40px]">Barangay Daine 1 Only</SelectItem>
                      <SelectItem value="daine_2" className="min-h-[40px]">Barangay Daine 2 Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t">
          {onCancel && (
            <Button type="button" variant="outline" className="min-h-[44px] px-4 font-medium" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting} className="min-h-[44px] px-5 font-semibold">
            {form.formState.isSubmitting ? 'Saving...' : defaultValues?.id ? 'Update Hotline' : 'Add Hotline'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function AdminEmergencyRoute() {
  const { contacts, adminScope } = Route.useLoaderData()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'both' | 'daine_1' | 'daine_2'>('all')
  const [editItem, setEditItem] = useState<Contact | null>(null)
  const [quickPhoneItem, setQuickPhoneItem] = useState<Contact | null>(null)
  const [quickPhoneVal, setQuickPhoneVal] = useState('')
  const [isUpdatingQuickPhone, setIsUpdatingQuickPhone] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reorder single step up/down
  async function handleShiftOrder(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= contacts.length) return

    const currentItem = contacts[index]
    const targetItem = contacts[targetIndex]

    const updatedItems = [
      { id: currentItem.id, display_order: targetItem.display_order },
      { id: targetItem.id, display_order: currentItem.display_order },
    ]

    // If their display_orders were identical, generate explicit indices
    if (currentItem.display_order === targetItem.display_order) {
      updatedItems[0].display_order = direction === 'up' ? currentItem.display_order - 1 : currentItem.display_order + 1
    }

    try {
      await reorderContacts({ data: { items: updatedItems } })
      toast.success('Priority order updated')
      router.invalidate()
    } catch {
      toast.error('Failed to update priority order')
    }
  }

  // Quick Inline Phone Editor Save
  async function handleSaveQuickPhone() {
    if (!quickPhoneItem || !quickPhoneVal.trim()) return
    setIsUpdatingQuickPhone(true)
    try {
      await upsertContact({
        data: {
          id: quickPhoneItem.id,
          name: quickPhoneItem.name,
          label: quickPhoneItem.label || undefined,
          phone: quickPhoneVal.trim(),
          display_order: quickPhoneItem.display_order,
          scope: quickPhoneItem.scope as any,
        },
      })
      toast.success('Hotline phone updated!')
      setQuickPhoneItem(null)
      setQuickPhoneVal('')
      router.invalidate()
    } catch {
      toast.error('Failed to update phone number')
    } finally {
      setIsUpdatingQuickPhone(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteContact({ data: deleteTarget.id })
      toast.success(`Deleted hotline "${deleteTarget.name}"`)
      setDeleteTarget(null)
      router.invalidate()
    } catch {
      toast.error('Failed to delete hotline')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.label && c.label.toLowerCase().includes(q))

    const matchesScope =
      scopeFilter === 'all'
        ? true
        : scopeFilter === 'both'
          ? c.scope === 'both'
          : c.scope === scopeFilter

    return matchesSearch && matchesScope
  })

  const dualScopeCount = contacts.filter((c) => c.scope === 'both').length
  const daine1Count = contacts.filter((c) => c.scope === 'daine_1').length
  const daine2Count = contacts.filter((c) => c.scope === 'daine_2').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">
            <Radio className="h-3.5 w-3.5" />
            24/7 First Responder & Public Safety Directory
          </span>
        }
        title="Hotline Directory Manager"
        description="Manage emergency dispatch hotlines, configure priority response order, set dual-jurisdiction tags, and verify phone numbers."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="min-h-[44px] px-4 font-semibold shadow-sm">
                <Plus className="h-4 w-4 mr-2" /> Add Emergency Hotline
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Emergency Contact</DialogTitle>
                <DialogDescription>
                  Add an emergency line or public safety dispatch number for Barangay Daine.
                </DialogDescription>
              </DialogHeader>
              <ContactForm
                adminScope={adminScope}
                onSuccess={() => {
                  setCreateOpen(false)
                  router.invalidate()
                }}
                onCancel={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-red-500 bg-red-50/20 dark:bg-red-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Hotlines</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{contacts.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <PhoneCall className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dual Scope (All Daine)</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{dualScopeCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daine 1 Lines</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{daine1Count}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-purple-50/20 dark:bg-purple-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daine 2 Lines</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{daine2Count}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <LifeBuoy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search hotline by agency, tag, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 min-h-[44px] text-sm"
            />
          </div>

          {adminScope === 'both' && (
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { key: 'all', label: 'All Jurisdictions', count: contacts.length },
                { key: 'both', label: 'Dual Scope', count: dualScopeCount },
                { key: 'daine_1', label: 'Daine 1', count: daine1Count },
                { key: 'daine_2', label: 'Daine 2', count: daine2Count },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setScopeFilter(tab.key as any)}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    scopeFilter === tab.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[11px] opacity-80">({tab.count})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Hotlines List with Priority Order Toggles & Quick Phone Editor */}
      <div className="space-y-2.5">
        {filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Phone className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="font-semibold text-foreground">No emergency contacts found.</p>
              <p className="text-xs text-muted-foreground mt-1">Try resetting search or adding a new contact.</p>
            </CardContent>
          </Card>
        ) : (
          filteredContacts.map((contact, index) => {
            const cat = getHotlineCategory(contact.name, contact.label)
            const CatIcon = cat.icon
            const isFirst = index === 0
            const isLast = index === filteredContacts.length - 1

            return (
              <Card
                key={contact.id}
                className="hover:border-primary/40 transition-colors shadow-sm overflow-hidden"
              >
                <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Priority Rank & Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Reorder Priority Controls */}
                    <div className="flex flex-col items-center gap-1 shrink-0 bg-muted/60 p-1 rounded-lg border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 min-h-[28px] min-w-[28px] rounded p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        onClick={() => handleShiftOrder(index, 'up')}
                        disabled={isFirst}
                        title="Move Up in priority"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <span
                        className="text-[11px] font-mono font-bold text-muted-foreground leading-none px-1"
                        title="Display Order Index"
                      >
                        #{contact.display_order ?? index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 min-h-[28px] min-w-[28px] rounded p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        onClick={() => handleShiftOrder(index, 'down')}
                        disabled={isLast}
                        title="Move Down in priority"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Agency Category Avatar */}
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shrink-0 ${cat.color}`}>
                      <CatIcon className="h-5 w-5" />
                    </div>

                    {/* Name, Label & Dual-Jurisdiction Tags */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-bold text-foreground text-sm truncate max-w-[240px] sm:max-w-md">
                          {contact.name}
                        </p>

                        {/* Dual Jurisdiction Badges */}
                        {contact.scope && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                              contact.scope === 'both'
                                ? 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                                : contact.scope === 'daine_1'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                  : 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                            }`}
                          >
                            {contact.scope === 'both' ? 'All Daine (Dual)' : contact.scope === 'daine_1' ? 'Daine 1 Only' : 'Daine 2 Only'}
                          </span>
                        )}

                        {contact.label && (
                          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5">
                            {contact.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{cat.label}</p>
                    </div>
                  </div>

                  {/* Right: Phone quick editor & test dial & actions */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                    {/* Quick Phone Badge / Link */}
                    <a
                      href={`tel:${contact.phone}`}
                      className="min-h-[44px] inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm font-mono font-bold transition-colors group"
                      title="Click to test call"
                    >
                      <PhoneCall className="h-4 w-4 text-red-600 group-hover:scale-110 transition-transform" />
                      <span>{contact.phone}</span>
                    </a>

                    {/* Quick Phone Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] px-3 text-xs font-semibold"
                      onClick={() => {
                        setQuickPhoneItem(contact)
                        setQuickPhoneVal(contact.phone)
                      }}
                      title="Quick edit phone number"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                      Edit Phone
                    </Button>

                    {/* Edit Full Modal */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
                      onClick={() => setEditItem(contact)}
                      title="Edit full contact details"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete Trigger */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(contact)}
                      title="Delete emergency contact"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Quick Inline Phone Editor Dialog */}
      <Dialog open={Boolean(quickPhoneItem)} onOpenChange={(open) => !open && setQuickPhoneItem(null)}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Quick Phone Editor
            </DialogTitle>
            <DialogDescription>
              Update direct dispatch number for {quickPhoneItem?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <Input
                value={quickPhoneVal}
                onChange={(e) => setQuickPhoneVal(e.target.value)}
                placeholder="09XX-XXX-XXXX"
                className="min-h-[44px] font-mono text-base font-semibold"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] px-4 font-medium"
              onClick={() => setQuickPhoneItem(null)}
              disabled={isUpdatingQuickPhone}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-[44px] px-5 font-semibold"
              onClick={handleSaveQuickPhone}
              disabled={isUpdatingQuickPhone}
            >
              {isUpdatingQuickPhone ? 'Updating...' : 'Save Number'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Full Contact Dialog */}
      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Emergency Hotline</DialogTitle>
            <DialogDescription>
              Modify hotline details, jurisdiction scope, and display priority.
            </DialogDescription>
          </DialogHeader>
          {editItem && (
            <ContactForm
              adminScope={adminScope}
              defaultValues={editItem}
              onSuccess={() => {
                setEditItem(null)
                router.invalidate()
              }}
              onCancel={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Delete Hotline?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.phone}) from public emergency hotlines?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] px-4 font-medium"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-[44px] px-5 font-semibold"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Hotline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
