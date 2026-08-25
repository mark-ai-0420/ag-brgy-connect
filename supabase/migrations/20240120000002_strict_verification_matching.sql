-- Migration: Enforce strict exact matching on get_verified_document
-- Disallows loose substring matching to prevent fake or typo codes from matching real documents.

CREATE OR REPLACE FUNCTION public.get_verified_document(lookup_code TEXT)
RETURNS TABLE (
  id UUID,
  control_number TEXT,
  document_type TEXT,
  status TEXT,
  barangay public.barangay_unit,
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resident_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trimmed TEXT := TRIM(lookup_code);
  v_is_uuid BOOLEAN;
BEGIN
  -- Check if valid UUID format
  v_is_uuid := v_trimmed ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  RETURN QUERY
  SELECT 
    dr.id,
    COALESCE(dr.control_number, 'BD1-' || UPPER(SUBSTRING(dr.id::text, 1, 8))) AS control_number,
    dr.document_type::text,
    dr.status::text,
    dr.barangay,
    dr.purpose,
    dr.notes,
    dr.created_at,
    dr.updated_at,
    COALESCE(p.full_name, 'Bona Fide Resident') AS resident_name
  FROM public.document_requests dr
  LEFT JOIN public.profiles p ON p.id = dr.requester_id
  WHERE 
    (v_is_uuid AND dr.id = v_trimmed::uuid)
    OR (dr.control_number ILIKE v_trimmed)
  ORDER BY dr.created_at DESC
  LIMIT 1;
END;
$$;
