-- ============================================================================
-- MIGRATION: 20240116000001_add_image_support.sql
-- Description: Image column support, storage bucket provisioning,
--              complete Sangguniang Barangay roster, and enriched mock data.
-- ============================================================================

-- 1. ADD COLUMNS FOR IMAGE SUPPORT
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS menu_image_url TEXT, ADD COLUMN IF NOT EXISTS misc_image_url TEXT;

-- 2. SETUP STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('announcement-photos', 'announcement-photos', true),
  ('event-photos', 'event-photos', true),
  ('business-photos', 'business-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. STORAGE POLICIES
DO $$
BEGIN
  -- Bucket policies for announcement-photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access for announcement photos'
  ) THEN
    CREATE POLICY "Public read access for announcement photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'announcement-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload announcement photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload announcement photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'announcement-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update announcement photos'
  ) THEN
    CREATE POLICY "Authenticated users can update announcement photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'announcement-photos');
  END IF;

  -- Bucket policies for event-photos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access for event photos'
  ) THEN
    CREATE POLICY "Public read access for event photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'event-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload event photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload event photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'event-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update event photos'
  ) THEN
    CREATE POLICY "Authenticated users can update event photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'event-photos');
  END IF;

  -- Bucket policies for business-photos (if not already existing)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access for business photos'
  ) THEN
    CREATE POLICY "Public read access for business photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'business-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload business photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload business photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'business-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update business photos'
  ) THEN
    CREATE POLICY "Authenticated users can update business photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'business-photos');
  END IF;
END $$;

-- 4. COMPLETE SANGGUNIANG BARANGAY ROSTERS (11 OFFICIALS PER BARANGAY)
DELETE FROM public.barangay_officials;

INSERT INTO public.barangay_officials (name, position, committee, display_order, barangay, term) VALUES
  -- Barangay Daine 1
  ('Hon. Roberto V. Panganiban', 'Punong Barangay', 'Executive / Overall Governance', 1, 'daine_1', '2023 - 2026'),
  ('Hon. Maria E. Cruz', 'Barangay Kagawad', 'Committee on Appropriations & Finance', 2, 'daine_1', '2023 - 2026'),
  ('Hon. Jose M. Santos', 'Barangay Kagawad', 'Committee on Peace & Order and Safety', 3, 'daine_1', '2023 - 2026'),
  ('Hon. Antonio L. Reyes', 'Barangay Kagawad', 'Committee on Health & Sanitation', 4, 'daine_1', '2023 - 2026'),
  ('Hon. Elena B. Gonzales', 'Barangay Kagawad', 'Committee on Education & Culture', 5, 'daine_1', '2023 - 2026'),
  ('Hon. Roberto C. Ramos', 'Barangay Kagawad', 'Committee on Agriculture & Livelihood', 6, 'daine_1', '2023 - 2026'),
  ('Hon. Danilo S. Bautista', 'Barangay Kagawad', 'Committee on Infrastructure & Public Works', 7, 'daine_1', '2023 - 2026'),
  ('Hon. Teresa F. Mendoza', 'Barangay Kagawad', 'Committee on Environment & Clean and Green', 8, 'daine_1', '2023 - 2026'),
  ('Hon. Mark Anthony Cruz', 'SK Chairperson', 'Committee on Youth & Sports Development', 9, 'daine_1', '2023 - 2026'),
  ('Ms. Clarissa V. Villar', 'Barangay Secretary', 'Administrative Operations & Records', 10, 'daine_1', '2023 - 2026'),
  ('Mr. Ricardo T. Gonzales', 'Barangay Treasurer', 'Financial Operations & Disbursing', 11, 'daine_1', '2023 - 2026'),

  -- Barangay Daine 2
  ('Hon. Eduardo L. Villanueva', 'Punong Barangay', 'Executive / Overall Governance', 1, 'daine_2', '2023 - 2026'),
  ('Hon. Carmen R. Garcia', 'Barangay Kagawad', 'Committee on Appropriations & Finance', 2, 'daine_2', '2023 - 2026'),
  ('Hon. Luis A. Mendoza', 'Barangay Kagawad', 'Committee on Peace & Order and Safety', 3, 'daine_2', '2023 - 2026'),
  ('Hon. Fernando J. Castro', 'Barangay Kagawad', 'Committee on Health & Sanitation', 4, 'daine_2', '2023 - 2026'),
  ('Hon. Patricia D. Alcantara', 'Barangay Kagawad', 'Committee on Education & Culture', 5, 'daine_2', '2023 - 2026'),
  ('Hon. Ramon G. Navarro', 'Barangay Kagawad', 'Committee on Agriculture & Livelihood', 6, 'daine_2', '2023 - 2026'),
  ('Hon. Gabriel K. Soriano', 'Barangay Kagawad', 'Committee on Infrastructure & Public Works', 7, 'daine_2', '2023 - 2026'),
  ('Hon. Rowena S. Dimaculangan', 'Barangay Kagawad', 'Committee on Environment & Clean and Green', 8, 'daine_2', '2023 - 2026'),
  ('Hon. Joshua P. Dela Vega', 'SK Chairperson', 'Committee on Youth & Sports Development', 9, 'daine_2', '2023 - 2026'),
  ('Ms. Teresa M. Fernandez', 'Barangay Secretary', 'Administrative Operations & Records', 10, 'daine_2', '2023 - 2026'),
  ('Mr. Mario C. Lopez', 'Barangay Treasurer', 'Financial Operations & Disbursing', 11, 'daine_2', '2023 - 2026');

-- 5. ENRICH SEEDED BUSINESSES
UPDATE public.businesses
SET
  address = 'Sitio Centro, Purok 2, Barangay Daine 1, Indang, Cavite',
  phone = '0918-123-4568',
  hours = 'Mon-Sun: 6:00 AM - 9:00 PM',
  map_url = 'https://maps.google.com/?q=14.1950,120.8770',
  photo_url = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
  menu_image_url = 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=800&q=80',
  misc_image_url = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80'
WHERE name ILIKE '%Aling Maria%';

UPDATE public.businesses
SET
  address = 'Purok 1, Barangay Daine 1, Indang, Cavite',
  phone = '0918-123-4569',
  hours = 'Mon-Sat: 7:00 AM - 6:00 PM, Sun: 7:00 AM - 12:00 PM',
  map_url = 'https://maps.google.com/?q=14.1965,120.8785',
  photo_url = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
  menu_image_url = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
  misc_image_url = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
WHERE name ILIKE '%Pedro Water%';

UPDATE public.businesses
SET
  address = 'National Highway, Purok 3, Barangay Daine 2, Indang, Cavite',
  phone = '0918-987-6542',
  hours = 'Mon-Sat: 8:00 AM - 5:00 PM',
  map_url = 'https://maps.google.com/?q=14.2010,120.8820',
  photo_url = 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
  menu_image_url = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
  misc_image_url = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80'
WHERE name ILIKE '%Lolo Luis%';

-- 6. BACKFILL ANNOUNCEMENTS & EVENTS IMAGES
UPDATE public.announcements 
SET image_url = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80'
WHERE title ILIKE '%Oplan Linis%';

UPDATE public.announcements 
SET image_url = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80'
WHERE title ILIKE '%Relief Goods%';

UPDATE public.announcements 
SET image_url = 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80'
WHERE title ILIKE '%Water Supply%';

UPDATE public.announcements 
SET image_url = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80'
WHERE title ILIKE '%Anti-Rabies%' OR title ILIKE '%Vaccination%';

UPDATE public.announcements
SET image_url = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80'
WHERE image_url IS NULL;

UPDATE public.events
SET image_url = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'
WHERE title ILIKE '%Barangay Assembly%';

UPDATE public.events
SET image_url = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80'
WHERE title ILIKE '%Basketball League%' OR title ILIKE '%Inter-Purok%';

UPDATE public.events
SET image_url = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80'
WHERE title ILIKE '%Medical Mission%';

UPDATE public.events
SET image_url = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
WHERE image_url IS NULL;
