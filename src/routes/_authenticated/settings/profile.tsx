import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { User } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { useRouter, createFileRoute } from '@tanstack/react-router'

const getMyProfile = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error(profileError.message)
    }

    return { user, profile }
  })

const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
})

type UpdateProfileValues = z.infer<typeof updateProfileSchema>

const updateMyProfile = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updateProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone,
        address: data.address,
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/settings/profile')({
  component: ProfileSettingsPage,
  loader: () => getMyProfile(),
})

function ProfileSettingsPage() {
  const { user, profile } = Route.useLoaderData()
  const router = useRouter()

  const form = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      address: profile.address || '',
    },
  })

  const onSubmit = async (values: UpdateProfileValues) => {
    try {
      await updateMyProfile({ data: values })
      toast.success('Profile updated successfully')
      router.invalidate()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label>Email Address</Label>
            <Input value={user.email} disabled className="mt-1" />
            <p className="text-sm text-muted-foreground mt-1">
              Your email address cannot be changed.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                {...form.register('full_name')}
                placeholder="Juan Dela Cruz"
              />
              {form.formState.errors.full_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="09123456789"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...form.register('address')}
                placeholder="Your full residential address"
                rows={3}
              />
              {form.formState.errors.address && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-[#0038A8] hover:bg-[#0038A8]/90 min-h-[44px]"
            >
              {form.formState.isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
