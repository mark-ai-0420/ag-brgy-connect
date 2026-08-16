import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useState } from 'react'
import { uploadComplaintPhoto } from '#/lib/upload'

import { Button } from '#/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { AlertCircle } from 'lucide-react'

// ... standard form setup

const formSchema = z.object({
  title: z.string().min(3, 'Title is required').max(100, 'Title is too long'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Please provide more details'),
  location: z.string().optional(),
  incident_date: z.string().optional(),
  is_anonymous: z.boolean().default(false),
})

const createComplaint = createServerFn({ method: 'POST' })
  .validator((d: z.infer<typeof formSchema>) => formSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: inserted, error } = await supabase
      .from('complaints')
      .insert({
        complainant_id: user.id, // Keep complainant_id to satisfy RLS or trace back if needed, but flag as anonymous
        title: data.title,
        category: data.category,
        description: data.description,
        location: data.location || null,
        incident_date: data.incident_date || null,
        is_anonymous: data.is_anonymous,
        status: 'pending'
      })
      .select('id')
      .single()

    if (error) {
      console.error(error)
      throw new Error('Failed to create complaint')
    }

    return { id: inserted.id }
  })

const updateComplaintPhoto = createServerFn({ method: 'POST' })
  .validator((d: { id: string; photo_url: string }) => z.object({ id: z.string(), photo_url: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('complaints')
      .update({ photo_url: data.photo_url })
      .eq('id', data.id)
      
    if (error) {
      console.error(error)
      throw new Error('Failed to update photo')
    }
  })

export const Route = createFileRoute('/_authenticated/complaints/new')({
  component: NewComplaintRoute,
})

function NewComplaintRoute() {
  const navigate = useNavigate()
  
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
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
      title: '',
      category: '',
      description: '',
      location: '',
      incident_date: '',
      is_anonymous: false,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsUploading(true)
      const res = await createComplaint({ data: values })
      
      if (photo && res.id) {
        toast.info('Uploading photo...')
        const photoUrl = await uploadComplaintPhoto(photo, res.id)
        if (photoUrl) {
          await updateComplaintPhoto({ data: { id: res.id, photo_url: photoUrl } })
        }
      }
      
      toast.success('Complaint / Incident report submitted. Barangay staff will review it.')
      navigate({ to: '/dashboard' })
    } catch (error) {
      toast.error('Failed to submit complaint')
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-destructive/10 p-3 rounded-full">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report an Incident</h1>
          <p className="text-muted-foreground mt-1">Submit a complaint or report an issue to the barangay.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>Provide accurate information to help us address the issue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Loud noise at night" className="h-11 text-sm" {...field} />
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
                        <SelectItem value="Noise Complaint" className="min-h-[44px]">Noise Complaint</SelectItem>
                        <SelectItem value="Sanitation & Trash" className="min-h-[44px]">Sanitation & Trash</SelectItem>
                        <SelectItem value="Public Safety / Nuisance" className="min-h-[44px]">Public Safety / Nuisance</SelectItem>
                        <SelectItem value="Boundary / Property" className="min-h-[44px]">Boundary / Property</SelectItem>
                        <SelectItem value="Barangay Staff / Official" className="min-h-[44px]">Barangay Staff / Official</SelectItem>
                        <SelectItem value="Street Lights & Infra" className="min-h-[44px]">Street Lights & Infra</SelectItem>
                        <SelectItem value="Dispute / Blotter" className="min-h-[44px]">Dispute / Blotter</SelectItem>
                        <SelectItem value="Others" className="min-h-[44px]">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe the incident in detail..." 
                        className="resize-none text-sm min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location / Address</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Purok 3, Near Plaza" className="h-11 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="incident_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="h-11 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Photo Attachment (Optional)</FormLabel>
                {photoPreview && (
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-muted mb-2 border border-border">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={handlePhotoChange} className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
              </div>

              <FormField
                control={form.control}
                name="is_anonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5 cursor-pointer"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer font-semibold">
                        Submit Anonymously
                      </FormLabel>
                      <FormDescription>
                        Your name will not be visible to the public or the person you are complaining against, but barangay staff will still be able to trace this report to your account.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" className="min-h-[44px] px-5" onClick={() => navigate({ to: '/dashboard' })}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || isUploading} className="min-h-[44px] px-6 font-semibold">
                  {form.formState.isSubmitting || isUploading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
