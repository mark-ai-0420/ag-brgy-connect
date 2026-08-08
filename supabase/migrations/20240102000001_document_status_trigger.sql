-- Enable pg_net extension for HTTP calls from database triggers
create extension if not exists pg_net;

-- Function to call the Edge Function when document_request status changes
create or replace function public.notify_document_status_change()
returns trigger
language plpgsql
security definer
as $$
declare
  target_url text;
  service_key text;
begin
  -- Only fire if status changed
  if (NEW.status IS DISTINCT FROM OLD.status) then
    target_url := coalesce(current_setting('app.supabase_url', true), 'https://bbrxgpuvbfmehqxdojkj.supabase.co') || '/functions/v1/notify-document-status';
    service_key := coalesce(current_setting('app.supabase_service_role_key', true), '');

    perform net.http_post(
      url := target_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  end if;
  return NEW;
end;
$$;

-- Create trigger on document_requests
drop trigger if exists on_document_request_status_change on public.document_requests;
create trigger on_document_request_status_change
  after update on public.document_requests
  for each row
  execute function public.notify_document_status_change();
