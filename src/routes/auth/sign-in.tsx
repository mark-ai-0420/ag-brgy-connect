import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
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

// Server function — signs in and sets the session cookie server-side
const signInFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string; password: string }) => data)
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
    const redirectUrl = (role === 'admin' || role === 'moderator') ? '/admin/businesses' : '/dashboard'

    return { success: true, role, redirectUrl }
  })

export const Route = createFileRoute('/auth/sign-in')({
  component: SignIn,
})

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInFormValues = z.infer<typeof signInSchema>

function SignIn() {
  const [isHydrated, setIsHydrated] = useState(false)
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
      toast.success('Signed in successfully!')
      // Full page reload to the target route so SSR re-evaluates session cookies
      window.location.href = res.redirectUrl
    } catch (error: any) {
      toast.error(error.message ?? 'Invalid email or password')
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border shadow-sm">
        <div className="space-y-2 text-center">
          <img src="/logo.jpg" alt="BrgyConnect" className="h-14 w-14 rounded-full object-cover mx-auto ring-2 ring-primary/20" />
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
            <Button type="submit" className="w-full" disabled={!isHydrated || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm space-y-2">
          <p>
            <Link to="/auth/reset-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </p>
          <p>
            Don't have an account?{' '}
            <Link to="/auth/sign-up" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
