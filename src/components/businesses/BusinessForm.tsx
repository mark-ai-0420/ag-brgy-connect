import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import {
  Store,
  Image as ImageIcon,
  Utensils,
  Sparkles,
  MessageSquare,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Building2,
  Navigation,
  Loader2,
  CheckCircle2,
  Banknote,
  Smartphone,
  QrCode,
  Building,
  ExternalLink,
  RotateCcw,
  Compass,
  Crosshair,
  ShieldCheck,
  Info,
  Droplets,
  Scissors,
  Wrench,
  Stethoscope,
  Pill,
  Palette,
  Check
} from 'lucide-react'
import { ImageUploader } from '#/components/common/ImageUploader'
import { toast } from 'sonner'

export const CATEGORIES = [
  'Sari-Sari Store',
  'Eatery / Carenderia',
  'Water Station',
  'Laundry',
  'Salon',
  'Repair Shop',
  'Clinic',
  'Pharmacy',
  'Tailoring',
  'Others',
] as const

export const CATEGORY_ICONS: Record<string, typeof Store> = {
  'Sari-Sari Store': Store,
  'Eatery / Carenderia': Utensils,
  'Water Station': Droplets,
  'Laundry': Sparkles,
  'Salon': Scissors,
  'Repair Shop': Wrench,
  'Clinic': Stethoscope,
  'Pharmacy': Pill,
  'Tailoring': Palette,
  'Others': Building2,
}

export const PUROK_OPTIONS = [
  'Purok 1',
  'Purok 2',
  'Purok 3',
  'Purok 4',
  'Purok 5',
  'Purok 6',
  'Purok 7',
] as const

export const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash (On-site / COD)', icon: Banknote, sub: 'Physical cash' },
  { id: 'GCash', label: 'GCash', icon: Smartphone, sub: 'QR / Express Send' },
  { id: 'Maya', label: 'Maya', icon: QrCode, sub: 'QR / Wallet' },
  { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building, sub: 'InstaPay / PESONet' },
] as const

export const HOURS_PRESETS = [
  'Daily 6:00 AM – 8:00 PM',
  'Daily 7:00 AM – 9:00 PM',
  'Mon–Sat 7:00 AM – 6:00 PM',
  'Mon–Sat 8:00 AM – 5:00 PM',
  'Mon–Fri 8:00 AM – 5:00 PM',
  'Open 24/7 (Always Open)',
] as const

export const PUROK_COORDINATE_PRESETS: Record<'daine_1' | 'daine_2', Record<string, { lat: number; lng: number; label: string }>> = {
  daine_1: {
    'Purok 1': { lat: 14.1962, lng: 120.8785, label: 'Purok 1 (North Area)' },
    'Purok 2': { lat: 14.1955, lng: 120.8798, label: 'Purok 2 (Brgy Hall & Plaza)' },
    'Purok 3': { lat: 14.1942, lng: 120.8810, label: 'Purok 3 (Elem School / Market)' },
    'Purok 4': { lat: 14.1925, lng: 120.8802, label: 'Purok 4 (Tanod Outpost)' },
    'Purok 5': { lat: 14.1915, lng: 120.8780, label: 'Purok 5 (South Zone)' },
    'Purok 6': { lat: 14.1930, lng: 120.8760, label: 'Purok 6 (Sitio East)' },
    'Purok 7': { lat: 14.1950, lng: 120.8750, label: 'Purok 7 (Sitio West)' },
  },
  daine_2: {
    'Purok 1': { lat: 14.1982, lng: 120.8845, label: 'Purok 1 (Sitio Ilaya)' },
    'Purok 2': { lat: 14.1970, lng: 120.8860, label: 'Purok 2 (Daine 2 Hall)' },
    'Purok 3': { lat: 14.1958, lng: 120.8875, label: 'Purok 3 (Sitio Ibaba)' },
    'Purok 4': { lat: 14.1945, lng: 120.8890, label: 'Purok 4 (Boundary Road)' },
    'Purok 5': { lat: 14.1930, lng: 120.8905, label: 'Purok 5 (Sitio Maligaya)' },
    'Purok 6': { lat: 14.1965, lng: 120.8920, label: 'Purok 6 (Farmview)' },
    'Purok 7': { lat: 14.1980, lng: 120.8935, label: 'Purok 7 (Upper Ridge)' },
  },
}

export const businessFormSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  barangay: z.enum(['daine_1', 'daine_2'], {
    required_error: 'Please select a barangay unit',
  }),
  purok: z.string().optional().default(''),
  address: z.string().min(5, 'Please provide a complete address / landmark'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  phone: z.string().min(7, 'Please provide a valid contact number'),
  messenger_link: z.string().optional().default(''),
  payment_methods: z.array(z.string()).default(['Cash', 'GCash']),
  hours: z.string().optional().default(''),
  description: z.string().optional().default(''),
  map_url: z.string().url('Must be a valid URL').optional().or(z.literal('')).default(''),
  photo_url: z.string().nullable().optional(),
  menu_image_url: z.string().nullable().optional(),
  misc_image_url: z.string().nullable().optional(),
})

export type BusinessFormValues = z.infer<typeof businessFormSchema>

// Helper to compute live preview of hours
function getHoursStatusPreview(raw?: string) {
  if (!raw || !raw.trim()) {
    return { label: 'Hours Not Specified', color: 'bg-muted text-muted-foreground border-border' }
  }
  const str = raw.toLowerCase()
  if (str.includes('24/7') || str.includes('24 hours') || str.includes('always open')) {
    return { label: 'Open 24/7', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' }
  }

  const timeMatch = raw.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
  )

  if (timeMatch) {
    let startHour = parseInt(timeMatch[1], 10)
    const startMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const startAmPm = (timeMatch[3] || '').toLowerCase()

    let endHour = parseInt(timeMatch[4], 10)
    const endMin = timeMatch[5] ? parseInt(timeMatch[5], 10) : 0
    const endAmPm = (timeMatch[6] || '').toLowerCase()

    let inferredStartAmPm = startAmPm
    if (!startAmPm && endAmPm) {
      if (endAmPm === 'pm' && startHour < endHour) {
        inferredStartAmPm = 'pm'
      } else if (endAmPm === 'pm' && startHour > endHour && startHour !== 12) {
        inferredStartAmPm = 'am'
      } else if (endAmPm === 'am') {
        inferredStartAmPm = 'am'
      }
    }

    if (inferredStartAmPm === 'pm' && startHour < 12) startHour += 12
    if (inferredStartAmPm === 'am' && startHour === 12) startHour = 0

    if (endAmPm === 'pm' && endHour < 12) endHour += 12
    if (endAmPm === 'am' && endHour === 12) endHour = 0

    const startTotal = startHour * 60 + startMin
    const endTotal = endHour * 60 + endMin

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    let isOpen = false
    if (startTotal <= endTotal) {
      isOpen = currentMinutes >= startTotal && currentMinutes <= endTotal
    } else {
      isOpen = currentMinutes >= startTotal || currentMinutes <= endTotal
    }

    if (isOpen) {
      return {
        label: 'Will Show as "Open Now"',
        color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold',
      }
    } else {
      return {
        label: 'Will Show as "Closed Now"',
        color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold',
      }
    }
  }

  return { label: 'Custom Hours Listed', color: 'bg-primary/10 text-primary border-primary/20' }
}

interface BusinessFormProps {
  initialValues?: Partial<BusinessFormValues>
  onSubmit: (values: BusinessFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  mode: 'create' | 'edit'
}

export function BusinessForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode,
}: BusinessFormProps) {
  const [isLocating, setIsLocating] = useState(false)

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema) as any,
    defaultValues: {
      name: initialValues?.name ?? '',
      category: initialValues?.category ?? '',
      barangay: initialValues?.barangay ?? 'daine_1',
      purok: initialValues?.purok ?? '',
      address: initialValues?.address ?? '',
      latitude: initialValues?.latitude ?? null,
      longitude: initialValues?.longitude ?? null,
      phone: initialValues?.phone ?? '',
      messenger_link: initialValues?.messenger_link ?? '',
      payment_methods: initialValues?.payment_methods ?? ['Cash', 'GCash'],
      hours: initialValues?.hours ?? '',
      description: initialValues?.description ?? '',
      map_url: initialValues?.map_url ?? '',
      photo_url: initialValues?.photo_url ?? null,
      menu_image_url: initialValues?.menu_image_url ?? null,
      misc_image_url: initialValues?.misc_image_url ?? null,
    },
  })

  const currentBarangay = form.watch('barangay')
  const currentLatitude = form.watch('latitude')
  const currentLongitude = form.watch('longitude')
  const currentHours = form.watch('hours')
  const currentPaymentMethods = form.watch('payment_methods') || []
  const currentCategory = form.watch('category')
  const currentPurok = form.watch('purok')

  const hoursStatus = useMemo(() => getHoursStatusPreview(currentHours), [currentHours])

  // Get GPS from browser geolocation API
  const handleGetGPS = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const lat = Number(latitude.toFixed(6))
        const lng = Number(longitude.toFixed(6))
        form.setValue('latitude', lat, { shouldValidate: true, shouldDirty: true })
        form.setValue('longitude', lng, { shouldValidate: true, shouldDirty: true })
        toast.success(`GPS coordinates captured! (${lat}, ${lng})`)
        setIsLocating(false)
      },
      (error) => {
        console.error('GPS error:', error)
        toast.error(error.message || 'Unable to retrieve your current location.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  // Anchor preset selection
  const handleSelectPurokPreset = (purokKey: string) => {
    const presets = PUROK_COORDINATE_PRESETS[currentBarangay] || PUROK_COORDINATE_PRESETS.daine_1
    const preset = presets[purokKey]
    if (preset) {
      form.setValue('purok', purokKey, { shouldValidate: true, shouldDirty: true })
      form.setValue('latitude', preset.lat, { shouldValidate: true, shouldDirty: true })
      form.setValue('longitude', preset.lng, { shouldValidate: true, shouldDirty: true })
      toast.success(`Coordinates set to ${preset.label}`)
    }
  }

  const handleResetCoordinates = () => {
    form.setValue('latitude', null, { shouldValidate: true, shouldDirty: true })
    form.setValue('longitude', null, { shouldValidate: true, shouldDirty: true })
    toast.info('GPS coordinates cleared.')
  }

  // Calculate coordinates for map preview
  const previewLat = currentLatitude || (currentBarangay === 'daine_2' ? 14.1970 : 14.1955)
  const previewLng = currentLongitude || (currentBarangay === 'daine_2' ? 120.8860 : 120.8798)
  const hasCustomCoordinates = currentLatitude !== null && currentLatitude !== undefined && currentLongitude !== null && currentLongitude !== undefined

  const mapEmbedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${previewLng - 0.005}%2C${previewLat - 0.0035}%2C${previewLng + 0.005}%2C${previewLat + 0.0035}&layer=mapnik&marker=${previewLat}%2C${previewLng}`
  const externalMapLink = `https://www.openstreetmap.org/?mlat=${previewLat}&mlon=${previewLng}#map=17/${previewLat}/${previewLng}`

  const togglePaymentMethod = (methodId: string) => {
    const current = currentPaymentMethods
    if (current.includes(methodId)) {
      form.setValue(
        'payment_methods',
        current.filter((m) => m !== methodId),
        { shouldValidate: true, shouldDirty: true }
      )
    } else {
      form.setValue('payment_methods', [...current, methodId], {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }

  const handleSubmit = (values: BusinessFormValues) => {
    return onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        
        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN: Business Core Identity, Contact & Operating Info      */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Card 1: Core Identification & Categorization */}
            <Card className="border border-border/80 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      Business Identity &amp; Category
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Enter official or trade name and select the best business category.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-5">
                {/* Business Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Business Name <span className="text-destructive">*</span></span>
                        <span className="text-[11px] font-normal text-muted-foreground lowercase">Store or trade name</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Aling Nena's Sari-Sari Store & Eatery"
                          className="h-11 text-sm rounded-xl font-medium focus-visible:ring-primary min-h-[44px]"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category Dropdown & Barangay Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => {
                      const SelectedIcon = CATEGORY_ICONS[field.value] || Store
                      return (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            Category <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger className="min-h-[44px] h-11 rounded-xl text-sm font-medium">
                                <div className="flex items-center gap-2 truncate">
                                  {field.value && <SelectedIcon className="h-4 w-4 text-primary shrink-0" />}
                                  <SelectValue placeholder="Select business type" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-72">
                              {CATEGORIES.map((cat) => {
                                const IconComp = CATEGORY_ICONS[cat] || Store
                                return (
                                  <SelectItem key={cat} value={cat} className="min-h-[44px] cursor-pointer py-2 text-sm font-medium">
                                    <div className="flex items-center gap-2.5">
                                      <IconComp className="h-4 w-4 text-primary/80" />
                                      <span>{cat}</span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  {/* Barangay Scope */}
                  <FormField
                    control={form.control}
                    name="barangay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary" /> Barangay Jurisdiction <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger className="min-h-[44px] h-11 rounded-xl text-sm font-medium">
                              <SelectValue placeholder="Select barangay" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daine_1" className="min-h-[44px] cursor-pointer py-2 text-sm font-medium">
                              <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                Barangay Daine I
                              </span>
                            </SelectItem>
                            <SelectItem value="daine_2" className="min-h-[44px] cursor-pointer py-2 text-sm font-medium">
                              <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                                Barangay Daine II
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Purok and Street Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="purok"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-1">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> Purok / Zone
                        </FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val)
                            // Auto anchor to purok preset if available
                            const presets = PUROK_COORDINATE_PRESETS[currentBarangay] || PUROK_COORDINATE_PRESETS.daine_1
                            if (presets[val] && !hasCustomCoordinates) {
                              form.setValue('latitude', presets[val].lat, { shouldDirty: true })
                              form.setValue('longitude', presets[val].lng, { shouldDirty: true })
                            }
                          }}
                          value={field.value || undefined}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="min-h-[44px] h-11 rounded-xl text-sm font-medium">
                              <SelectValue placeholder="Select Purok" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PUROK_OPTIONS.map((p) => (
                              <SelectItem key={p} value={p} className="min-h-[44px] cursor-pointer py-2 text-sm font-medium">
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>Street Address &amp; Landmark <span className="text-destructive">*</span></span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="House No., Street, Landmark (e.g. Near Catholic Chapel)"
                            className="h-11 text-sm rounded-xl font-medium focus-visible:ring-primary min-h-[44px]"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* About / Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>About Your Business &amp; Specialties (Optional)</span>
                        <span className="text-[11px] font-normal text-muted-foreground">What makes you unique</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell your neighbors about your popular items, specialties, free delivery within Daine, catering services, or wholesale discounts..."
                          className="resize-none text-sm min-h-[96px] rounded-xl font-medium leading-relaxed focus-visible:ring-primary"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Card 2: Operating Hours & Accepted Payment Methods */}
            <Card className="border border-border/80 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      Operating Schedule &amp; Payments
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Help residents know when you are open and what payment options you accept.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-6">
                {/* Operating Hours Selector with Quick Presets */}
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" /> Store Operating Hours
                        </FormLabel>
                        <span className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full border ${hoursStatus.color}`}>
                          {hoursStatus.label}
                        </span>
                      </div>

                      {/* Quick Presets Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="text-[11px] text-muted-foreground font-semibold self-center mr-1">
                          Quick Presets:
                        </span>
                        {HOURS_PRESETS.map((preset) => {
                          const isActive = field.value === preset
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => field.onChange(preset)}
                              disabled={isSubmitting}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all min-h-[36px] flex items-center cursor-pointer ${
                                isActive
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                              }`}
                            >
                              {preset}
                            </button>
                          )
                        })}
                      </div>

                      <FormControl>
                        <Input
                          placeholder="e.g. Mon–Sat 7:00 AM – 7:00 PM (or choose a preset above)"
                          className="h-11 text-sm rounded-xl font-medium focus-visible:ring-primary min-h-[44px]"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Our real-time directory algorithm automatically marks your store as "Open Now" or "Closed Now" based on this schedule.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Accepted Payment Method Chips */}
                <FormField
                  control={form.control}
                  name="payment_methods"
                  render={() => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-primary" /> Accepted Payment Methods <span className="text-destructive">*</span>
                      </FormLabel>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {PAYMENT_METHODS.map((method) => {
                          const isSelected = currentPaymentMethods.includes(method.id)
                          const IconComp = method.icon
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => togglePaymentMethod(method.id)}
                              disabled={isSubmitting}
                              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all min-h-[50px] cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/40'
                                  : 'bg-card hover:bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg shrink-0 ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  <IconComp className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className={`text-sm font-bold leading-tight ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                                    {method.label}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {method.sub}
                                  </p>
                                </div>
                              </div>

                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all ${
                                  isSelected
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground/40 bg-transparent'
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Card 3: Contact & Direct Messenger Channels */}
            <Card className="border border-border/80 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      Contact &amp; Instant Communication
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Enable 1-tap phone calls and direct Facebook Messenger chat for customers.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone / Mobile */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-primary" /> Contact Number <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 0917-123-4567"
                            className="h-11 text-sm rounded-xl font-medium focus-visible:ring-primary min-h-[44px]"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px] text-muted-foreground">
                          Provides instant 1-tap "Call" action on mobile.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Messenger Link */}
                  <FormField
                    control={form.control}
                    name="messenger_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" /> Facebook Messenger (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://m.me/yourpage or username"
                            className="h-11 text-sm rounded-xl font-medium focus-visible:ring-primary min-h-[44px]"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px] text-muted-foreground">
                          Allows instant chat via Facebook Messenger.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* External Custom Map URL */}
                <FormField
                  control={form.control}
                  name="map_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 text-primary" /> Google Maps / OpenStreetMap Link (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://maps.google.com/?q=..."
                          className="h-11 text-sm rounded-xl font-medium focus-visible:ring-primary min-h-[44px]"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

          </div>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN: Storefront Photos & GIS Map Coordinate Helpers        */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card 4: Storefront & Showcase Photo Upload Zone */}
            <Card className="border border-border/80 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      Storefront &amp; Photo Showcase
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Upload high quality storefront photos to attract neighborhood visitors.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-5">
                {/* Main Hero Storefront Photo */}
                <FormField
                  control={form.control}
                  name="photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5 text-primary" />
                          Primary Storefront / Facade
                        </span>
                        <span className="text-[11px] font-semibold text-primary">Recommended</span>
                      </FormLabel>
                      <FormControl>
                        <ImageUploader
                          bucket="business-photos"
                          value={field.value}
                          onChange={field.onChange}
                          label=""
                          helperText="Primary storefront, facade, or signage (JPEG, PNG, WebP up to 5MB)"
                          aspectRatio="video"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sub Photo Gallery Slots (Menu & Products) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Menu / Rates */}
                  <FormField
                    control={form.control}
                    name="menu_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Utensils className="h-3.5 w-3.5 text-primary" />
                          Menu / Price List
                        </FormLabel>
                        <FormControl>
                          <ImageUploader
                            bucket="business-photos"
                            value={field.value}
                            onChange={field.onChange}
                            label=""
                            helperText="Pricelist, menu card, or service list"
                            aspectRatio="square"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Products / Interior */}
                  <FormField
                    control={form.control}
                    name="misc_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          Products / Interior
                        </FormLabel>
                        <FormControl>
                          <ImageUploader
                            bucket="business-photos"
                            value={field.value}
                            onChange={field.onChange}
                            label=""
                            helperText="Product showcase or dining area"
                            aspectRatio="square"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Photo Quality Notice */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Listings with clear storefront signage and menu photos receive up to <strong>3x more customer inquiries</strong> on the directory!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Interactive GIS Map Pin & GPS Helpers */}
            <Card className="border border-border/80 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Navigation className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">
                        GIS Map Pin &amp; GPS Anchor
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Pinpoint your store for the Barangay Interactive GIS Map.
                      </CardDescription>
                    </div>
                  </div>

                  {hasCustomCoordinates && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Pinned
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-5">
                {/* Geolocation Trigger & Clear Coordinates */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetGPS}
                    disabled={isLocating || isSubmitting}
                    className="min-h-[44px] text-xs font-bold gap-2 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer flex-1 sm:flex-none shadow-2xs btn-tactile rounded-xl"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Acquiring GPS...
                      </>
                    ) : (
                      <>
                        <Crosshair className="h-4 w-4 text-primary" />
                        Capture Current GPS Location
                      </>
                    )}
                  </Button>

                  {hasCustomCoordinates && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetCoordinates}
                      disabled={isSubmitting}
                      className="min-h-[44px] text-xs font-semibold text-muted-foreground hover:text-destructive cursor-pointer rounded-xl"
                      title="Clear coordinates"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Reset Pin
                    </Button>
                  )}
                </div>

                {/* Purok Preset Anchor Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-primary" /> Quick Purok Preset Anchors
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Tap a Purok button to snap coordinates to that zone's recognized center:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    {PUROK_OPTIONS.map((purokKey) => {
                      const presets = PUROK_COORDINATE_PRESETS[currentBarangay] || PUROK_COORDINATE_PRESETS.daine_1
                      const preset = presets[purokKey]
                      const isSelectedPurok = currentPurok === purokKey && hasCustomCoordinates && currentLatitude === preset?.lat
                      return (
                        <button
                          key={purokKey}
                          type="button"
                          onClick={() => handleSelectPurokPreset(purokKey)}
                          disabled={isSubmitting}
                          className={`text-xs px-2.5 py-2 rounded-xl border text-center transition-all min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
                            isSelectedPurok
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold ring-1 ring-primary/40'
                              : 'bg-muted/30 hover:bg-muted text-foreground/80 hover:text-foreground border-border/80 font-medium'
                          }`}
                        >
                          <span className="leading-tight">{purokKey}</span>
                          <span className={`text-[10px] ${isSelectedPurok ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {currentBarangay === 'daine_2' ? 'Daine 2' : 'Daine 1'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Coordinate Inputs */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground">Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="14.1955"
                            className="h-10 text-xs rounded-xl font-mono"
                            value={field.value !== null && field.value !== undefined ? field.value : ''}
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val === '' ? null : parseFloat(val))
                            }}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase text-muted-foreground">Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="120.8798"
                            className="h-10 text-xs rounded-xl font-mono"
                            value={field.value !== null && field.value !== undefined ? field.value : ''}
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val === '' ? null : parseFloat(val))
                            }}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Live Embedded Map Preview */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Live Map Pin Preview
                    </span>
                    <a
                      href={externalMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Expand Map
                    </a>
                  </div>

                  <div className="relative w-full rounded-2xl overflow-hidden border border-border/80 shadow-inner bg-muted aspect-[16/10]">
                    <iframe
                      src={mapEmbedSrc}
                      title="Business Location Preview"
                      className="absolute inset-0 w-full h-full border-0 pointer-events-auto"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-xs text-foreground flex items-center gap-1.5 pointer-events-none">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{previewLat.toFixed(4)}°, {previewLng.toFixed(4)}°</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* BOTTOM ACTION BAR: High-Contrast Tactile Submit & Cancel Buttons     */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <Card className="border border-border/80 shadow-md rounded-2xl bg-card/95 backdrop-blur-md sticky bottom-4 z-20">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {mode === 'create'
                  ? 'Your listing will be reviewed and verified by barangay administrators.'
                  : 'Changes will reflect across the directory and interactive GIS map immediately.'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                type="button"
                className="min-h-[44px] h-12 px-6 font-semibold rounded-xl cursor-pointer hover:bg-muted w-full sm:w-auto text-sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] h-12 px-8 font-extrabold text-sm rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg btn-tactile cursor-pointer w-full sm:w-auto gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Listing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{mode === 'create' ? 'Submit Business Listing' : 'Save Changes'}</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

      </form>
    </Form>
  )
}
