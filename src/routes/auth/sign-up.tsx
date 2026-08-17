import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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

const signUpFnSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional()
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
          full_name: data.fullName ?? '',
        },
      },
    })
    if (error) throw new Error(error.message)
    
    // If session was created automatically (email confirmation disabled in Supabase)
    const autoLoggedIn = !!authData.session
    return { success: true, autoLoggedIn }
  })

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUp,
})

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormValues = z.infer<typeof signUpSchema>

import { useAuth } from '#/hooks/useAuth'
import { clearAuthCache } from '#/server/auth'

function SignUp() {
  const router = useRouter()
  const { refreshAuth } = useAuth()
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: SignUpFormValues) {
    try {
      const res = await signUpFn({ data: { email: data.email, password: data.password, fullName: data.fullName } })
      
      if (res.autoLoggedIn) {
        clearAuthCache()
        await refreshAuth()
        await router.invalidate()
        toast.success('Account created successfully!')
        router.navigate({ to: '/dashboard' })
      } else {
        toast.success('Registration successful! Check your inbox or sign in.')
        router.navigate({ to: '/auth/sign-in' })
      }
    } catch (error: Error | unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('rate limit')) {
        toast.error('Email rate limit reached. Please disable "Confirm email" in Supabase Authentication settings for development, or wait a few minutes.')
      } else {
        toast.error(msg || 'Failed to register account')
      }
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border shadow-sm">
        <div className="space-y-2 text-center">
          <img src="/logo.jpg" alt="BrgyConnect" className="h-14 w-14 rounded-full object-cover mx-auto ring-2 ring-primary/20" />
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="text-muted-foreground">Sign up to get started with BrgyConnect</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Dela Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" type="email" {...field} />
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
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating account…' : 'Sign Up'}
            </Button>
          </form>
        </Form>
        
        <div className="text-center text-sm">
          <p>
            Already have an account?{' '}
            <Link to="/auth/sign-in" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
