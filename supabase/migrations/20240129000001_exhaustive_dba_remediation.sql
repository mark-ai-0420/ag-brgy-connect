-- Migration: 20240129000001_exhaustive_dba_remediation.sql
-- Description: Complete DBA Security, RLS Hardening & PostgREST Relation Synchronization

-- 1. APPLY BUSINESS CLAIMS SCHEMA & RLS
CREATE TABLE IF NOT EXISTS public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimant_name TEXT NOT NULL,
  claimant_phone TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'Owner',
  proof_notes TEXT,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

-- 2. FOREIGN KEYS FOR POSTGREST RELATIONAL EMBEDDING & CASCADE REPAIR
ALTER TABLE public.complaints
  DROP CONSTRAINT IF EXISTS complaints_complainant_profile_fk;

ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_complainant_profile_fk
  FOREIGN KEY (complainant_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_businesses_profiles'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT fk_businesses_profiles
      FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_announcements_profiles'
  ) THEN
    ALTER TABLE public.announcements
      ADD CONSTRAINT fk_announcements_profiles
      FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_business_claims_claimant_profile'
  ) THEN
    ALTER TABLE public.business_claims
      ADD CONSTRAINT fk_business_claims_claimant_profile
      FOREIGN KEY (claimant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_business_claims_reviewer_profile'
  ) THEN
    ALTER TABLE public.business_claims
      ADD CONSTRAINT fk_business_claims_reviewer_profile
      FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. INDEX OPTIMIZATIONS
CREATE INDEX IF NOT EXISTS idx_business_claims_reviewed_by 
  ON public.business_claims (reviewed_by);

CREATE INDEX IF NOT EXISTS idx_business_claims_biz_claimant_status 
  ON public.business_claims (business_id, claimant_id, status);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_scope_order 
  ON public.emergency_contacts (scope, display_order ASC);

-- 4. HARDEN SECURITY DEFINER FUNCTIONS & PERMISSIONS
REVOKE EXECUTE ON FUNCTION public.get_user_role(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_document_status_notification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_document_status_notification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_complaint_status_notification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_complaint_status_notification() FROM anon;

GRANT EXECUTE ON FUNCTION public.notify_document_status_change() TO authenticated;

-- 5. RLS POLICY HARDENING & INITPLAN OPTIMIZATIONS
DROP POLICY IF EXISTS "Complainants can update own pending complaints" ON public.complaints;
CREATE POLICY "Complainants can update own pending complaints"
  ON public.complaints FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = complainant_id AND status = 'pending')
  WITH CHECK ((SELECT auth.uid()) = complainant_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins/Moderators can delete document requests" ON public.document_requests;
CREATE POLICY "Admins/Moderators can delete document requests"
  ON public.document_requests FOR DELETE
  TO authenticated
  USING (public.get_user_role((SELECT auth.uid())) IN ('admin', 'moderator'));

DROP POLICY IF EXISTS "Admins/Moderators can delete businesses" ON public.businesses;
CREATE POLICY "Admins/Moderators can delete businesses"
  ON public.businesses FOR DELETE
  TO authenticated
  USING (public.get_user_role((SELECT auth.uid())) IN ('admin', 'moderator'));

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Business Claims Policies
DROP POLICY IF EXISTS "Claimants can view own claims" ON public.business_claims;
DROP POLICY IF EXISTS "Authenticated users can submit claims" ON public.business_claims;
DROP POLICY IF EXISTS "Admins and moderators can view all claims" ON public.business_claims;
DROP POLICY IF EXISTS "Admins and moderators can update claims" ON public.business_claims;
DROP POLICY IF EXISTS "Admins and moderators can delete claims" ON public.business_claims;

CREATE POLICY "Claimants can view own claims"
  ON public.business_claims FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = claimant_id);

CREATE POLICY "Authenticated users can submit claims"
  ON public.business_claims FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = claimant_id);

CREATE POLICY "Admins and moderators can view all claims"
  ON public.business_claims FOR SELECT
  TO authenticated
  USING (public.get_user_role((SELECT auth.uid())) IN ('admin', 'moderator'));

CREATE POLICY "Admins and moderators can update claims"
  ON public.business_claims FOR UPDATE
  TO authenticated
  USING (public.get_user_role((SELECT auth.uid())) IN ('admin', 'moderator'))
  WITH CHECK (public.get_user_role((SELECT auth.uid())) IN ('admin', 'moderator'));

CREATE POLICY "Admins and moderators can delete claims"
  ON public.business_claims FOR DELETE
  TO authenticated
  USING (public.get_user_role((SELECT auth.uid())) IN ('admin', 'moderator'));
