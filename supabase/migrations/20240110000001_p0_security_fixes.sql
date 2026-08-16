-- 1a. Fix profiles RLS — PII Exposure
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Users can always read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

-- Admins and moderators can read all profiles  
CREATE POLICY "Admins can read all profiles" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Anyone can read just id and full_name (via views or limited selects, but since RLS doesn't restrict columns, we allow it to everyone but they can only fetch what we expose. Wait, the instructions say "Anyone to read just id and full_name (for public display like admin complaints join)". Actually RLS doesn't restrict columns, but the user requested this approach. Wait, looking at the instruction:
-- "Since RLS policies can't filter columns, the best approach is: ... " and it only provides two policies. Ah, I see, we don't add a third policy? Wait, "Anyone to read just id and full_name" ... "Since RLS policies can't filter columns, the best approach is: (just the two policies)". Wait, if the admin complaints join runs as an admin, the admin policy covers it. If a public display needs it, maybe they create a view later. I will just stick to the two policies provided.

-- 1b. Add UPDATE policy on complaints for residents
CREATE POLICY "Complainants can update own pending complaints"
  ON public.complaints FOR UPDATE
  USING (auth.uid() = complainant_id AND status = 'pending')
  WITH CHECK (auth.uid() = complainant_id);

-- 1c. Add FK between complaints.complainant_id and profiles.id
ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_complainant_profile_fk
  FOREIGN KEY (complainant_id) REFERENCES public.profiles(id);

-- 1d. Scope business-photos storage policies
-- Note: upload code uses businessId-timestamp as filename, so path-based auth by owner ID isn't directly possible without a schema change.
-- The pragmatic fix is to restrict UPDATE/DELETE to admins.
DROP POLICY IF EXISTS "Users can update own business photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own business photos" ON storage.objects;

CREATE POLICY "Admins can update business photos" ON storage.objects 
  FOR UPDATE TO authenticated
  USING (bucket_id = 'business-photos' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  ));

CREATE POLICY "Admins can delete business photos" ON storage.objects 
  FOR DELETE TO authenticated
  USING (bucket_id = 'business-photos' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 1e. Make complaint-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'complaint-photos';

-- Drop the public read policy
DROP POLICY IF EXISTS "Public read access for complaint photos" ON storage.objects;

-- Add authenticated-only read for complaint photos
CREATE POLICY "Authenticated users can view complaint photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'complaint-photos');
