import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Enforce Webhook Authentication via Service Role Key or Webhook Secret
  const authHeader = req.headers.get('Authorization') || '';
  const expectedServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const webhookSecret = Deno.env.get('NOTIFY_WEBHOOK_SECRET') || '';

  const isAuthorized =
    (expectedServiceKey && authHeader === `Bearer ${expectedServiceKey}`) ||
    (webhookSecret && req.headers.get('x-webhook-secret') === webhookSecret) ||
    !expectedServiceKey; // Graceful fallback only if running in test without keys

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized invocation' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { record, old_record } = body;

    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: 'Missing document request record' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only notify if status actually changed
    if (old_record && record.status === old_record.status) {
      return new Response(JSON.stringify({ message: 'Status unchanged, no notification sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = expectedServiceKey;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.warn('Supabase credentials not configured in Edge runtime environment.');
      return new Response(JSON.stringify({ error: 'Database service configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify document request exists in DB to prevent arbitrary forgery
    const { data: verifiedDoc, error: verifyError } = await supabaseAdmin
      .from('document_requests')
      .select('id, requester_id, status, document_type')
      .eq('id', record.id)
      .maybeSingle();

    if (verifyError || !verifiedDoc || verifiedDoc.requester_id !== record.requester_id) {
      return new Response(JSON.stringify({ error: 'Invalid document record verification' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!record.requester_id) {
      return new Response(JSON.stringify({ message: 'Anonymous request, skipping email dispatch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get requester email from auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(record.requester_id);
    if (userError || !userData.user?.email) {
      console.warn('Could not find user for notification:', userError?.message || 'Email missing');
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profile for full name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', record.requester_id)
      .maybeSingle();

    const statusMessages: Record<string, string> = {
      in_review: 'Your document request is now being reviewed by barangay staff.',
      ready: 'Great news! Your document is ready for pickup at the Barangay Hall.',
      completed: 'Your document request has been completed. Thank you!',
      rejected: 'Unfortunately, your document request could not be processed. Please contact the Barangay Hall for more information.',
    };

    const documentTypeLabels: Record<string, string> = {
      barangay_clearance: 'Barangay Clearance',
      barangay_id: 'Barangay ID',
      certificate_of_residency: 'Certificate of Residency',
      certificate_of_indigency: 'Certificate of Indigency',
      business_permit: 'Business Permit',
      other: 'Document',
    };

    const rawStatusLabel = {
      pending: 'Pending',
      in_review: 'In Review',
      ready: 'Ready for Pickup',
      completed: 'Completed',
      rejected: 'Rejected',
    }[record.status as string] ?? record.status;

    const rawDocLabel = documentTypeLabels[record.document_type as string] ?? record.document_type;
    const rawRecipientName = profile?.full_name ?? 'Resident';
    const rawMessage = statusMessages[record.status as string] ?? `Your request status has been updated to: ${rawStatusLabel}`;

    // HTML-sanitized values
    const safeDocLabel = escapeHtml(String(rawDocLabel));
    const safeStatusLabel = escapeHtml(String(rawStatusLabel));
    const safeRecipientName = escapeHtml(String(rawRecipientName));
    const safeMessage = escapeHtml(String(rawMessage));

    // Send email via Resend API if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (resendApiKey) {
      console.log(`Sending email via Resend to ${userData.user.email}...`);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Barangay Daine <onboarding@resend.dev>',
          to: [userData.user.email],
          subject: `BrgyConnect: ${safeDocLabel} Request Update`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; background-color: #ffffff;">
              <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
                <h1 style="color: #0038A8; font-size: 22px; margin: 0;">Barangay Daine, Indang, Cavite</h1>
                <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Digital Barangay Services & Community Hub</p>
              </div>
              <p style="font-size: 15px; color: #1e293b; line-height: 1.6;">Hi <strong>${safeRecipientName}</strong>,</p>
              <p style="font-size: 15px; color: #1e293b; line-height: 1.6;">${safeMessage}</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #0038A8; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">REQUEST DETAILS</p>
                <p style="margin: 0 0 4px 0; font-size: 15px; color: #0f172a;"><strong>Document:</strong> ${safeDocLabel}</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Current Status:</strong> <span style="color: #0038A8; font-weight: 600;">${safeStatusLabel}</span></p>
              </div>

              <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                This is an automated advisory from BrgyConnect. Please do not reply directly to this email.
              </p>
            </div>
          `,
        }),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        console.error('Resend API error:', errText);
      } else {
        console.log(`Email successfully sent to ${userData.user.email} via Resend.`);
      }
    } else {
      console.log(`[Simulation Mode] Notification for ${userData.user.email}:`, {
        subject: `BrgyConnect: ${safeDocLabel} Request Update`,
        body: safeMessage,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification processed for ${userData.user.email}`,
        details: { status: record.status, document_type: record.document_type }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
