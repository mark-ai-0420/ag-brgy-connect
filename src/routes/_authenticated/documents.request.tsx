import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { useAuth } from '#/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '#/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { Badge } from '#/components/ui/badge'
import { toast } from 'sonner'
import {
  FileText,
  Loader2,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Building2,
  Check,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Home,
  HeartHandshake,
  Briefcase,
  Clock,
  RotateCcw,
  Info,
  QrCode,
  Calendar,
  AlertCircle,
  HelpCircle,
  Award,
} from 'lucide-react'
import { useState, useMemo } from 'react'

const formSchema = z.object({
  document_type: z.enum([
    'barangay_clearance',
    'barangay_id',
    'certificate_of_residency',
    'certificate_of_indigency',
    'business_permit',
    'other',
  ]),
  purpose: z.string().min(3, 'Please provide a valid purpose (at least 3 characters)'),
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  purok: z.string().optional(),
  barangay: z.enum(['daine_1', 'daine_2']).default('daine_1'),
})

type FormValues = z.infer<typeof formSchema>

const getRequestFormData = createServerFn({ method: 'GET' }).handler(async () => {
  const { user } = await getAuthSession()
  if (!user) return null
  const supabase = createSupabaseServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, address, purok, barangay, email')
    .eq('id', user.id)
    .maybeSingle()

  return {
    user,
    profile: profile || {
      id: user.id,
      full_name: (user.user_metadata as any)?.full_name || '',
      phone: '',
      address: '',
      purok: '',
      barangay: 'daine_1' as const,
      email: user.email,
    },
  }
})

const submitDocumentRequest = createServerFn({ method: 'POST' })
  .validator((data: unknown) => formSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { session } = await getAuthSession()

    if (!session) {
      throw new Error('Not authenticated')
    }

    // Sync profile details if edited
    if (data.phone || data.address || data.purok || data.full_name) {
      await supabase
        .from('profiles')
        .update({
          ...(data.full_name ? { full_name: data.full_name } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.address ? { address: data.address } : {}),
          ...(data.purok ? { purok: data.purok } : {}),
          ...(data.barangay ? { barangay: data.barangay } : {}),
        })
        .eq('id', session.user.id)
    }

    const { data: inserted, error } = await supabase
      .from('document_requests')
      .insert({
        requester_id: session.user.id,
        document_type: data.document_type,
        purpose: data.purpose,
        status: 'pending',
        barangay: data.barangay || 'daine_1',
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, id: inserted?.id }
  })

export const DOCUMENT_TYPES = [
  {
    id: 'barangay_clearance',
    title: 'Barangay Clearance',
    subtitle: 'Background & Character Clearance',
    description: 'Pre-employment, local background check, bank account, and official verification.',
    icon: ShieldCheck,
    fee: 50,
    turnaround: '1 Business Day',
    badge: 'Standard',
    colorClass: 'text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-800',
    requirements: ['1 Valid Government ID', 'Purok endorsement or recent cedula'],
  },
  {
    id: 'barangay_id',
    title: 'Barangay Resident ID',
    subtitle: 'Official Resident Identification',
    description: 'Civic resident identification card with verifiable digital QR stamp.',
    icon: CreditCard,
    fee: 50,
    turnaround: '2-3 Business Days',
    badge: 'Physical / Digital ID',
    colorClass: 'text-indigo-600 bg-indigo-500/10 border-indigo-200 dark:border-indigo-800',
    requirements: ['Proof of Residency (6+ months)', '1x1 ID Photo (or captured on site)', '1 Valid ID'],
  },
  {
    id: 'certificate_of_residency',
    title: 'Certificate of Residency',
    subtitle: 'Proof of Address & Residency',
    description: 'Proof of bona fide residence for school admission, scholarships, and utility applications.',
    icon: Home,
    fee: 50,
    turnaround: '1 Business Day',
    badge: 'Standard',
    colorClass: 'text-emerald-600 bg-emerald-500/10 border-emerald-200 dark:border-emerald-800',
    requirements: ['Valid Government ID', 'Proof of Billing or Purok Leader certification'],
  },
  {
    id: 'certificate_of_indigency',
    title: 'Certificate of Indigency',
    subtitle: 'Welfare & Indigency Assistance',
    description: 'Social welfare aid, medical and hospital discounts, public legal aid, and scholarship programs.',
    icon: HeartHandshake,
    fee: 0,
    isFree: true,
    turnaround: 'Same Day / 1 Day',
    badge: '100% Free',
    colorClass: 'text-amber-600 bg-amber-500/10 border-amber-200 dark:border-amber-800',
    requirements: ['Purok Leader endorsement', 'Valid ID or Community Tax Certificate'],
  },
  {
    id: 'business_permit',
    title: 'Barangay Business Clearance',
    subtitle: 'Commercial & MSME Licensing',
    description: 'Barangay clearance for municipal business permits and local enterprise renewals.',
    icon: Briefcase,
    fee: 50,
    turnaround: '2-3 Business Days',
    badge: 'For MSMEs',
    colorClass: 'text-purple-600 bg-purple-500/10 border-purple-200 dark:border-purple-800',
    requirements: ['DTI / SEC Registration', 'Barangay Inspection Clearance', 'Lease Contract / Proof of Location'],
  },
  {
    id: 'other',
    title: 'Other Certification',
    subtitle: 'Specialized Endorsement',
    description: 'Custom barangay certificate, good standing endorsement, or specialized civic certification.',
    icon: FileText,
    fee: 50,
    turnaround: '1-2 Business Days',
    badge: 'Specialized',
    colorClass: 'text-slate-600 bg-slate-500/10 border-slate-200 dark:border-slate-800',
    requirements: ['1 Valid Government ID', 'Detailed statement of purpose'],
  },
] as const

const PURPOSE_PRESETS = [
  { label: 'Local Employment / Job Application', type: 'barangay_clearance', purpose: 'Employment and pre-hiring background requirement' },
  { label: 'Official Resident ID Card', type: 'barangay_id', purpose: 'Official Barangay Resident Identification and civic verification' },
  { label: 'Proof of Residency / School Requirement', type: 'certificate_of_residency', purpose: 'Proof of bona fide residency for school admission and scholarship' },
  { label: 'Medical / Financial Indigency Aid', type: 'certificate_of_indigency', purpose: 'Social welfare and medical indigency assistance application' },
  { label: 'Barangay Business Clearance', type: 'business_permit', purpose: 'Barangay Commercial Clearance for municipal business licensing' },
  { label: 'Bank Account / Gov ID Application', type: 'barangay_clearance', purpose: 'Valid identification and proof of address for government and bank requirements' },
]

export const Route = createFileRoute('/_authenticated/documents/request')({
  component: DocumentRequestRoute,
  loader: () => getRequestFormData(),
})

function DocumentRequestRoute() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const loaderData = Route.useLoaderData()
  const profile = loaderData?.profile

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      document_type: 'barangay_clearance',
      purpose: '',
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      purok: profile?.purok || '',
      barangay: (profile?.barangay as 'daine_1' | 'daine_2') || 'daine_1',
    },
  })

  const [activePreset, setActivePreset] = useState<string | null>(null)
  const currentDocType = form.watch('document_type')
  const currentFullName = form.watch('full_name')
  const currentPurpose = form.watch('purpose')
  const currentBarangay = form.watch('barangay')

  const selectedDocConfig = useMemo(() => {
    return DOCUMENT_TYPES.find((d) => d.id === currentDocType) || DOCUMENT_TYPES[0]
  }, [currentDocType])

  const handleApplyPreset = (preset: typeof PURPOSE_PRESETS[0]) => {
    form.setValue('document_type', preset.type as any, { shouldValidate: true, shouldDirty: true })
    form.setValue('purpose', preset.purpose, { shouldValidate: true, shouldDirty: true })
    setActivePreset(preset.label)
    toast.success(`Applied 1-Click Preset: ${preset.label}`)
  }

  const handleSelectDocType = (docId: FormValues['document_type']) => {
    form.setValue('document_type', docId, { shouldValidate: true, shouldDirty: true })
    // If active preset doesn't match this doc type, clear preset tag
    if (activePreset) {
      const match = PURPOSE_PRESETS.find((p) => p.label === activePreset)
      if (match && match.type !== docId) {
        setActivePreset(null)
      }
    }
  }

  const handleResetToProfile = () => {
    if (profile) {
      form.setValue('full_name', profile.full_name || '')
      form.setValue('phone', profile.phone || '')
      form.setValue('address', profile.address || '')
      form.setValue('purok', profile.purok || '')
      form.setValue('barangay', (profile.barangay as 'daine_1' | 'daine_2') || 'daine_1')
      toast.success('Resident profile information restored.')
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      await submitDocumentRequest({ data: values })
      toast.success('Document request submitted successfully! Tracking number generated.')
      navigate({ to: '/dashboard' })
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit request. Please try again.')
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40 pb-16">
      {/* Page Header */}
      <div className="bg-background border-b border-border/80 sticky top-0 z-20 backdrop-blur-md bg-background/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs border border-primary/20">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                    Request Barangay Document
                  </h1>
                  <Badge variant="outline" className="hidden sm:inline-flex bg-primary/5 text-primary border-primary/20 text-[11px] font-bold">
                    Online Citizen Portal
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Official certificates & clearances processed directly by the Office of the Barangay Secretary.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToProfile}
                className="min-h-[38px] text-xs font-semibold rounded-xl gap-1.5 border-border hover:bg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Auto-fill with</span> Profile
              </Button>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="min-h-[38px] text-xs font-semibold rounded-xl">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Staff Notice Banner */}
        {(role === 'admin' || role === 'moderator') && (
          <div className="mb-6 p-4 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/90 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 flex items-start gap-3.5 shadow-xs">
            <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              <span className="font-bold">Barangay Staff View:</span> You are viewing the resident-facing document application form. To review, issue, and manage all incoming citizen certificate requests, visit the{' '}
              <Link to="/admin/documents" className="font-bold underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300">
                Admin Documents Console &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Smart Auto-Fill Verification Pill */}
        <div className="mb-6 p-3.5 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold tracking-tight text-emerald-950 dark:text-emerald-100">
                Resident Profile Connected &amp; Verified
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 truncate">
                Pre-populated from {profile?.full_name || 'your official record'} • {profile?.barangay === 'daine_2' ? 'Barangay Daine 2' : 'Barangay Daine 1'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white dark:bg-emerald-700 border-none text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Ready for 1-Click
            </Badge>
          </div>
        </div>

        {/* 2-Column Form Layout */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Controls & Document Selector (7/12 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Document Type Visual Selector Cards */}
                <Card className="border-border/80 shadow-md overflow-hidden">
                  <CardHeader className="pb-4 bg-muted/20 border-b border-border/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          1. Select Document Type
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Select the specific barangay certification or clearance you require.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {DOCUMENT_TYPES.map((doc) => {
                        const IconComponent = doc.icon
                        const isSelected = currentDocType === doc.id
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => handleSelectDocType(doc.id as any)}
                            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 min-h-[132px] cursor-pointer touch-target ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm'
                                : 'border-border/80 bg-card hover:bg-muted/40 hover:border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className={`p-2.5 rounded-xl shrink-0 ${doc.colorClass}`}>
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                {doc.isFree ? (
                                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-black tracking-wide px-2 py-0.5 rounded-md">
                                    FREE
                                  </Badge>
                                ) : (
                                  <span className="text-xs font-black text-foreground bg-muted px-2 py-0.5 rounded-md border border-border/60">
                                    ₱{doc.fee}.00
                                  </span>
                                )}
                                {isSelected && (
                                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="font-bold text-sm text-foreground tracking-tight line-clamp-1">
                                {doc.title}
                              </h3>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                                {doc.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground/80" />
                                {doc.turnaround}
                              </span>
                              <span className="uppercase text-[9px] font-bold text-muted-foreground/70 tracking-wider">
                                {doc.badge}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Hidden Form Field for validation mapping */}
                    <FormField
                      control={form.control}
                      name="document_type"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* 2. 1-Click Quick Purpose Presets & Purpose Textarea */}
                <Card className="border-border/80 shadow-md">
                  <CardHeader className="pb-3 bg-muted/20 border-b border-border/60">
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      2. Purpose of Request
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      State the official reason or choose a 1-click popular preset below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-5">
                    {/* Quick Presets Chips */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        Popular 1-Click Presets
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PURPOSE_PRESETS.map((preset) => {
                          const isSelected = activePreset === preset.label
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handleApplyPreset(preset)}
                              className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 touch-target ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                                  : 'border-border/80 bg-card hover:bg-muted/60 text-foreground'
                              }`}
                            >
                              <span className="truncate">{preset.label}</span>
                              {isSelected ? (
                                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                              ) : (
                                <ArrowRight className="h-3.5 w-3.5 opacity-40 shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Purpose Textarea */}
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-foreground flex items-center justify-between">
                            <span>Detailed Purpose Statement <span className="text-destructive">*</span></span>
                            <span className="text-[11px] font-normal text-muted-foreground">
                              {field.value?.length || 0} characters
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Employment requirement at Indang Municipal Health Office, Pre-hiring screening at ABC Corp, DepEd Senior High Scholarship admission requirement..."
                              className="resize-none min-h-[110px] text-sm rounded-xl focus-visible:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            This specific purpose will be printed directly onto your official certificate.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* 3. Resident Applicant Information */}
                <Card className="border-border/80 shadow-md">
                  <CardHeader className="pb-3 bg-muted/20 border-b border-border/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          3. Resident Applicant Information
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Verify or update your official citizen details for this certification.
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetToProfile}
                        className="text-xs font-semibold rounded-lg h-8 gap-1 hidden sm:flex"
                      >
                        <RotateCcw className="h-3 w-3" /> Reset
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              Full Legal Name <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Juan Dela Cruz"
                                {...field}
                                className="min-h-[44px] rounded-xl text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Contact Number */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              Mobile Contact Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="0917-123-4567"
                                {...field}
                                className="min-h-[44px] rounded-xl text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Barangay Jurisdiction */}
                      <FormField
                        control={form.control}
                        name="barangay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              Barangay Jurisdiction <span className="text-destructive">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="min-h-[44px] rounded-xl text-sm">
                                  <SelectValue placeholder="Select Barangay" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daine_1" className="min-h-[44px]">
                                  Barangay Daine 1
                                </SelectItem>
                                <SelectItem value="daine_2" className="min-h-[44px]">
                                  Barangay Daine 2
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Purok / Sitio */}
                      <FormField
                        control={form.control}
                        name="purok"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              Purok / Sitio
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Purok 2 (Centro), Sitio Ilaya"
                                {...field}
                                className="min-h-[44px] rounded-xl text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Residential Address */}
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                Residential Address in Barangay Daine
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="House No., Street, Sitio, Barangay Daine, Indang, Cavite"
                                  {...field}
                                  className="min-h-[44px] rounded-xl text-sm"
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Address will be printed as your official residence on issued documents.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Sticky Live Fee Calculation & Review Sidebar (5/12 cols) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                {/* Live Fee Calculation Card */}
                <Card className="border-border/80 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pb-4 border-b border-border/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base font-bold">Request Summary &amp; Assessment</CardTitle>
                      </div>
                      <Badge variant="outline" className="bg-background text-xs font-bold">
                        Live Preview
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-5 space-y-5">
                    {/* Selected Document Overview */}
                    <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/80 flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${selectedDocConfig.colorClass}`}>
                        <selectedDocConfig.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {selectedDocConfig.title}
                          </h4>
                          {selectedDocConfig.isFree ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5">
                              FREE
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-bold">
                              ₱{selectedDocConfig.fee}.00
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {selectedDocConfig.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Fee Breakdown Calculation */}
                    <div className="space-y-3 pt-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Official Fee Breakdown
                      </h5>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Document Processing Fee</span>
                          {selectedDocConfig.isFree ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              ₱0.00 (Waived)
                            </span>
                          ) : (
                            <span className="font-semibold text-foreground">
                              ₱{selectedDocConfig.fee}.00
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1">
                            Digital Citizen Convenience Fee
                            <Info className="h-3 w-3 text-muted-foreground/60" />
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            ₱0.00 (Free)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Holographic Dry Seal Stamp</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Included
                          </span>
                        </div>

                        <div className="border-t border-border pt-3 flex items-center justify-between font-bold text-base text-foreground">
                          <span>Total Amount Due</span>
                          {selectedDocConfig.isFree ? (
                            <div className="text-right">
                              <span className="text-emerald-600 dark:text-emerald-400 text-xl font-black">
                                FREE
                              </span>
                              <p className="text-[10px] font-normal text-muted-foreground">
                                0.00 PHP (Social Welfare Waiver)
                              </p>
                            </div>
                          ) : (
                            <div className="text-right">
                              <span className="text-primary text-xl font-black">
                                ₱{selectedDocConfig.fee}.00
                              </span>
                              <p className="text-[10px] font-normal text-muted-foreground">
                                Payable at Barangay Hall on release
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Turnaround Time & Processing Information */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 text-blue-950 dark:text-blue-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Estimated Turnaround: {selectedDocConfig.turnaround}</span>
                      </div>
                      <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                        Pickup at {currentBarangay === 'daine_2' ? 'Barangay Daine 2 Hall' : 'Barangay Daine 1 Hall'} during official office hours (Mon-Fri, 8:00 AM – 5:00 PM).
                      </p>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="space-y-2 pt-1">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Bring on Document Release:
                      </h5>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        {selectedDocConfig.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Digital Security Note */}
                    <div className="pt-2 border-t border-border/80 flex items-center gap-2.5 text-[11px] text-muted-foreground">
                      <QrCode className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        Includes authentic security Control No. and verifiable QR code scan on document.
                      </span>
                    </div>

                    {/* Form Submit & Action Buttons */}
                    <div className="pt-3 space-y-2.5">
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="w-full min-h-[48px] text-base font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md btn-tactile cursor-pointer transition-all"
                      >
                        {form.formState.isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Submitting Request...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-5 w-5" />
                            Submit Document Request
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        type="button"
                        className="w-full min-h-[42px] text-xs font-semibold rounded-xl cursor-pointer"
                        onClick={() => navigate({ to: '/dashboard' })}
                      >
                        Cancel &amp; Return to Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Resident Help Card */}
                <div className="p-4 rounded-2xl bg-card border border-border text-xs text-muted-foreground flex items-start gap-3 shadow-xs">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">Need urgent assistance?</p>
                    <p className="text-[11px] leading-relaxed">
                      For rush processing or special circumstances, call the Barangay Secretariat directly or visit the hall during operating hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
