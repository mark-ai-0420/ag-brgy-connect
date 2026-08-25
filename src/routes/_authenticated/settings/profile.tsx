import { useState, useRef } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { User, Camera, Upload, Trash2, Loader2, Check } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { useRouter, createFileRoute } from '@tanstack/react-router'
import { uploadAvatarPhoto } from '#/lib/upload'

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
  avatar_url: z.string().nullable().optional(),
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
        avatar_url: data.avatar_url,
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      avatar_url: profile?.avatar_url || null,
    },
  })

  const avatarUrl = form.watch('avatar_url')

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please select a JPG, PNG, or WebP image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.')
      return
    }

    setIsUploading(true)
    try {
      const uploadedUrl = await uploadAvatarPhoto(file, user.id)
      if (!uploadedUrl) {
        throw new Error('Failed to upload photo')
      }
      form.setValue('avatar_url', uploadedUrl, { shouldDirty: true, shouldValidate: true })
      toast.success('Photo uploaded! Click "Save Profile" to save changes.')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload photo')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = () => {
    form.setValue('avatar_url', null, { shouldDirty: true, shouldValidate: true })
    toast.info('Photo removed. Click "Save Profile" to apply changes.')
  }

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
          <CardDescription>
            Manage your personal resident details and official ID photo for BrgyConnect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 2x2 ID Photo Upload Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/80 mb-6 space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-[#0038A8] dark:text-sky-400" />
                2x2 Official ID Photo
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload a clear 2x2 or passport-style photo with a plain background for your official Digital Resident ID card.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-1">
              {/* Photo Preview Frame */}
              <div className="relative group shrink-0">
                <div className="h-28 w-28 rounded-2xl border-2 border-dashed border-primary/40 bg-background overflow-hidden shadow-sm flex items-center justify-center relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={form.watch('full_name') || 'Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                      <User className="h-10 w-10 text-muted-foreground/60 mb-1" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                        No Photo
                      </span>
                    </div>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-[10px] font-medium text-foreground">Uploading...</span>
                    </div>
                  )}
                </div>
                {avatarUrl && !isUploading && (
                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 shadow-xs ring-2 ring-background">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>

              {/* Action buttons & info */}
              <div className="flex-1 space-y-2.5 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                    disabled={isUploading || form.formState.isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || form.formState.isSubmitting}
                    className="min-h-[38px] text-xs font-semibold gap-1.5 cursor-pointer rounded-xl"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {avatarUrl ? 'Change Photo' : 'Upload 2x2 Photo'}
                  </Button>

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={isUploading || form.formState.isSubmitting}
                      className="min-h-[38px] text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 cursor-pointer rounded-xl"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove Photo
                    </Button>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Supported formats: JPG, PNG, WebP (Max 5MB). Photo will appear on your Digital Resident ID card and public verification badge.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <Label>Email Address</Label>
            <Input value={user.email} disabled className="mt-1 bg-muted/50" />
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
              disabled={form.formState.isSubmitting || isUploading}
              className="w-full bg-[#0038A8] hover:bg-[#0038A8]/90 min-h-[44px]"
            >
              {form.formState.isSubmitting ? 'Saving Profile...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
