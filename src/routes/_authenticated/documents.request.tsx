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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { toast } from 'sonner'
import { FileText, Loader2 } from 'lucide-react'

const formSchema = z.object({
  document_type: z.enum(['barangay_clearance', 'barangay_id', 'certificate_of_residency', 'certificate_of_indigency', 'business_permit', 'other'], {
    required_error: 'Please select a document type',
  }),
  purpose: z.string().min(5, 'Please provide a valid purpose (at least 5 characters)'),
})

const submitDocumentRequest = createServerFn({ method: 'POST' })
  .validator((data: unknown) => formSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient();
    const { session } = await getAuthSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('barangay')
      .eq('id', session.user.id)
      .single();

    const { error } = await supabase.from('document_requests').insert({
      requester_id: session.user.id,
      document_type: data.document_type,
      purpose: data.purpose,
      status: 'pending',
      barangay: profile?.barangay || 'daine_1',
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });

export const Route = createFileRoute('/_authenticated/documents/request')({
  component: DocumentRequestRoute,
})

function DocumentRequestRoute() {
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      document_type: 'barangay_clearance',
      purpose: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await submitDocumentRequest({ data: values });
      toast.success('Document request submitted successfully!');
      navigate({ to: '/dashboard' });
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
      console.error(error);
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-xl shrink-0">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Document</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Submit a new request for barangay certificates.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Form</CardTitle>
          <CardDescription>Fill out the details below to request a document.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Select a document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="barangay_clearance" className="min-h-[44px]">Barangay Clearance</SelectItem>
                        <SelectItem value="barangay_id" className="min-h-[44px]">Barangay ID</SelectItem>
                        <SelectItem value="certificate_of_residency" className="min-h-[44px]">Certificate of Residency</SelectItem>
                        <SelectItem value="certificate_of_indigency" className="min-h-[44px]">Certificate of Indigency</SelectItem>
                        <SelectItem value="business_permit" className="min-h-[44px]">Business Permit</SelectItem>
                        <SelectItem value="other" className="min-h-[44px]">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please state the purpose of this request (e.g. Employment requirement, Bank application)..." 
                        className="resize-none h-32 text-sm"
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
                <Button type="submit" disabled={form.formState.isSubmitting} className="min-h-[44px] px-6 font-semibold">
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
