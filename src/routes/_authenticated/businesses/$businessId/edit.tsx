import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { uploadBusinessPhoto } from '#/lib/upload'
import { BusinessForm, businessFormSchema, type BusinessFormValues } from '#/components/businesses/BusinessForm'

const getBusiness = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { session } = await getAuthSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .eq('owner_id', session.user.id)
      .single()

    if (error || !data) throw new Error('Business not found or access denied')
    return data
  })

const updateBusinessSchema = businessFormSchema.extend({
  id: z.string(),
  photo_url: z.string().optional()
})

const updateBusiness = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updateBusinessSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { session } = await getAuthSession()
    if (!session) throw new Error('Not authenticated')

    const { id, ...fields } = data
    const { error } = await supabase
      .from('businesses')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', session.user.id)

    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/businesses/$businessId/edit')({
  component: EditBusinessRoute,
  loader: ({ params }) => getBusiness({ data: params.businessId }),
})

function EditBusinessRoute() {
  const business = Route.useLoaderData()
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)

  async function handleSubmit(values: BusinessFormValues, photo: File | null) {
    try {
      setIsUploading(true)
      let photoUrl = business.photo_url

      if (photo) {
        toast.info('Uploading photo...')
        const uploadedUrl = await uploadBusinessPhoto(photo, business.id)
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        }
      }

      await updateBusiness({ data: { id: business.id, photo_url: photoUrl, ...values } })
      toast.success('Business listing updated!')
      navigate({ to: '/dashboard' })
    } catch {
      toast.error('Failed to update listing. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    navigate({ to: '/dashboard' })
  }

  return (
    <BusinessForm
      mode="edit"
      initialValues={{
        name: business.name,
        category: business.category,
        address: business.address,
        phone: business.phone,
        hours: business.hours,
        description: business.description,
        map_url: business.map_url,
      }}
      initialPhotoUrl={business.photo_url}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isUploading}
    />
  )
}
