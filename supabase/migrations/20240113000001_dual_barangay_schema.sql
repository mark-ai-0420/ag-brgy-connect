-- Enums
DO $$ BEGIN
    CREATE TYPE public.barangay_unit AS ENUM ('daine_1', 'daine_2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.content_scope AS ENUM ('daine_1', 'daine_2', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS barangay public.barangay_unit NOT NULL DEFAULT 'daine_1';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS purok TEXT;

-- user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS barangay public.content_scope DEFAULT 'both';

-- barangay_officials
ALTER TABLE public.barangay_officials ADD COLUMN IF NOT EXISTS barangay public.barangay_unit NOT NULL DEFAULT 'daine_1';

-- document_requests
ALTER TABLE public.document_requests ADD COLUMN IF NOT EXISTS barangay public.barangay_unit NOT NULL DEFAULT 'daine_1';

-- complaints
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS barangay public.barangay_unit NOT NULL DEFAULT 'daine_1';

-- announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS scope public.content_scope NOT NULL DEFAULT 'both';

-- events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS scope public.content_scope NOT NULL DEFAULT 'both';

-- emergency_contacts
ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS scope public.content_scope NOT NULL DEFAULT 'both';

-- Update the handle_new_user trigger to include barangay
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, barangay)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    new.email,
    COALESCE(CAST(new.raw_user_meta_data->>'barangay' AS public.barangay_unit), 'daine_1'::public.barangay_unit)
  );

  INSERT INTO public.user_roles (user_id, role, barangay)
  VALUES (
    new.id, 
    'resident',
    'both'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed Daine 1 officials
INSERT INTO public.barangay_officials (id, full_name, role, active, barangay)
VALUES 
  (gen_random_uuid(), 'Hon. Rolando E. Daine', 'Punong Barangay', true, 'daine_1'),
  (gen_random_uuid(), 'Ms. Clarissa Villar', 'Secretary', true, 'daine_1')
ON CONFLICT DO NOTHING;

-- Seed Daine 2 officials
INSERT INTO public.barangay_officials (id, full_name, role, active, barangay)
VALUES 
  (gen_random_uuid(), 'Hon. Danilo M. Mendoza', 'Punong Barangay', true, 'daine_2'),
  (gen_random_uuid(), 'Mr. Arnold P. Cruz', 'Secretary', true, 'daine_2')
ON CONFLICT DO NOTHING;

-- Seed Admin Roles
DO $$ 
DECLARE
  u1 uuid;
  u2 uuid;
  u3 uuid;
BEGIN
  SELECT id INTO u1 FROM auth.users WHERE email = 'markhersonhuelgas@gmail.com';
  IF u1 IS NOT NULL THEN
    UPDATE public.user_roles SET role = 'admin', barangay = 'both' WHERE user_id = u1;
  END IF;

  SELECT id INTO u2 FROM auth.users WHERE email = 'markai0420@gmail.com';
  IF u2 IS NOT NULL THEN
    UPDATE public.user_roles SET role = 'admin', barangay = 'daine_1' WHERE user_id = u2;
  END IF;

  SELECT id INTO u3 FROM auth.users WHERE email = 'markai0420+d2@gmail.com';
  IF u3 IS NOT NULL THEN
    UPDATE public.user_roles SET role = 'admin', barangay = 'daine_2' WHERE user_id = u3;
  END IF;
END $$;
