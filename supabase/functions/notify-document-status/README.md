# Document Status Notification Function

This edge function is triggered by a database trigger whenever a `document_request` row is updated in Supabase.

## Setup Email Provider

Currently, this function logs the email content to the console. To actually send emails to users, you need an SMTP/Email provider like Resend.

### Instructions:

1. Sign up for a free account at [Resend](https://resend.com) (allows 3,000 emails/month).
2. Get your Resend API Key.
3. Add it to your Supabase project's secrets:

\`\`\`bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
\`\`\`

4. Update `index.ts` to uncomment the Resend code and install the SDK:
   - Import the Resend SDK or use raw fetch.
   - Replace the `console.log` with the actual send logic.

5. Deploy the function to your remote Supabase instance:

\`\`\`bash
supabase functions deploy notify-document-status
\`\`\`
