-- ====================================================================
-- SECURITY AND PERFORMANCE HARDENING MIGRATION
-- ====================================================================

-- 1. HARDEN SECURITY DEFINER FUNCTIONS & REVOKE PUBLIC RPC EXECUTION
-- 1a. get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS public.app_role 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
BEGIN
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT role FROM public.user_roles WHERE user_id = uid LIMIT 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon, authenticated;

-- 1b. handle_new_user (revoke execute from client roles)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 1c. notify_document_status_change
CREATE OR REPLACE FUNCTION public.notify_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_url text;
  service_key text;
BEGIN
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

REVOKE EXECUTE ON FUNCTION public.notify_document_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_document_status_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_document_status_change() FROM authenticated;

-- 1d. rls_auto_enable
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- 2. RLS POLICY HARDENING
-- 2a. Profiles update policy WITH CHECK
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles 
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 2b. Businesses update policy WITH CHECK
DROP POLICY IF EXISTS "Owners can update own pending/approved business" ON public.businesses;
CREATE POLICY "Owners can update own pending/approved business" ON public.businesses
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

-- 2c. Storage upload restrictions on official photos (admin/moderator only)
DROP POLICY IF EXISTS "Authenticated users can upload official photos" ON storage.objects;
CREATE POLICY "Admins/Moderators can upload official photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'official-photos' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('admin', 'moderator')
    )
  );

-- 3. PERFORMANCE INDEXES
-- 3a. Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON public.announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_ingested_fb_posts_announcement_id ON public.ingested_fb_posts(announcement_id);

-- 3b. Dual-Barangay & Composite Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_barangay ON public.profiles(barangay);
CREATE INDEX IF NOT EXISTS idx_document_requests_barangay_status ON public.document_requests(barangay, status);
CREATE INDEX IF NOT EXISTS idx_complaints_barangay_status ON public.complaints(barangay, status);
CREATE INDEX IF NOT EXISTS idx_announcements_scope_pinned_created ON public.announcements(scope, pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_scope_starts ON public.events(scope, starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_barangay_officials_barangay_order ON public.barangay_officials(barangay, display_order ASC);
