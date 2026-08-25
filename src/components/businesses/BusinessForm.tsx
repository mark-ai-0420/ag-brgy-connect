import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Checkbox } from '#/components/ui/checkbox'
import { Store, Image as ImageIcon, Utensils, Sparkles, MessageSquare, Phone, MapPin, Clock, CreditCard, Building2 } from 'lucide-react'
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
] as const

export const PUROK_OPTIONS = [
  'Purok 1',
  'Purok 2',
  'Purok 3',
  'Purok 4',
  'Purok 5',
  'Purok 6',
  'Purok 7',
] as const

export const PAYMENT_OPTIONS = ['Cash', 'GCash', 'Maya', 'Bank Transfer'] as const

export const businessFormSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  barangay: z.enum(['daine_1', 'daine_2'], {
    required_error: 'Please select a barangay unit',
  }),
  purok: z.string().optional().default(''),
  address: z.string().min(5, 'Please provide a complete address / landmark'),
  phone: z.string().min(7, 'Please provide a valid contact number'),
  messenger_link: z.string().optional().default(''),
  payment_methods: z.array(z.string()).default(['Cash', 'GCash']),
  hours: z.string().optional().default(''),
  description: z.string().optional().default(''),
  map_url: z.string().url('Must be a valid URL').optional().or(z.literal('')).default(''),
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
      barangay: initialValues?.barangay ?? 'daine_1',
      purok: initialValues?.purok ?? '',
      address: initialValues?.address ?? '',
      phone: initialValues?.phone ?? '',
      messenger_link: initialValues?.messenger_link ?? '',
      payment_methods: initialValues?.payment_methods ?? ['Cash', 'GCash'],
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
        <div className="bg-primary/10 p-3 rounded-2xl shrink-0">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'create' ? 'Register Business Listing' : 'Edit Business Listing'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mode === 'create' 
              ? 'Promote your local shop or service to all Daine residents for free.' 
              : 'Keep your store details, contact info, and photos updated.'}
          </p>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Business Information & Showcase</CardTitle>
          <CardDescription>
            {mode === 'create'
              ? 'Provide details about your business so neighbors can easily discover, call, and message you.'
              : 'Update your listing details and storefront showcase.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              
              {/* Photo Uploads Section */}
              <div className="space-y-4 rounded-2xl border p-5 bg-muted/20">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold tracking-tight">Business Photos & Showcase</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  High quality photos help attract more neighbors to your store or service.
                </p>

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
                          helperText="Primary storefront, signage, or facade (JPEG, PNG, WebP up to 5MB)"
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
                            helperText="Pricelist, menu card, or service list"
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
                            helperText="Products on sale, equipment, or dining area"
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

              {/* Basic Business Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Business Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Aling Nena's Sari-Sari Store & Eatery" className="h-11 text-sm" {...field} />
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
                      <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="Select business category" />
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

                <FormField
                  control={form.control}
                  name="barangay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary" /> Barangay Unit <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="Select barangay" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daine_1" className="min-h-[44px]">Barangay Daine I</SelectItem>
                          <SelectItem value="daine_2" className="min-h-[44px]">Barangay Daine II</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <FormField
                  control={form.control}
                  name="purok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> Purok / Zone
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="min-h-[44px]">
                            <SelectValue placeholder="Select Purok" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PUROK_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p} className="min-h-[44px]">
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Street Address & Landmark <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="House No., Street, Landmark (e.g. Near Chapel)" className="h-11 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact & Instant Messaging */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-primary" /> Contact Number <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 0917-123-4567" className="h-11 text-sm" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Used for instant 1-tap "Call" action on the directory.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="messenger_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" /> Facebook Messenger / Page Link
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://m.me/yourpage or username" className="h-11 text-sm" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Allows customers to chat directly via Messenger.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Operating Hours & Accepted Payments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary" /> Operating Hours
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mon–Sat 7:00 AM – 7:00 PM" className="h-11 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="map_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> Google Maps / OpenStreetMap Link
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://maps.google.com/..." className="h-11 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Methods */}
              <FormField
                control={form.control}
                name="payment_methods"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-primary" /> Accepted Payment Methods
                    </FormLabel>
                    <div className="flex flex-wrap gap-3">
                      {PAYMENT_OPTIONS.map((method) => {
                        const isChecked = (field.value || []).includes(method)
                        return (
                          <label
                            key={method}
                            className={`flex items-center gap-2.5 cursor-pointer text-sm font-medium border rounded-xl px-4 py-2.5 transition-all ${
                              isChecked
                                ? 'bg-primary/10 border-primary text-primary font-semibold shadow-2xs'
                                : 'bg-card text-muted-foreground hover:bg-muted/50 border-input'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const current = field.value || []
                                if (checked) {
                                  field.onChange([...current, method])
                                } else {
                                  field.onChange(current.filter((m) => m !== method))
                                }
                              }}
                              disabled={isSubmitting}
                            />
                            <span>{method}</span>
                          </label>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Your Business & Services (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share special offers, popular products, catering availability, delivery info, etc..." 
                        className="resize-none text-sm min-h-[100px] leading-relaxed"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" type="button" className="min-h-[44px] px-5" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-h-[44px] px-6 font-semibold shadow-sm">
                  {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Submit for Listing' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
