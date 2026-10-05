-- Migration: 20240130000001_pluggable_barangays_schema.sql
-- Description: Pluggable Multi-Tenant Barangay Platform Architecture with Generic Registry

-- 1. EXTEND APP_ROLE TO INCLUDE SUPER_ADMIN
DO $$ 
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. CREATE BARANGAYS REGISTRY TABLE
CREATE TABLE IF NOT EXISTS public.barangays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  code_prefix TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  municipality TEXT NOT NULL DEFAULT 'Indang',
  province TEXT NOT NULL DEFAULT 'Cavite',
  region TEXT NOT NULL DEFAULT 'Region IV-A (CALABARZON)',
  zip_code TEXT NOT NULL DEFAULT '4122',

  -- Branding & Assets
  seal_url TEXT,
  logo_url TEXT,
  banner_url TEXT,
  tagline TEXT,
  description TEXT,

  -- Geographic & GIS
  map_center_lat DOUBLE PRECISION NOT NULL DEFAULT 14.1955,
  map_center_lng DOUBLE PRECISION NOT NULL DEFAULT 120.8798,
  map_default_zoom INTEGER NOT NULL DEFAULT 15,
  geojson_boundary JSONB,

  -- Civic Configuration
  puroks JSONB NOT NULL DEFAULT '[]'::jsonb,
  purok_landmarks JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Emergency Hotline Defaults
  emergency_hotline TEXT,
  police_hotline TEXT,
  health_center_hotline TEXT,

  -- Operational Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for barangays
CREATE INDEX IF NOT EXISTS idx_barangays_slug ON public.barangays(slug);
CREATE INDEX IF NOT EXISTS idx_barangays_code_prefix ON public.barangays(code_prefix);
CREATE INDEX IF NOT EXISTS idx_barangays_is_active ON public.barangays(is_active);

-- 3. SEED DEFAULT DAINE 1 AND DAINE 2 RECORDS
INSERT INTO public.barangays (
  id,
  slug,
  code_prefix,
  name,
  short_name,
  municipality,
  province,
  region,
  zip_code,
  puroks,
  map_center_lat,
  map_center_lng,
  map_default_zoom,
  emergency_hotline,
  police_hotline,
  health_center_hotline,
  is_active
)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'daine-1',
  'BD1',
  'Barangay Daine 1',
  'Daine 1',
  'Indang',
  'Cavite',
  'Region IV-A (CALABARZON)',
  '4122',
  '["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Sitio Ilaya", "Sitio Ibaba", "Sitio Centro", "Sitio Boundary"]'::jsonb,
  14.1955,
  120.8798,
  16,
  '(046) 415-0123',
  '(046) 415-0211',
  '(046) 415-0102',
  true
),
(
  '22222222-2222-2222-2222-222222222222',
  'daine-2',
  'BD2',
  'Barangay Daine 2',
  'Daine 2',
  'Indang',
  'Cavite',
  'Region IV-A (CALABARZON)',
  '4122',
  '["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6", "Purok 7"]'::jsonb,
  14.1970,
  120.8860,
  16,
  '(046) 415-0456',
  '(046) 415-0211',
  '(046) 415-0102',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  code_prefix = EXCLUDED.code_prefix,
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  puroks = EXCLUDED.puroks,
  map_center_lat = EXCLUDED.map_center_lat,
  map_center_lng = EXCLUDED.map_center_lng,
  emergency_hotline = EXCLUDED.emergency_hotline,
  updated_at = timezone('utc'::text, now());

-- 4. ADD BARANGAY_ID FOREIGN KEYS TO ALL CORE ENTITIES
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE RESTRICT;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE SET NULL;

ALTER TABLE public.document_requests
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE RESTRICT;

ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE RESTRICT;

ALTER TABLE public.barangay_officials
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE RESTRICT;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE RESTRICT;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE SET NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE SET NULL;

ALTER TABLE public.emergency_contacts
  ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id) ON DELETE SET NULL;

-- 5. BACKFILL DATA FROM LEGACY 'daine_1' / 'daine_2' VALUES
UPDATE public.profiles
SET barangay_id = CASE
  WHEN barangay = 'daine_2' THEN '22222222-2222-2222-2222-222222222222'::uuid
  ELSE '11111111-1111-1111-1111-111111111111'::uuid
END
WHERE barangay_id IS NULL;

UPDATE public.user_roles
SET barangay_id = CASE
  WHEN barangay = 'daine_1' THEN '11111111-1111-1111-1111-111111111111'::uuid
  WHEN barangay = 'daine_2' THEN '22222222-2222-2222-2222-222222222222'::uuid
  ELSE NULL
END
WHERE barangay_id IS NULL AND barangay IS NOT NULL;

UPDATE public.document_requests
SET barangay_id = CASE
  WHEN barangay = 'daine_2' THEN '22222222-2222-2222-2222-222222222222'::uuid
  ELSE '11111111-1111-1111-1111-111111111111'::uuid
END
WHERE barangay_id IS NULL;

UPDATE public.complaints
SET barangay_id = CASE
  WHEN barangay = 'daine_2' THEN '22222222-2222-2222-2222-222222222222'::uuid
  ELSE '11111111-1111-1111-1111-111111111111'::uuid
END
WHERE barangay_id IS NULL;

UPDATE public.barangay_officials
SET barangay_id = CASE
  WHEN barangay = 'daine_2' THEN '22222222-2222-2222-2222-222222222222'::uuid
  ELSE '11111111-1111-1111-1111-111111111111'::uuid
END
WHERE barangay_id IS NULL;

UPDATE public.businesses
SET barangay_id = CASE
  WHEN barangay = 'daine_2' THEN '22222222-2222-2222-2222-222222222222'::uuid
  ELSE '11111111-1111-1111-1111-111111111111'::uuid
END
WHERE barangay_id IS NULL;

UPDATE public.announcements
SET barangay_id = CASE
  WHEN scope = 'daine_1' THEN '11111111-1111-1111-1111-111111111111'::uuid
  WHEN scope = 'daine_2' THEN '22222222-2222-2222-2222-222222222222'::uuid
  ELSE NULL
END
WHERE barangay_id IS NULL;

UPDATE public.events
SET barangay_id = CASE
  WHEN scope = 'daine_1' THEN '11111111-1111-1111-1111-111111111111'::uuid
  WHEN scope = 'daine_2' THEN '22222222-2222-2222-2222-222222222222'::uuid
  ELSE NULL
END
WHERE barangay_id IS NULL;

UPDATE public.emergency_contacts
SET barangay_id = CASE
  WHEN scope = 'daine_1' THEN '11111111-1111-1111-1111-111111111111'::uuid
  WHEN scope = 'daine_2' THEN '22222222-2222-2222-2222-222222222222'::uuid
  ELSE NULL
END
WHERE barangay_id IS NULL;

-- Bootstrap Super Admin Role for system architect
DO $$
DECLARE
  super_uid UUID;
BEGIN
  SELECT id INTO super_uid FROM auth.users WHERE email = 'markhersonhuelgas@gmail.com';
  IF super_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, barangay, barangay_id)
    VALUES (super_uid, 'super_admin', 'both', NULL)
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'super_admin',
      barangay = 'both',
      barangay_id = NULL;
  END IF;
END $$;

-- 6. PERFORMANCE INDEXES ON FOREIGN KEYS
CREATE INDEX IF NOT EXISTS idx_profiles_barangay_id ON public.profiles(barangay_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_barangay_id ON public.user_roles(barangay_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_barangay_id ON public.document_requests(barangay_id);
CREATE INDEX IF NOT EXISTS idx_complaints_barangay_id ON public.complaints(barangay_id);
CREATE INDEX IF NOT EXISTS idx_officials_barangay_id ON public.barangay_officials(barangay_id);
CREATE INDEX IF NOT EXISTS idx_businesses_barangay_id ON public.businesses(barangay_id);
CREATE INDEX IF NOT EXISTS idx_announcements_barangay_id ON public.announcements(barangay_id);
CREATE INDEX IF NOT EXISTS idx_events_barangay_id ON public.events(barangay_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_barangay_id ON public.emergency_contacts(barangay_id);

-- 7. UPDATE HANDLE_NEW_USER TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  v_barangay_id UUID;
  v_meta_brgy TEXT;
  v_legacy_unit public.barangay_unit;
BEGIN
  v_meta_brgy := COALESCE(new.raw_user_meta_data->>'barangay_id', new.raw_user_meta_data->>'barangay', 'daine-1');

  -- Resolve UUID by ID or slug
  IF v_meta_brgy ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_barangay_id := v_meta_brgy::UUID;
  ELSIF v_meta_brgy IN ('daine_2', 'daine-2', 'daine2') THEN
    v_barangay_id := '22222222-2222-2222-2222-222222222222'::UUID;
  ELSE
    SELECT id INTO v_barangay_id FROM public.barangays WHERE slug = v_meta_brgy LIMIT 1;
    IF v_barangay_id IS NULL THEN
      v_barangay_id := '11111111-1111-1111-1111-111111111111'::UUID;
    END IF;
  END IF;

  v_legacy_unit := CASE
    WHEN v_barangay_id = '22222222-2222-2222-2222-222222222222'::UUID THEN 'daine_2'::public.barangay_unit
    ELSE 'daine_1'::public.barangay_unit
  END;

  INSERT INTO public.profiles (id, full_name, avatar_url, email, barangay, barangay_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    new.email,
    v_legacy_unit,
    v_barangay_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    barangay_id = COALESCE(public.profiles.barangay_id, EXCLUDED.barangay_id);

  INSERT INTO public.user_roles (user_id, role, barangay, barangay_id)
  VALUES (
    new.id, 
    'resident',
    'both',
    v_barangay_id
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 8. UPDATE RPC: GET_VERIFIED_DOCUMENT
CREATE OR REPLACE FUNCTION public.get_verified_document(lookup_code TEXT)
RETURNS TABLE (
  id UUID,
  control_number TEXT,
  document_type TEXT,
  status TEXT,
  barangay public.barangay_unit,
  barangay_id UUID,
  barangay_name TEXT,
  barangay_code_prefix TEXT,
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
  v_is_uuid := v_trimmed ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  RETURN QUERY
  SELECT 
    dr.id,
    COALESCE(
      dr.control_number,
      COALESCE(b.code_prefix, CASE WHEN dr.barangay = 'daine_2' THEN 'BD2' ELSE 'BD1' END) || '-' || UPPER(SUBSTRING(dr.id::text, 1, 8))
    ) AS control_number,
    dr.document_type::text,
    dr.status::text,
    dr.barangay,
    dr.barangay_id,
    COALESCE(b.name, CASE WHEN dr.barangay = 'daine_2' THEN 'Barangay Daine 2' ELSE 'Barangay Daine 1' END) AS barangay_name,
    COALESCE(b.code_prefix, CASE WHEN dr.barangay = 'daine_2' THEN 'BD2' ELSE 'BD1' END) AS barangay_code_prefix,
    dr.purpose,
    dr.notes,
    dr.created_at,
    dr.updated_at,
    COALESCE(p.full_name, 'Bona Fide Resident') AS resident_name
  FROM public.document_requests dr
  LEFT JOIN public.profiles p ON p.id = dr.requester_id
  LEFT JOIN public.barangays b ON b.id = dr.barangay_id
  WHERE 
    (v_is_uuid AND dr.id = v_trimmed::uuid)
    OR (dr.control_number ILIKE v_trimmed)
  ORDER BY dr.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_verified_document(TEXT) TO anon, authenticated, service_role;

-- 9. UPDATE RPC: GET_VERIFIED_RESIDENT
CREATE OR REPLACE FUNCTION public.get_verified_resident(lookup_code TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  barangay public.barangay_unit,
  barangay_id UUID,
  barangay_name TEXT,
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
    SELECT 
      p.id, 
      p.full_name, 
      p.barangay, 
      p.barangay_id,
      COALESCE(b.name, CASE WHEN p.barangay = 'daine_2' THEN 'Barangay Daine 2' ELSE 'Barangay Daine 1' END) AS barangay_name,
      p.purok, 
      p.avatar_url, 
      p.created_at
    FROM public.profiles p
    LEFT JOIN public.barangays b ON b.id = p.barangay_id
    WHERE p.id = target_uuid;
    RETURN;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Fall through if not a standard UUID
  END;

  -- 2. Try clean control code (stripping BD1-RES- or BD2-RES- or other prefix)
  clean_code := regexp_replace(lookup_code, '^[A-Z0-9]+-RES-', '', 'i');
  clean_code := regexp_replace(clean_code, '[^a-zA-Z0-9]', '', 'g');

  IF length(clean_code) >= 6 THEN
    RETURN QUERY
    SELECT 
      p.id, 
      p.full_name, 
      p.barangay, 
      p.barangay_id,
      COALESCE(b.name, CASE WHEN p.barangay = 'daine_2' THEN 'Barangay Daine 2' ELSE 'Barangay Daine 1' END) AS barangay_name,
      p.purok, 
      p.avatar_url, 
      p.created_at
    FROM public.profiles p
    LEFT JOIN public.barangays b ON b.id = p.barangay_id
    WHERE replace(p.id::text, '-', '') ILIKE (clean_code || '%')
    LIMIT 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_verified_resident(TEXT) TO anon, authenticated, service_role;

-- 10. ROW LEVEL SECURITY ON BARANGAYS TABLE
ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active barangays" ON public.barangays;
CREATE POLICY "Public can view active barangays" ON public.barangays
  FOR SELECT
  USING (
    is_active = true 
    OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can manage barangays" ON public.barangays;
CREATE POLICY "Super admins can manage barangays" ON public.barangays
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin'
    )
  );
