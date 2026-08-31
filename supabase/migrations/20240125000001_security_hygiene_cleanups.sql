-- Migration: 20240125000001_security_hygiene_cleanups.sql
-- Description: Security Hygiene & Index Cleanups
-- 1. Drop redundant table-wide public SELECT policy on document_requests (public tracking & verification are secured via get_verified_document RPC)
-- 2. Drop duplicate compound index idx_businesses_scope on businesses (already covered by idx_businesses_barangay_status)
-- 3. Restrict notifications client INSERT policy to own user_id (system triggers run under SECURITY DEFINER and bypass RLS)

-- 1. Clean up document_requests RLS: Remove wide SELECT policy
DROP POLICY IF EXISTS "Public document verification and tracking" ON public.document_requests;

-- 2. Clean up redundant duplicate index on businesses
DROP INDEX IF EXISTS public.idx_businesses_scope;

-- 3. Harden notifications INSERT policy
DROP POLICY IF EXISTS "Authenticated or triggers can insert notifications" ON public.notifications;

CREATE POLICY "Users can only insert own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
