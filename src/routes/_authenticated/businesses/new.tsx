import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { toast } from 'sonner'
import { useState } from 'react'
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
      photo_url: data.photo_url || null,
      menu_image_url: data.menu_image_url || null,
      misc_image_url: data.misc_image_url || null,
      status: 'pending',
    }).select('id').single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: inserted.id };
  });

export const Route = createFileRoute('/_authenticated/businesses/new')({
  component: NewBusinessRoute,
})

function NewBusinessRoute() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  async function handleSubmit(values: BusinessFormValues) {
    try {
      setIsSubmitting(true);
      await createBusiness({ data: values });
      toast.success('Business listing submitted successfully! Pending verification.');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create business listing');
      console.error(error);
    } finally {
      setIsSubmitting(false);
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
      isSubmitting={isSubmitting}
    />
  )
}

