import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { uploadBusinessPhoto } from '#/lib/upload'
import { BusinessForm, businessFormSchema, type BusinessFormValues } from '#/components/businesses/BusinessForm'

const createBusiness = createServerFn({ method: 'POST' })
  .validator((data: unknown) => businessFormSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient();
    const { session } = await getAuthSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data: inserted, error } = await supabase.from('businesses').insert({
      owner_id: session.user.id,
      name: data.name,
      category: data.category,
      address: data.address,
      phone: data.phone,
      hours: data.hours || '',
      description: data.description || '',
      map_url: data.map_url || '',
      status: 'pending',
    }).select('id').single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: inserted.id };
  });

const updatePhotoSchema = z.object({ id: z.string(), photo_url: z.string() })

const updateBusinessPhoto = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updatePhotoSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient();
    await supabase.from('businesses').update({ photo_url: data.photo_url }).eq('id', data.id);
  });

export const Route = createFileRoute('/_authenticated/businesses/new')({
  component: NewBusinessRoute,
})

function NewBusinessRoute() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  
  async function handleSubmit(values: BusinessFormValues, photo: File | null) {
    try {
      setIsUploading(true);
      const res = await createBusiness({ data: values });
      
      if (photo && res.id) {
        toast.info('Uploading photo...');
        const photoUrl = await uploadBusinessPhoto(photo, res.id);
        if (photoUrl) {
          await updateBusinessPhoto({ data: { id: res.id, photo_url: photoUrl } });
        }
      }
      
      toast.success('Business listing created successfully!');
      navigate({ to: '/dashboard' });
    } catch (error) {
      toast.error('Failed to create business listing');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  }

  const handleCancel = () => {
    navigate({ to: '/dashboard' });
  }

  return (
    <BusinessForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isUploading}
    />
  )
}
