-- Migration: 20240128000001_universal_resident_verification_rpc.sql
-- Description: Enables secure anonymous QR verification for residents by UUID or control code

CREATE OR REPLACE FUNCTION public.get_verified_resident(lookup_code TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  barangay public.barangay_unit,
  purok TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_code TEXT;
  target_uuid UUID;
BEGIN
  -- 1. Try direct UUID casting
  BEGIN
    target_uuid := lookup_code::UUID;
    RETURN QUERY
    SELECT p.id, p.full_name, p.barangay, p.purok, p.avatar_url, p.created_at
    FROM public.profiles p
    WHERE p.id = target_uuid;
    RETURN;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Fall through if not a standard UUID
  END;

  -- 2. Try clean control code (stripping BD1-RES- or BD2-RES-)
  clean_code := regexp_replace(lookup_code, '^BD[12]-RES-', '', 'i');
  clean_code := regexp_replace(clean_code, '[^a-zA-Z0-9]', '', 'g');

  IF length(clean_code) >= 6 THEN
    RETURN QUERY
    SELECT p.id, p.full_name, p.barangay, p.purok, p.avatar_url, p.created_at
    FROM public.profiles p
    WHERE replace(p.id::text, '-', '') ILIKE (clean_code || '%')
    LIMIT 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_verified_resident(TEXT) TO anon, authenticated, service_role;
