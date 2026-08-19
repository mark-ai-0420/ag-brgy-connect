import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Store, Image as ImageIcon, Utensils, Sparkles } from 'lucide-react'
import { ImageUploader } from '#/components/common/ImageUploader'

export const CATEGORIES = [
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

export const businessFormSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  address: z.string().min(5, 'Please provide a complete address'),
  phone: z.string().min(7, 'Please provide a valid contact number'),
  hours: z.string().optional(),
  description: z.string().optional(),
  map_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  photo_url: z.string().nullable().optional(),
  menu_image_url: z.string().nullable().optional(),
  misc_image_url: z.string().nullable().optional(),
})

export type BusinessFormValues = z.infer<typeof businessFormSchema>

interface BusinessFormProps {
  initialValues?: Partial<BusinessFormValues>
  onSubmit: (values: BusinessFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  mode: 'create' | 'edit'
}

export function BusinessForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode
}: BusinessFormProps) {
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema) as any,
    defaultValues: {
      name: initialValues?.name ?? '',
      category: initialValues?.category ?? '',
      address: initialValues?.address ?? '',
      phone: initialValues?.phone ?? '',
      hours: initialValues?.hours ?? '',
      description: initialValues?.description ?? '',
      map_url: initialValues?.map_url ?? '',
      photo_url: initialValues?.photo_url ?? null,
      menu_image_url: initialValues?.menu_image_url ?? null,
      misc_image_url: initialValues?.misc_image_url ?? null,
    },
  })

  const handleSubmit = (values: BusinessFormValues) => {
    return onSubmit(values)
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-full">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'create' ? 'Add New Business' : 'Edit Business'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mode === 'create' 
              ? 'List your business in the Barangay Daine community directory.' 
              : 'Update your listing in the Barangay Daine community directory.'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information & Showcase</CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Provide details and photos about your business to help residents find you.'
              : 'Keep your details and photos accurate so residents can find you easily.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Photo Uploads Section */}
              <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold tracking-tight">Business Photos & Showcase</h3>
                </div>

                <FormField
                  control={form.control}
                  name="photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Storefront / Banner Photo (Optional)</FormLabel>
                      <FormControl>
                        <ImageUploader
                          bucket="business-photos"
                          value={field.value}
                          onChange={field.onChange}
                          label=""
                          helperText="Primary storefront, facade, or company banner (JPEG, PNG, WebP up to 5MB)"
                          aspectRatio="video"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="menu_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Utensils className="h-3.5 w-3.5 text-primary" />
                          Menu / Price Rates (Optional)
                        </FormLabel>
                        <FormControl>
                          <ImageUploader
                            bucket="business-photos"
                            value={field.value}
                            onChange={field.onChange}
                            label=""
                            helperText="Menu card, pricelist, or service offerings"
                            aspectRatio="square"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="misc_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          Products / Interior (Optional)
                        </FormLabel>
                        <FormControl>
                          <ImageUploader
                            bucket="business-photos"
                            value={field.value}
                            onChange={field.onChange}
                            label=""
                            helperText="Product showcase, facilities, or dining area"
                            aspectRatio="square"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Aling Nena's Sari-Sari Store" className="h-11 text-sm" {...field} /></FormControl>
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
                      <FormControl><Input placeholder="e.g. 0917-123-4567" className="h-11 text-sm" {...field} /></FormControl>
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
                    <FormLabel>Map Link (Google Maps or OpenStreetMap - Optional)</FormLabel>
                    <FormControl><Input placeholder="https://maps.google.com/..." className="h-11 text-sm" {...field} /></FormControl>
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
                <Button variant="outline" type="button" className="min-h-[44px] px-5" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-h-[44px] px-6 font-semibold">
                  {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Add Business' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

