import { createFileRoute, Link } from '@tanstack/react-router'
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
import { supabase } from '#/lib/supabase'
import { toast } from 'sonner'
import { useState } from 'react'

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPassword,
})

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ResetFormValues = z.infer<typeof resetSchema>

function ResetPassword() {
  const [submitted, setSubmitted] = useState(false)
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ResetFormValues) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSubmitted(true)
      toast.success('Password reset email sent!')
    } catch (error: any) {
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            {submitted 
              ? "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder."
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </div>

        {!submitted && (
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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </Form>
        )}
        
        <div className="text-center text-sm">
          <p>
            Remember your password?{' '}
            <Link to="/auth/sign-in" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
