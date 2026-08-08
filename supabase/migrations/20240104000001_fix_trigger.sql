-- Fix trigger function to gracefully handle missing GUC settings
CREATE OR REPLACE FUNCTION public.notify_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_url text;
  service_key text;
BEGIN
  -- Only fire if status changed
  IF (NEW.status IS DISTINCT FROM OLD.status) THEN
    target_url := COALESCE(current_setting('app.supabase_url', true), 'https://bbrxgpuvbfmehqxdojkj.supabase.co') || '/functions/v1/notify-document-status';
    service_key := COALESCE(current_setting('app.supabase_service_role_key', true), '');

    PERFORM net.http_post(
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
  END IF;
  RETURN NEW;
END;
$$;
