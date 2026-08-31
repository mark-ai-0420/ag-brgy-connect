import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  MapPin,
  Building2,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  Check,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { toast } from 'sonner'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useAuth } from '#/hooks/useAuth'
import { clearAuthCache } from '#/server/auth'

const signUpFnSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  barangay: z.enum(['daine_1', 'daine_2']),
  purok: z.string().min(1),
})

const signUpFn = createServerFn({ method: 'POST' })
  .validator(signUpFnSchema)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          barangay: data.barangay,
          purok: data.purok,
        },
      },
    })
    if (error) throw new Error(error.message)
    
    // If session was created automatically (email confirmation disabled in Supabase)
    const autoLoggedIn = !!authData.session
    return { success: true, autoLoggedIn }
  })

export const Route = createFileRoute('/auth/sign-up')({
  head: () => ({
    meta: [
      {
        title: 'Citizen Registration | Barangay Daine Unified Portal',
      },
      {
        name: 'description',
        content: 'Register for your official Barangay Daine 1 & 2 resident account.',
      },
      {
        property: 'og:title',
        content: 'Citizen Registration | Barangay Daine Unified Portal',
      },
      {
        property: 'og:description',
        content: 'Register for your official Barangay Daine 1 & 2 resident account.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }),
  component: SignUp,
})

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full legal name is required (min 2 characters)'),
  email: z.string().email('Please enter a valid email address'),
  barangay: z.enum(['daine_1', 'daine_2'], {
    required_error: 'Please select your barangay jurisdiction',
  }),
  purok: z.string().min(1, 'Purok or Sitio is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
})

type SignUpFormValues = z.infer<typeof signUpSchema>

const PUROK_QUICK_SELECT = [
  'Purok 1',
  'Purok 2',
  'Purok 3',
  'Purok 4',
  'Sitio Ilaya',
  'Sitio Ibaba',
]

function SignUp() {
  const router = useRouter()
  const { refreshAuth } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      barangay: 'daine_1',
      purok: 'Purok 1',
    },
  })

  const passwordValue = form.watch('password') || ''
  const selectedBarangay = form.watch('barangay')
  const selectedPurok = form.watch('purok')

  const hasMinLength = passwordValue.length >= 6

  async function onSubmit(data: SignUpFormValues) {
    try {
      const res = await signUpFn({
        data: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          barangay: data.barangay,
          purok: data.purok,
        },
      })
      
      if (res.autoLoggedIn) {
        clearAuthCache()
        await refreshAuth()
        await router.invalidate()
        toast.success('Resident account created successfully! Welcome to BrgyConnect.')
        router.navigate({ to: '/dashboard' })
      } else {
        toast.success('Registration successful! Please check your email or sign in.')
        router.navigate({ to: '/auth/sign-in' })
      }
    } catch (error: Error | unknown) {
      const msg = error instanceof Error ? error.message : ''
      if (msg.includes('rate limit')) {
        toast.error('Email rate limit reached. Please wait a few minutes or contact barangay support.')
      } else {
        toast.error(msg || 'Failed to register account')
      }
    }
  }

  return (
    <main className="min-h-[100dvh] w-full flex flex-col justify-center items-center relative px-4 py-10 bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      {/* Decorative ambient civic glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[500px] bg-gradient-to-b from-[#0038A8]/15 via-[#CE1126]/10 to-transparent blur-3xl opacity-70" 
      />

      {/* Back button */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-black/5 dark:hover:bg-white/5 btn-tactile cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal Home
        </Link>
        <Badge variant="outline" className="bg-background/80 backdrop-blur-md text-[11px] font-semibold text-muted-foreground border-border/80">
          Official Resident Enrollment
        </Badge>
      </div>

      {/* Glassmorphic Registration Card */}
      <div className="glass-dock card-hover w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-white/40 dark:border-white/10 shadow-xl backdrop-blur-xl bg-card/90 dark:bg-slate-900/85 space-y-6 relative z-10">
        {/* Header & Seal */}
        <div className="space-y-3 text-center">
          <div className="relative inline-block">
            <img
              src="/logo.jpg"
              alt="Official Seal of Barangay Daine"
              width="64"
              height="64"
              loading="eager"
              decoding="async"
              className="h-16 w-16 rounded-full object-cover mx-auto ring-4 ring-[#0038A8]/25 dark:ring-sky-400/30 shadow-md p-0.5 bg-background"
            />
            <span className="absolute -bottom-1 -right-1 bg-[#0038A8] text-white rounded-full p-1 shadow-sm ring-2 ring-background">
              <Sparkles className="h-3 w-3" />
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Create Citizen Account
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Enroll in the Barangay Daine Unified Civic Management System
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Legal Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold text-foreground">
                    Full Legal Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Juan Dela Cruz"
                        autoComplete="name"
                        aria-label="Full legal name"
                        className="min-h-[44px] rounded-xl border-border/90 bg-background/80 pl-10 focus-visible:ring-primary/40 text-sm"
                        {...field}
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-destructive" />
                </FormItem>
              )}
            />

            {/* Email Address */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold text-foreground">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        autoComplete="email"
                        aria-label="Email address"
                        className="min-h-[44px] rounded-xl border-border/90 bg-background/80 pl-10 focus-visible:ring-primary/40 text-sm"
                        {...field}
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-destructive" />
                </FormItem>
              )}
            />

            {/* Barangay Jurisdiction Selector */}
            <FormField
              control={form.control}
              name="barangay"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold text-foreground">
                    Barangay Jurisdiction
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => field.onChange('daine_1')}
                        className={`min-h-[44px] px-3 py-2.5 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all btn-tactile cursor-pointer ${
                          field.value === 'daine_1'
                            ? 'border-[#0038A8] bg-[#0038A8]/10 dark:bg-sky-950/40 text-[#0038A8] dark:text-sky-300 shadow-xs'
                            : 'border-border/80 bg-background/80 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Daine 1</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-80">Gov. Ferrer Zone</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => field.onChange('daine_2')}
                        className={`min-h-[44px] px-3 py-2.5 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all btn-tactile cursor-pointer ${
                          field.value === 'daine_2'
                            ? 'border-[#0038A8] bg-[#0038A8]/10 dark:bg-sky-950/40 text-[#0038A8] dark:text-sky-300 shadow-xs'
                            : 'border-border/80 bg-background/80 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Daine 2</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-80">Heritage & Agro</span>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-destructive" />
                </FormItem>
              )}
            />

            {/* Purok / Sitio Selector */}
            <FormField
              control={form.control}
              name="purok"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-bold text-foreground">
                      Purok / Sitio
                    </FormLabel>
                    <span className="text-[11px] text-muted-foreground">Select or type</span>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {PUROK_QUICK_SELECT.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => field.onChange(p)}
                            className={`min-h-[38px] px-2 py-1 text-[11px] font-bold rounded-lg border transition-all btn-tactile cursor-pointer ${
                              field.value === p
                                ? 'border-[#0038A8] bg-[#0038A8] text-white shadow-xs'
                                : 'border-border/80 bg-background/80 hover:bg-muted text-foreground'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Or type specific Purok / Sitio"
                          aria-label="Purok or Sitio"
                          className="min-h-[44px] rounded-xl border-border/90 bg-background/80 pl-10 focus-visible:ring-primary/40 text-sm"
                          {...field}
                        />
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-destructive" />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold text-foreground">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="At least 6 characters"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        aria-label="Account password"
                        className="min-h-[44px] rounded-xl border-border/90 bg-background/80 pl-10 pr-12 focus-visible:ring-primary/40 text-sm"
                        {...field}
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted/80 active:bg-muted active:scale-95 transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 z-10"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  {/* Password requirement checklist badge */}
                  <div className="flex items-center gap-1.5 pt-0.5 text-[11px]">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-colors ${
                        hasMinLength
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {hasMinLength ? (
                        <Check className="h-3 w-3 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      )}
                      Minimum 6 characters
                    </div>
                  </div>
                  <FormMessage className="text-xs font-semibold text-destructive" />
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold text-foreground">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Re-type password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        aria-label="Confirm password"
                        className="min-h-[44px] rounded-xl border-border/90 bg-background/80 pl-10 pr-12 focus-visible:ring-primary/40 text-sm"
                        {...field}
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted/80 active:bg-muted active:scale-95 transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 z-10"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs font-semibold text-destructive" />
                </FormItem>
              )}
            />

            {/* Register CTA Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full min-h-[48px] bg-[#0038A8] hover:bg-[#002d87] active:bg-[#00246b] text-white font-bold text-base rounded-xl shadow-md gap-2 transition-all btn-tactile cursor-pointer"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Citizen Account…
                  </>
                ) : (
                  'Complete Resident Registration'
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* High-contrast footer with sign-in link */}
        <div className="border-t border-border/60 pt-4 text-center space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Already enrolled with an account?{' '}
            <Link
              to="/auth/sign-in"
              className="text-[#0038A8] dark:text-sky-400 font-extrabold hover:underline inline-flex items-center min-h-[44px] -my-2 px-1 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-md"
            >
              Sign In
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Republic of the Philippines • Barangay e-Governance</span>
          </div>
        </div>
      </div>
    </main>
  )
}
