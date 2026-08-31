import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
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
import { supabase } from '#/lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

export const Route = createFileRoute('/auth/update-password')({
  component: UpdatePassword,
})

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>

function UpdatePassword() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(data: UpdatePasswordFormValues) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) throw error

      toast.success('Password updated successfully!')
      setTimeout(() => {
        navigate({ to: '/dashboard' })
      }, 1500)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    }
  }

  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border shadow-sm">
        <div className="space-y-2 text-center">
          <img src="/logo.jpg" alt="BrgyConnect" className="h-14 w-14 rounded-full object-cover mx-auto ring-2 ring-primary/20" />
          <h1 className="text-3xl font-bold">Update Password</h1>
          <p className="text-muted-foreground">Enter your new password below</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="••••••••" 
                        type={showPassword ? "text" : "password"} 
                        className="min-h-[44px] pr-12"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted/80 active:bg-muted active:scale-95 transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 z-10"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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
                    <div className="relative">
                      <Input 
                        placeholder="••••••••" 
                        type={showConfirmPassword ? "text" : "password"} 
                        className="min-h-[44px] pr-12"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted/80 active:bg-muted active:scale-95 transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 z-10"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full min-h-[44px]" disabled={!isHydrated || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  )
}
