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

const formSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  address: z.string().min(5, 'Please provide a complete address'),
  phone: z.string().min(7, 'Please provide a valid contact number'),
  hours: z.string().optional(),
  description: z.string().optional(),
})

const createBusiness = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof formSchema>) => data)
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
      status: 'pending',
    }).select('id').single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: inserted.id };
  });

const updateBusinessPhoto = createServerFn({ method: 'POST' })
  .validator((data: { id: string; photo_url: string }) => data)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient();
    await supabase.from('businesses').update({ photo_url: data.photo_url }).eq('id', data.id);
  });

export const Route = createFileRoute('/_authenticated/businesses/new')({
  component: NewBusinessRoute,
})

function NewBusinessRoute() {
  const navigate = useNavigate();
  
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      address: '',
      phone: '',
      hours: '',
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
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

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-full">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Business</h1>
          <p className="text-muted-foreground mt-1">List your business in the barangay directory.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Provide details about your business to help residents find you.</CardDescription>
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
                <Input type="file" accept="image/*" onChange={handlePhotoChange} className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Aling Nena's Sari-Sari Store" className="h-11 text-sm" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sari-Sari Store" className="min-h-[44px]">Sari-Sari Store</SelectItem>
                        <SelectItem value="Eatery / Carenderia" className="min-h-[44px]">Eatery / Carenderia</SelectItem>
                        <SelectItem value="Water Station" className="min-h-[44px]">Water Station</SelectItem>
                        <SelectItem value="Laundry" className="min-h-[44px]">Laundry</SelectItem>
                        <SelectItem value="Salon" className="min-h-[44px]">Salon</SelectItem>
                        <SelectItem value="Repair Shop" className="min-h-[44px]">Repair Shop</SelectItem>
                        <SelectItem value="Clinic" className="min-h-[44px]">Clinic</SelectItem>
                        <SelectItem value="Pharmacy" className="min-h-[44px]">Pharmacy</SelectItem>
                        <SelectItem value="Tailoring" className="min-h-[44px]">Tailoring</SelectItem>
                        <SelectItem value="Others" className="min-h-[44px]">Others</SelectItem>
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
                      <FormControl>
                        <Input placeholder="e.g. 0917-123-4567" className="h-11 text-sm" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input placeholder="e.g. Mon–Sat 8am–6pm" className="h-11 text-sm" {...field} />
                      </FormControl>
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
                    <FormControl>
                      <Input placeholder="House No., Street Name, Brgy Daine" className="h-11 text-sm" {...field} />
                    </FormControl>
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
                      <Textarea 
                        placeholder="Briefly describe what your business offers..." 
                        className="resize-none text-sm min-h-[100px]"
                        {...field} 
                      />
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
                  {form.formState.isSubmitting || isUploading ? 'Saving...' : 'Add Business'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
