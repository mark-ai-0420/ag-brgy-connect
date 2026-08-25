-- ============================================================================
-- MIGRATION: 20240119000001_notifications_and_tracking.sql
-- Description: In-App Real-Time Notification Center & Public Tracking Indexes
-- ============================================================================

-- 1. ADD CONTROL NUMBER COLUMN TO DOCUMENT REQUESTS IF NOT EXISTS
ALTER TABLE public.document_requests ADD COLUMN IF NOT EXISTS control_number TEXT;

UPDATE public.document_requests
SET control_number = CASE 
  WHEN barangay = 'daine_2' THEN 'BD2-' || UPPER(SUBSTRING(id::text, 1, 8))
  ELSE 'BD1-' || UPPER(SUBSTRING(id::text, 1, 8))
END
WHERE control_number IS NULL;

-- 2. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('document', 'complaint', 'announcement', 'system')),
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_requests_control_no 
  ON public.document_requests (control_number);

-- 4. ENABLE RLS & POLICIES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Authenticated or triggers can insert notifications'
  ) THEN
    CREATE POLICY "Authenticated or triggers can insert notifications"
      ON public.notifications FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- 5. ADD NOTIFICATIONS TO SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipping publication addition or already member: %', SQLERRM;
END $$;

-- 6. TRIGGER FUNCTIONS FOR AUTOMATIC NOTIFICATIONS

-- 6.1 Document Request Status Change Trigger & Control Number Generator
CREATE OR REPLACE FUNCTION public.handle_document_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_title TEXT;
  status_label TEXT;
  msg TEXT;
  ctrl_no TEXT;
BEGIN
  -- Ensure control number exists
  IF NEW.control_number IS NULL THEN
    IF NEW.barangay = 'daine_2' THEN
      NEW.control_number := 'BD2-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    ELSE
      NEW.control_number := 'BD1-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    END IF;
  END IF;

  ctrl_no := NEW.control_number;

  -- Only trigger notification if status changed and requester exists
  IF (TG_OP = 'UPDATE') AND (NEW.status IS DISTINCT FROM OLD.status) AND NEW.requester_id IS NOT NULL THEN
    doc_title := INITCAP(REPLACE(NEW.document_type, '_', ' '));
    
    CASE NEW.status
      WHEN 'ready' THEN
        status_label := 'Ready for Pickup';
        msg := 'Your ' || doc_title || ' (' || ctrl_no || ') is now approved and ready for pickup at the Barangay Hall.';
      WHEN 'completed' THEN
        status_label := 'Completed';
        msg := 'Your ' || doc_title || ' (' || ctrl_no || ') has been issued / completed.';
      WHEN 'in_review' THEN
        status_label := 'Under Review';
        msg := 'Your ' || doc_title || ' (' || ctrl_no || ') is currently being reviewed by the barangay secretary.';
      WHEN 'rejected' THEN
        status_label := 'Requires Attention';
        msg := 'Your ' || doc_title || ' requires attention: ' || COALESCE(NEW.notes, 'Please check requirements with the barangay hall.');
      ELSE
        status_label := INITCAP(NEW.status);
        msg := 'Your ' || doc_title || ' request status changed to: ' || status_label;
    END CASE;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.requester_id,
      'Document Update: ' || status_label,
      msg,
      'document',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_document_status_notification ON public.document_requests;
CREATE TRIGGER tr_document_status_notification
  BEFORE INSERT OR UPDATE ON public.document_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_document_status_notification();

-- 6.2 Complaint / Blotter Status Change Trigger
CREATE OR REPLACE FUNCTION public.handle_complaint_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  status_label TEXT;
  msg TEXT;
BEGIN
  -- Only trigger if status changed and complainant exists
  IF (TG_OP = 'UPDATE') AND (NEW.status IS DISTINCT FROM OLD.status) AND NEW.complainant_id IS NOT NULL THEN
    CASE NEW.status
      WHEN 'investigating' THEN
        status_label := 'Under Investigation';
        msg := 'Your incident report "' || NEW.title || '" is now under investigation by the Lupong Tagapamayapa / Barangay Tanod.';
      WHEN 'scheduled_hearing' THEN
        status_label := 'Mediation Hearing Scheduled';
        msg := 'A mediation hearing has been scheduled for "' || NEW.title || '". Please check details or visit the Barangay Hall.';
      WHEN 'resolved' THEN
        status_label := 'Resolved';
        msg := 'Your incident report "' || NEW.title || '" has been successfully resolved.';
      WHEN 'dismissed' THEN
        status_label := 'Dismissed';
        msg := 'Your incident report "' || NEW.title || '" was closed or dismissed: ' || COALESCE(NEW.admin_notes, 'See notes.');
      ELSE
        status_label := INITCAP(NEW.status);
        msg := 'Your incident report status was updated to ' || status_label;
    END CASE;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.complainant_id,
      'Blotter Update: ' || status_label,
      msg,
      'complaint',
      '/complaints/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_complaint_status_notification ON public.complaints;
CREATE TRIGGER tr_complaint_status_notification
  AFTER UPDATE OF status ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_complaint_status_notification();
