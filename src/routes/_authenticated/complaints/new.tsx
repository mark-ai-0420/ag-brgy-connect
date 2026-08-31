import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useAuth } from '#/hooks/useAuth'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useState } from 'react'
import { uploadComplaintPhoto } from '#/lib/upload'

import { Button } from '#/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  Volume2,
  Trash2,
  Scale,
  Building2,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  Clock,
  Calendar,
  MapPin,
  UploadCloud,
  X,
  CheckCircle2,
  ArrowLeft,
  Info,
  Users,
  FileText,
  PhoneCall,
  Gavel,
} from 'lucide-react'

// Schema strictly aligned with Database CHECK constraints
const formSchema = z.object({
  title: z.string().min(3, 'Incident title must be at least 3 characters').max(100, 'Title is too long (max 100)'),
  category: z.enum([
    'Noise Complaint',
    'Sanitation & Trash',
    'Public Safety / Nuisance',
    'Boundary / Property',
    'Barangay Staff / Official',
    'Street Lights & Infra',
    'Dispute / Blotter',
    'Others',
  ], {
    error: 'Please select a valid complaint category',
  }),
  description: z.string().min(10, 'Please provide a detailed narrative (at least 10 characters)'),
  location: z.string().optional(),
  incident_date: z.string().optional(),
  is_anonymous: z.boolean().default(false),
  barangay: z.enum(['daine_1', 'daine_2']),
})

type FormValues = z.infer<typeof formSchema>

const createComplaint = createServerFn({ method: 'POST' })
  .validator((d: FormValues) => formSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: inserted, error } = await supabase
      .from('complaints')
      .insert({
        complainant_id: user.id,
        title: data.title,
        category: data.category,
        description: data.description,
        location: data.location || null,
        incident_date: data.incident_date || null,
        is_anonymous: data.is_anonymous,
        barangay: data.barangay,
        status: 'pending',
        priority: 'medium',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Complaint creation error:', error)
      throw new Error(error.message || 'Failed to file incident report')
    }

    return { id: inserted.id }
  })

const updateComplaintPhoto = createServerFn({ method: 'POST' })
  .validator((d: { id: string; photo_url: string }) => z.object({ id: z.string(), photo_url: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('complaints')
      .update({ photo_url: data.photo_url })
      .eq('id', data.id)

    if (error) {
      console.error('Photo update error:', error)
      throw new Error('Failed to attach evidence photo')
    }
  })

const getResidentBarangay = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'daine_1'
  const { data: profile } = await supabase.from('profiles').select('barangay').eq('id', user.id).single()
  return (profile?.barangay as 'daine_1' | 'daine_2') || 'daine_1'
})

export const Route = createFileRoute('/_authenticated/complaints/new')({
  component: NewComplaintRoute,
  loader: () => getResidentBarangay(),
})

const CATEGORY_OPTIONS: Array<{
  value: FormValues['category']
  label: string
  icon: typeof Volume2
  description: string
}> = [
  {
    value: 'Noise Complaint',
    label: 'Noise Complaint',
    icon: Volume2,
    description: 'Videoke, loud machinery, midnight disturbances',
  },
  {
    value: 'Dispute / Blotter',
    label: 'Dispute / Blotter',
    icon: Gavel,
    description: 'Neighborhood conflicts, verbal altercations, mediation requests',
  },
  {
    value: 'Boundary / Property',
    label: 'Boundary & Property',
    icon: Scale,
    description: 'Right of way, fencing, fence encroachments, land boundaries',
  },
  {
    value: 'Public Safety / Nuisance',
    label: 'Public Safety & Nuisance',
    icon: ShieldAlert,
    description: 'Obstructions, reckless behavior, hazards, animal nuisances',
  },
  {
    value: 'Sanitation & Trash',
    label: 'Sanitation & Waste',
    icon: Trash2,
    description: 'Illegal dumping, burning of garbage, sewer drainage overflow',
  },
  {
    value: 'Street Lights & Infra',
    label: 'Street Lights & Infra',
    icon: Lightbulb,
    description: 'Damaged streetlights, road hazards, clogged barangay waterways',
  },
  {
    value: 'Barangay Staff / Official',
    label: 'Official / Staff Conduct',
    icon: Building2,
    description: 'Service delivery issues, staff grievances, administrative feedback',
  },
  {
    value: 'Others',
    label: 'Other Civic Concerns',
    icon: HelpCircle,
    description: 'General community concerns requiring barangay attention',
  },
]

function NewComplaintRoute() {
  const defaultBarangay = Route.useLoaderData()
  const navigate = useNavigate()
  const { role } = useAuth()

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      category: 'Dispute / Blotter',
      description: '',
      location: '',
      incident_date: '',
      is_anonymous: false,
      barangay: defaultBarangay,
    },
  })

  const selectedCategory = form.watch('category')
  const isAnonymous = form.watch('is_anonymous')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit')
        return
      }
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleRemovePhoto = () => {
    setPhoto(null)
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
      setPhotoPreview(null)
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      setIsUploading(true)
      const res = await createComplaint({ data: values })

      if (photo && res.id) {
        toast.info('Uploading evidence photo...')
        const photoUrl = await uploadComplaintPhoto(photo, res.id)
        if (photoUrl) {
          await updateComplaintPhoto({ data: { id: res.id, photo_url: photoUrl } })
        }
      }

      toast.success('Incident / Blotter report filed successfully. A case docket has been recorded.')
      navigate({ to: '/complaints/$complaintId', params: { complaintId: res.id } })
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit incident report')
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6">
        <Button
          variant="ghost"
          asChild
          className="mb-3 -ml-2 text-muted-foreground hover:text-foreground inline-flex items-center gap-2 min-h-[44px]"
        >
          <Link to="/complaints">
            <ArrowLeft className="h-4 w-4" />
            Back to Incident Reports
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs uppercase font-semibold">
                Katarungang Pambarangay
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Blotter Intake
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              File Incident or Dispute Report
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Official intake for community disputes, public disturbances, and Lupon Tagapamayapa conciliation.
            </p>
          </div>
        </div>
      </div>

      {/* Staff Alert Banner */}
      {(role === 'admin' || role === 'moderator') && (
        <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/90 dark:bg-blue-950/40 dark:border-blue-800 text-blue-950 dark:text-blue-200 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <span className="font-semibold">Staff Account Notice:</span> You are currently viewing the resident incident filing intake. To manage, schedule hearings, or update blotter logs, proceed to{' '}
            <Link to="/admin/complaints" className="font-semibold underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300">
              Admin Blotter Management
            </Link>
            .
          </div>
        </div>
      )}

      {/* Confidential Filing Banner */}
      <div className="mb-8 rounded-2xl border-2 border-primary/20 bg-linear-to-r from-blue-950/90 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-yellow-400 shrink-0 mt-0.5">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base sm:text-lg text-white">Confidential Blotter & Intake Protocol</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <Lock className="h-3 w-3" /> RA 10173 & RA 7160 Compliant
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                Every report filed is protected under the <strong>Data Privacy Act of 2012</strong> and the <strong>Katarungang Pambarangay Law</strong>. Your statements and attached evidence are secured and handled strictly by the Punong Barangay and the authorized Lupon Tagapamayapa committee.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout: Left Form Wizard, Right Lupon Explainer Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Intake Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Incident Information & Narrative</CardTitle>
              <CardDescription>
                Provide detailed and truthful information to facilitate swift barangay conciliation or emergency dispatch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Anonymous Whistleblowing Switch Card */}
                  <FormField
                    control={form.control}
                    name="is_anonymous"
                    render={({ field }) => (
                      <FormItem className="rounded-xl border-2 border-border/80 bg-muted/40 p-4 sm:p-5 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className={`p-2.5 rounded-xl border transition-colors shrink-0 mt-0.5 ${
                              field.value
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border'
                            }`}>
                              {field.value ? <EyeOff className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FormLabel className="text-base font-bold cursor-pointer">
                                  Anonymous Whistleblowing Mode
                                </FormLabel>
                                {field.value ? (
                                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px] font-semibold">
                                    Identity Protected
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Standard Record
                                  </Badge>
                                )}
                              </div>
                              <FormDescription className="text-xs sm:text-sm leading-relaxed">
                                When enabled, your name will be masked from public blotter extracts and opposing parties. Authorized Barangay Peace & Order officers retain an encrypted reference for official summons.
                              </FormDescription>
                            </div>
                          </div>

                          {/* Accessible Toggle Button */}
                          <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={field.value}
                              onClick={() => field.onChange(!field.value)}
                              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[28px] ${
                                field.value ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            >
                              <span className="sr-only">Toggle Anonymous Whistleblowing Mode</span>
                              <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  field.value ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Category Selector Chips */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-bold text-foreground">
                            Dispute & Incident Category <span className="text-destructive">*</span>
                          </FormLabel>
                          <span className="text-xs text-muted-foreground">Select one category</span>
                        </div>
                        
                        {/* Interactive Chips Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {CATEGORY_OPTIONS.map((cat) => {
                            const IconComponent = cat.icon
                            const isSelected = field.value === cat.value
                            return (
                              <button
                                key={cat.value}
                                type="button"
                                onClick={() => field.onChange(cat.value)}
                                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary shadow-xs ring-2 ring-primary/30 font-semibold'
                                    : 'border-border bg-card hover:bg-muted/70 text-foreground'
                                }`}
                              >
                                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="text-sm font-semibold flex items-center gap-1.5">
                                    {cat.label}
                                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                                  </div>
                                  <div className={`text-xs line-clamp-1 ${isSelected ? 'text-primary/90' : 'text-muted-foreground'}`}>
                                    {cat.description}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Title & Jurisdiction */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">
                            Incident Title / Subject <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Boundary encroachment on Purok 2 lot"
                              className="h-11 min-h-[44px] text-sm bg-background border-input focus-visible:border-primary focus-visible:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="barangay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">
                            Incident Jurisdiction <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 min-h-[44px] bg-background border-input">
                                <SelectValue placeholder="Select barangay" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daine_1" className="min-h-[44px]">
                                Barangay Daine 1 (Indang)
                              </SelectItem>
                              <SelectItem value="daine_2" className="min-h-[44px]">
                                Barangay Daine 2 (Indang)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Location & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            Specific Location / Purok
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Purok 3, Near Barangay Plaza / Basketball Court"
                              className="h-11 min-h-[44px] text-sm bg-background border-input focus-visible:border-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Mention landmarks, street names, or purok number.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="incident_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            Date & Time of Incident
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              className="h-11 min-h-[44px] text-sm bg-background border-input focus-visible:border-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Approximate date/time the incident occurred.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Narrative Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-semibold">
                            Incident Narrative & Statements <span className="text-destructive">*</span>
                          </FormLabel>
                          <span className="text-xs text-muted-foreground">Min. 10 characters</span>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Please narrate the events clearly: What happened? Who are the parties involved? What actions were taken, and what resolution or relief are you seeking from the Barangay?"
                            className="min-h-[140px] text-sm leading-relaxed bg-background border-input focus-visible:border-primary resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Be as factual and objective as possible. Include names or aliases of opposing parties if known.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Photo / Evidence Upload */}
                  <div className="space-y-3 pt-1">
                    <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                      <UploadCloud className="h-4 w-4 text-primary" />
                      Documentary & Photo Evidence (Optional)
                    </FormLabel>

                    {photoPreview ? (
                      <div className="relative rounded-xl border border-border bg-muted/30 p-3 flex flex-col sm:flex-row items-center gap-4">
                        <img
                          src={photoPreview}
                          alt="Evidence preview"
                          className="w-full sm:w-48 h-32 object-cover rounded-lg border border-border shadow-xs"
                        />
                        <div className="flex-1 space-y-1.5 text-center sm:text-left">
                          <p className="text-sm font-semibold truncate max-w-xs">{photo?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {photo ? (photo.size / (1024 * 1024)).toFixed(2) + ' MB' : ''}
                          </p>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemovePhoto}
                            className="min-h-[36px] mt-2 gap-1.5 text-xs"
                          >
                            <X className="h-3.5 w-3.5" /> Remove Attachment
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center transition-colors bg-muted/20">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          id="evidence-file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                          <div className="p-3 bg-primary/10 text-primary rounded-full">
                            <UploadCloud className="h-6 w-6" />
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            Click to upload or drag and drop photo evidence
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Supports PNG, JPG, JPEG up to 5MB (photos of damaged property, noise logs, receipts)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submission Action Bar */}
                  <div className="pt-4 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      className="min-h-[48px] px-6 text-sm font-semibold"
                      onClick={() => navigate({ to: '/complaints' })}
                    >
                      Cancel & Discard
                    </Button>
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting || isUploading}
                      className="btn-tactile min-h-[48px] px-8 font-bold text-base bg-primary text-primary-foreground shadow-md hover:bg-primary/90 cursor-pointer"
                    >
                      {form.formState.isSubmitting || isUploading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Recording Blotter Intake...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Submit Incident / Blotter Report
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Lupon Tagapamayapa Explainer Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mediation Timeline & Explainer */}
          <Card className="border-border shadow-xs bg-linear-to-b from-card to-muted/20">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Lupon Tagapamayapa Process</CardTitle>
                  <CardDescription className="text-xs">
                    Katarungang Pambarangay conciliation steps
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-300 dark:border-blue-800">
                  1
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground text-sm">Intake & Blotter Entry</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Barangay Secretary logs the complaint into the official blotter and verifies jurisdictional scope within 24–48 hours.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-800">
                  2
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground text-sm">Punong Barangay Mediation (1–15 Days)</p>
                  <p className="text-muted-foreground leading-relaxed">
                    The Barangay Captain summons (<em>Patawag</em>) the respondent and complainant for initial amicable mediation at the Barangay Hall.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-300 dark:border-purple-800">
                  3
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground text-sm">Pangkat Tagapagkasundo (15 Days)</p>
                  <p className="text-muted-foreground leading-relaxed">
                    If initial mediation fails, a 3-member Lupon conciliation panel is constituted to hear both parties in up to 3 hearings.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800">
                  4
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-foreground text-sm">Amicable Settlement (Kasunduan)</p>
                  <p className="text-muted-foreground leading-relaxed">
                    An agreement signed by both parties has the force and effect of a final court judgment after 10 days. If unresolved, a <strong>Certificate to File Action (CFA)</strong> is issued for court filing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Rights & Hearing Rules */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Mediation Rights & Advisory
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="p-2.5 rounded-lg bg-muted/60 border border-border">
                <p className="font-semibold text-foreground mb-1">⚖️ Section 415 Notice (No Lawyers Allowed)</p>
                <p>
                  Under Section 415 of the Local Government Code, parties must appear in person without legal counsel during Lupon mediation hearings.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">What to Prepare for Hearings:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Valid Government ID or Digital Resident ID</li>
                  <li>Original or printed copies of documentary/photo evidence</li>
                  <li>Names and contact information of direct witnesses</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 24/7 Barangay Peace & Order Action Center */}
          <Card className="border-border shadow-xs bg-muted/30">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-foreground">Barangay Security & Tanod Desk</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For active disturbances, domestic threats, or immediate physical emergencies, contact the 24/7 Barangay Action Desk directly:
              </p>
              <div className="bg-background rounded-lg p-2.5 border text-xs font-mono font-semibold text-foreground flex items-center justify-between">
                <span>Daine Action Center:</span>
                <span className="text-primary font-bold">(046) 415-XXXX / 911</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
