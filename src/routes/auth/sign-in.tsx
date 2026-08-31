import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock, Mail, ArrowLeft, ShieldCheck, Sparkles, Loader2 } from 'lucide-react'
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

const signInFnSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Server function — signs in and sets the session cookie server-side
const signInFn = createServerFn({ method: 'POST' })
  .validator(signInFnSchema)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) throw new Error(error.message)

    // Query user_roles table for role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .single()

    const role = userRole?.role ?? 'resident'
    const redirectUrl = role === 'admin' || role === 'moderator' ? '/admin/businesses' : '/dashboard'

    return { success: true, role, redirectUrl }
  })

export const Route = createFileRoute('/auth/sign-in')({
  head: () => ({
    meta: [
      {
        title: 'Citizen Sign In | Barangay Daine Unified Portal',
      },
      {
        name: 'description',
        content: 'Sign in to your Barangay Daine resident or administrative civic account.',
      },
      {
        property: 'og:title',
        content: 'Citizen Sign In | Barangay Daine Unified Portal',
      },
      {
        property: 'og:description',
        content: 'Sign in to your Barangay Daine resident or administrative civic account.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }),
  component: SignIn,
})

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInFormValues = z.infer<typeof signInSchema>

function SignIn() {
  const router = useRouter()
  const { refreshAuth } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: SignInFormValues) {
    try {
      const res = await signInFn({ data })
      clearAuthCache()
      await refreshAuth()
      await router.invalidate()
      toast.success('Signed in successfully! Welcome back.')
      if (res.redirectUrl === '/admin/businesses') {
        router.navigate({ to: '/admin/businesses' })
      } else {
        router.navigate({ to: '/dashboard' })
      }
    } catch (error: Error | unknown) {
      toast.error(error instanceof Error ? error.message : 'Invalid email or password')
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center relative px-4 py-12 bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      {/* Decorative ambient civic glow background */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[500px] bg-gradient-to-b from-[#0038A8]/15 via-[#FCD116]/10 to-transparent blur-3xl opacity-70" 
      />

      {/* Navigation link back to home */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-black/5 dark:hover:bg-white/5 btn-tactile cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal Home
        </Link>
        <Badge variant="outline" className="bg-background/80 backdrop-blur-md text-[11px] font-semibold text-muted-foreground border-border/80">
          Daine 1 & 2
        </Badge>
      </div>

      {/* Glassmorphic Card Container */}
      <div className="glass-dock card-hover w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/40 dark:border-white/10 shadow-xl backdrop-blur-xl bg-card/90 dark:bg-slate-900/85 space-y-6 relative z-10">
        {/* Official Civic Seal & Header */}
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
            <span className="absolute -bottom-1 -right-1 bg-[#FCD116] text-[#0038A8] rounded-full p-1 shadow-sm ring-2 ring-background">
              <Sparkles className="h-3 w-3" />
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Citizen Sign In
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Access your Barangay Daine resident dashboard & services
            </p>
          </div>
        </div>

        {/* Sign In Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
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
                        autoComplete="username"
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

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-bold text-foreground">
                      Password
                    </FormLabel>
                    <Link
                      to="/auth/reset-password"
                      className="text-xs font-bold text-[#0038A8] dark:text-sky-400 hover:underline inline-flex items-center min-h-[44px] -my-2.5 px-1 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-md"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        aria-label="Account password"
                        className="min-h-[44px] rounded-xl border-border/90 bg-background/80 pl-10 pr-12 focus-visible:ring-primary/40 text-sm"
                        {...field}
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                  <FormMessage className="text-xs font-semibold text-destructive" />
                </FormItem>
              )}
            />

            {/* Sign In CTA Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={!isHydrated || form.formState.isSubmitting}
                className="w-full min-h-[48px] bg-[#0038A8] hover:bg-[#002d87] active:bg-[#00246b] text-white font-bold text-base rounded-xl shadow-md gap-2 transition-all btn-tactile cursor-pointer"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In to BrgyConnect'
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* High-contrast links & Register prompt */}
        <div className="border-t border-border/60 pt-4 text-center space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Don't have a registered citizen account?{' '}
            <Link
              to="/auth/sign-up"
              className="text-[#0038A8] dark:text-sky-400 font-extrabold hover:underline inline-flex items-center min-h-[44px] -my-2 px-1 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-md"
            >
              Create Account
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Official 256-Bit Encrypted Civic Authentication</span>
          </div>
        </div>
      </div>
    </main>
  )
}
