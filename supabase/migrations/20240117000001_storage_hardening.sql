-- Migration: 20240115000001_storage_hardening.sql
-- Description: Hardens Supabase storage layer by configuring file size limits, MIME types, and secure RLS policies.

-- 1. Configure Storage Buckets for Hygiene
-- Restrict file uploads to 5MB and only allow specific image types (JPEG, PNG, WebP)
UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5 MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id IN (
  'official-photos',
  'complaint-photos',
  'announcement-photos',
  'event-photos',
  'business-photos'
);

-- 2. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload business photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for business photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update business photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete business photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update business photos" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload complaint photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view complaint photos" ON storage.objects;

DROP POLICY IF EXISTS "Admins/Moderators can upload official photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for official photos" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for event photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event photos" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload announcement photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for announcement photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update announcement photos" ON storage.objects;

-- Helper function to check if user is admin/moderator
-- We reuse the public.get_user_role function but in a subquery for performance.

-- 3. Recreate Secure Policies

-- 3A. business-photos
CREATE POLICY "Public read access for business photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'business-photos');

CREATE POLICY "Authenticated users can upload business photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'business-photos');

CREATE POLICY "Users can update own business photos or admin"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'business-photos' 
  AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
  )
);

CREATE POLICY "Users can delete own business photos or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'business-photos' 
  AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
  )
);

-- 3B. complaint-photos (PRIVATE)
-- Only the owner (uploader) or admins can view complaints
CREATE POLICY "Users can view own complaint photos or admin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'complaint-photos' 
  AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
  )
);

CREATE POLICY "Authenticated users can upload complaint photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'complaint-photos');

CREATE POLICY "Users can update own complaint photos or admin"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'complaint-photos' 
  AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
  )
);

CREATE POLICY "Users can delete own complaint photos or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'complaint-photos' 
  AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
  )
);

-- 3C. official-photos
CREATE POLICY "Public read access for official photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'official-photos');

CREATE POLICY "Admins can manage official photos"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'official-photos'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
)
WITH CHECK (
  bucket_id = 'official-photos'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
);

-- 3D. event-photos
CREATE POLICY "Public read access for event photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-photos');

-- Usually events are managed by admins, but if residents can post events, we fall back to owner check
CREATE POLICY "Authenticated users can upload event photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Users can update own event photos or admin"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-photos' 
  AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
  )
);

CREATE POLICY "Users can delete own event photos or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-photos' 
  AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
  )
);

-- 3E. announcement-photos
CREATE POLICY "Public read access for announcement photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'announcement-photos');

-- Announcements are mostly admins, but let's allow owner/admin edit just in case
CREATE POLICY "Authenticated users can upload announcement photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'announcement-photos');

CREATE POLICY "Users can update own announcement photos or admin"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'announcement-photos' 
  AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
  )
);

CREATE POLICY "Users can delete own announcement photos or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'announcement-photos' 
  AND (
    auth.uid() = owner OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator'))
  )
);
