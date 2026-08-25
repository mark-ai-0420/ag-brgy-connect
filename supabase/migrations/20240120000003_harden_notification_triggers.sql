-- Migration: Harden notification trigger functions with explicit search_path
-- Mitigates Postgres search path hijacking risks for SECURITY DEFINER functions.

CREATE OR REPLACE FUNCTION public.handle_document_status_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_doc_name TEXT;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    v_doc_name := CASE NEW.document_type
      WHEN 'barangay_clearance' THEN 'Barangay Clearance'
      WHEN 'barangay_id' THEN 'Barangay ID'
      WHEN 'certificate_of_residency' THEN 'Certificate of Residency'
      WHEN 'certificate_of_indigency' THEN 'Certificate of Indigency'
      WHEN 'business_permit' THEN 'Barangay Business Clearance'
      ELSE 'Barangay Document'
    END;

    IF NEW.status = 'ready' THEN
      v_title := 'Document Ready for Pickup';
      v_message := 'Your ' || v_doc_name || ' (' || COALESCE(NEW.control_number, 'Ref#' || SUBSTRING(NEW.id::text, 1, 8)) || ') is approved and ready for claiming at the Barangay Hall.';
    ELSIF NEW.status = 'completed' THEN
      v_title := 'Document Request Completed';
      v_message := 'Your ' || v_doc_name || ' has been officially issued.';
    ELSIF NEW.status = 'in_review' THEN
      v_title := 'Document Request Under Review';
      v_message := 'Your ' || v_doc_name || ' is currently being evaluated by the Barangay Secretary.';
    ELSIF NEW.status = 'rejected' THEN
      v_title := 'Document Request Requires Attention';
      v_message := 'Your ' || v_doc_name || ' request could not be processed. Please check remarks or visit the hall.';
    ELSE
      v_title := 'Document Request Update';
      v_message := 'Your ' || v_doc_name || ' status has been updated to ' || NEW.status || '.';
    END IF;

    IF NEW.requester_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link, is_read)
      VALUES (
        NEW.requester_id,
        v_title,
        v_message,
        'document',
        '/track?code=' || COALESCE(NEW.control_number, NEW.id::text),
        false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_complaint_status_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.status = 'investigating' THEN
      v_title := 'Blotter Report Under Investigation';
      v_message := 'Your incident report "' || NEW.title || '" is under official investigation by the Barangay Peace & Order team.';
    ELSIF NEW.status = 'resolved' THEN
      v_title := 'Blotter Report Resolved';
      v_message := 'Your incident report "' || NEW.title || '" has been marked as resolved.';
    ELSIF NEW.status = 'dismissed' THEN
      v_title := 'Blotter Report Update';
      v_message := 'Your incident report "' || NEW.title || '" has been reviewed and closed.';
    ELSE
      v_title := 'Blotter Case Update';
      v_message := 'Your incident report "' || NEW.title || '" status changed to ' || NEW.status || '.';
    END IF;

    IF NEW.complainant_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link, is_read)
      VALUES (
        NEW.complainant_id,
        v_title,
        v_message,
        'complaint',
        '/complaints/' || NEW.id::text,
        false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
