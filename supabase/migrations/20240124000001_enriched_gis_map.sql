-- ============================================================================
-- Migration: 20240124000001_enriched_gis_map.sql
-- Description: Adds GIS coordinates and social links to public.businesses,
--              along with coordinate and scope indexes for fast spatial & directory queries.
-- ============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS messenger_link TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT;

CREATE INDEX IF NOT EXISTS idx_businesses_coords
  ON public.businesses (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_businesses_scope
  ON public.businesses (barangay, status);
