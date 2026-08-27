import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
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
        title: 'Citizen Sign In | Barangay Daine',
      },
      {
        name: 'description',
        content: 'Sign in to your Barangay Daine resident or administrative account.',
      },
      {
        property: 'og:title',
        content: 'Citizen Sign In | Barangay Daine',
      },
      {
        property: 'og:description',
        content: 'Sign in to your Barangay Daine resident or administrative account.',
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
      toast.success('Signed in successfully!')
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
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border shadow-sm">
        <div className="space-y-2 text-center">
          <img
            src="/logo.jpg"
            alt="BrgyConnect"
            width="56"
            height="56"
            loading="lazy"
            decoding="async"
            className="h-14 w-14 rounded-full object-cover mx-auto ring-2 ring-primary/20"
          />
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-muted-foreground">Access your BrgyConnect account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="username"
                      aria-label="Email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        aria-label="Password"
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={!isHydrated || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm space-y-2">
          <p>
            <Link to="/auth/reset-password" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Forgot password?
            </Link>
          </p>
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/auth/sign-up" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
