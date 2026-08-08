import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { toast } from 'sonner'
import { Store, Upload } from 'lucide-react'
import { useState } from 'react'
import { uploadBusinessPhoto } from '#/lib/upload'

const CATEGORIES = [
  'Sari-Sari Store',
  'Eatery / Carenderia',
  'Water Station',
  'Laundry',
  'Salon',
  'Repair Shop',
  'Clinic',
  'Pharmacy',
  'Tailoring',
  'Others',
]

const formSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  address: z.string().min(5, 'Please provide a complete address'),
  phone: z.string().min(7, 'Please provide a valid contact number'),
  hours: z.string().optional(),
  description: z.string().optional(),
  map_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

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

const updateBusiness = createServerFn({ method: 'POST' })
  .validator((data: { id: string; photo_url?: string } & z.infer<typeof formSchema>) => data)
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

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(business.photo_url || null)
  const [isUploading, setIsUploading] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: business.name ?? '',
      category: business.category ?? '',
      address: business.address ?? '',
      phone: business.phone ?? '',
      hours: business.hours ?? '',
      description: business.description ?? '',
      map_url: business.map_url ?? '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
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

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-full">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Business</h1>
          <p className="text-muted-foreground mt-1">Update your listing in the barangay directory.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Keep your details accurate so residents can find you.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <div className="space-y-2">
                <FormLabel>Business Photo (Optional)</FormLabel>
                {photoPreview && (
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-muted mb-2 border border-border">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c} className="min-h-[44px]">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl><Input placeholder="09XX-XXX-XXXX" className="h-11 text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating Hours</FormLabel>
                      <FormControl><Input placeholder="e.g. Mon–Sat 8am–6pm" className="h-11 text-sm" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete Address</FormLabel>
                    <FormControl><Input placeholder="House No., Street Name, Brgy Daine" className="h-11 text-sm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="map_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OpenStreetMap Link (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://www.openstreetmap.org/..." className="h-11 text-sm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none text-sm min-h-[100px]" rows={3} placeholder="Describe what your business offers..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" className="min-h-[44px] px-5" onClick={() => navigate({ to: '/dashboard' })}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || isUploading} className="min-h-[44px] px-6 font-semibold">
                  {form.formState.isSubmitting || isUploading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

