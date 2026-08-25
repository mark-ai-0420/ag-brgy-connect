-- ============================================================================
-- Migration: 20240123000001_add_businesses_barangay_status_index.sql
-- Description: Adds compound index on public.businesses (barangay, status)
--              to optimize dual-barangay MSME directory filtering.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_businesses_barangay_status 
  ON public.businesses (barangay, status);
