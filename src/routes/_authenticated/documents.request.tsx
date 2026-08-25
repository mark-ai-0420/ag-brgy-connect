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
import { FileText, Loader2, ShieldAlert, Sparkles, CheckCircle2, User, Phone, MapPin, Building2, Check, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const formSchema = z.object({
  document_type: z.enum(['barangay_clearance', 'barangay_id', 'certificate_of_residency', 'certificate_of_indigency', 'business_permit', 'other']),
  purpose: z.string().min(3, 'Please provide a valid purpose (at least 3 characters)'),
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  purok: z.string().optional(),
  barangay: z.enum(['daine_1', 'daine_2']).default('daine_1'),
})

type FormValues = z.infer<typeof formSchema>

const getRequestFormData = createServerFn({ method: 'GET' })
  .handler(async () => {
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

  const handleApplyPreset = (preset: typeof PURPOSE_PRESETS[0]) => {
    form.setValue('document_type', preset.type as any)
    form.setValue('purpose', preset.purpose)
    setActivePreset(preset.label)
    toast.success(`Applied 1-Click Preset: ${preset.label}`)
  }

  async function onSubmit(values: FormValues) {
    try {
      await submitDocumentRequest({ data: values })
      toast.success('Document request submitted successfully!')
      navigate({ to: '/dashboard' })
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit request. Please try again.')
      console.error(error)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-2xl shrink-0 text-primary">
          <FileText className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Barangay Document</h1>
          <p className="text-muted-foreground mt-0.5 text-sm sm:text-base">
            1-Click Smart Auto-Fill powered by your verified resident profile.
          </p>
        </div>
      </div>

      {/* Staff Account Banner */}
      {(role === 'admin' || role === 'moderator') && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/90 text-blue-950 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <span className="font-semibold">Staff Account Notice:</span> You are viewing the resident document request portal. To review, issue, and manage certificates, head to the{' '}
            <Link to="/admin/documents" className="font-semibold underline underline-offset-2 hover:text-blue-700">
              Admin Documents Console &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Auto-fill Status Banner */}
      <div className="p-3.5 rounded-2xl border border-emerald-300/80 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-tight">
              Smart Auto-Fill Active
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate">
              Resident credentials and address pre-populated from your official record.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900 border-emerald-300 text-emerald-800 dark:text-emerald-200 text-[10px] uppercase font-bold shrink-0">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
        </Badge>
      </div>

      {/* Main Request Form */}
      <Card className="shadow-lg border-border/80">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Document Request Details</CardTitle>
          <CardDescription>
            Choose your document type or click a 1-click preset below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 1-Click Purpose Presets */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  1-Click Quick Presets (Auto-fills Document & Purpose)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PURPOSE_PRESETS.map((preset) => {
                    const isSelected = activePreset === preset.label
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                            : 'border-border bg-card hover:bg-muted/60 text-foreground'
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

              {/* Document Type Selection */}
              <FormField
                control={form.control}
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Document Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Select a document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="barangay_clearance" className="min-h-[44px]">
                          Barangay Clearance
                        </SelectItem>
                        <SelectItem value="barangay_id" className="min-h-[44px]">
                          Barangay Resident ID Card
                        </SelectItem>
                        <SelectItem value="certificate_of_residency" className="min-h-[44px]">
                          Certificate of Residency
                        </SelectItem>
                        <SelectItem value="certificate_of_indigency" className="min-h-[44px]">
                          Certificate of Indigency
                        </SelectItem>
                        <SelectItem value="business_permit" className="min-h-[44px]">
                          Barangay Business Clearance / Permit
                        </SelectItem>
                        <SelectItem value="other" className="min-h-[44px]">
                          Other Barangay Certification
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Purpose Textarea */}
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Purpose of Request</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="State the specific purpose of this document request (e.g., Employment requirement at ABC Corp, Scholarship application, Bank account opening)..."
                        className="resize-none h-28 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Provide sufficient details for the Barangay Secretary to process your certification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resident Profile Auto-Fill Details Section */}
              <div className="pt-2 space-y-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold tracking-tight">Resident Applicant Information</h4>
                    <p className="text-xs text-muted-foreground">Auto-populated from your resident profile</p>
                  </div>
                  <Link
                    to="/settings/profile"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Edit Profile &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Full Legal Name" {...field} className="min-h-[40px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone / Contact */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Contact Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="0917-xxx-xxxx" {...field} className="min-h-[40px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Barangay Unit */}
                  <FormField
                    control={form.control}
                    name="barangay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Barangay Jurisdiction
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="min-h-[40px]">
                              <SelectValue placeholder="Select Barangay" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daine_1">Barangay Daine 1</SelectItem>
                            <SelectItem value="daine_2">Barangay Daine 2</SelectItem>
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
                        <FormLabel className="text-xs font-semibold flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Purok / Sitio
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Purok 2 (Centro), Sitio Ilaya" {...field} className="min-h-[40px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Residential Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="House No., Street / Sitio, Barangay Daine, Indang, Cavite" {...field} className="min-h-[40px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  type="button"
                  className="min-h-[44px] px-5 rounded-xl cursor-pointer"
                  onClick={() => navigate({ to: '/dashboard' })}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="min-h-[44px] px-7 font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
