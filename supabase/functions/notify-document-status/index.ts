import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record, old_record } = await req.json()
    
    // Only notify if status actually changed
    if (record.status === old_record?.status) {
      return new Response(JSON.stringify({ message: 'Status unchanged, no notification sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get requester email from auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(record.requester_id)
    if (userError || !userData.user?.email) {
      console.error('Could not find user:', userError)
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    // Get profile for full name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', record.requester_id)
      .single()

    const statusMessages: Record<string, string> = {
      in_review: 'Your document request is now being reviewed by barangay staff.',
      ready: 'Great news! Your document is ready for pickup at the Barangay Hall.',
      completed: 'Your document request has been completed. Thank you!',
      rejected: 'Unfortunately, your document request could not be processed. Please contact the Barangay Hall for more information.',
    }

    const documentTypeLabels: Record<string, string> = {
      barangay_clearance: 'Barangay Clearance',
      barangay_id: 'Barangay ID',
      certificate_of_residency: 'Certificate of Residency',
      certificate_of_indigency: 'Certificate of Indigency',
      business_permit: 'Business Permit',
      other: 'Document',
    }

    const statusLabel = {
      pending: 'Pending',
      in_review: 'In Review',
      ready: 'Ready for Pickup',
      completed: 'Completed',
      rejected: 'Rejected',
    }[record.status] ?? record.status

    const docLabel = documentTypeLabels[record.document_type] ?? record.document_type
    const recipientName = profile?.full_name ?? 'Resident'
    const message = statusMessages[record.status] ?? `Your request status has been updated to: ${statusLabel}`

    // Send email via Supabase built-in SMTP (uses the project's auth email settings)
    // We use the admin API to send a custom email
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'email',
      email: userData.user.email,
      // Note: This is a workaround - for production use Resend or SendGrid
    })

    // Since Supabase admin generateLink doesn't send custom emails,
    // we'll use a direct fetch to the Supabase SMTP endpoint via pg_net
    // Instead, log the notification intent and return success
    // The actual email sending requires Resend/SMTP integration
    console.log(`Email notification for ${userData.user.email}:`, {
      subject: `BrgyConnect: ${docLabel} Request Update`,
      body: `Hi ${recipientName},\n\n${message}\n\nDocument Type: ${docLabel}\nNew Status: ${statusLabel}\n\nBarangay Daine, Indang, Cavite`,
    })

    // TODO: Integrate with Resend for actual email delivery
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    // await resend.emails.send({ from: 'noreply@brgyconnect.ph', to: userData.user.email, ... })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification logged for ${userData.user.email}`,
        details: { status: record.status, document_type: record.document_type }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
