-- 20240121000001_resident_id_and_msme_growth.sql
-- Function to get verified resident public badge
CREATE OR REPLACE FUNCTION public.get_verified_resident(resident_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  barangay public.barangay_unit,
  purok TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.barangay, p.purok, p.created_at
  FROM public.profiles p
  WHERE p.id = resident_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_verified_resident(UUID) TO anon, authenticated, service_role;

-- Ensure public.businesses columns for MSME growth
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS barangay public.barangay_unit DEFAULT 'daine_1',
  ADD COLUMN IF NOT EXISTS purok TEXT,
  ADD COLUMN IF NOT EXISTS messenger_link TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{Cash,GCash}';

-- Ensure RLS is enabled on public.businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Refresh policies for public.businesses
DROP POLICY IF EXISTS "Public can view approved businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners can view own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins/Moderators can view all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can submit business listings" ON public.businesses;
DROP POLICY IF EXISTS "Owners can update own pending/approved business" ON public.businesses;
DROP POLICY IF EXISTS "Owners can update own business" ON public.businesses;
DROP POLICY IF EXISTS "Admins/Moderators can update any business" ON public.businesses;

CREATE POLICY "Public can view approved businesses" 
  ON public.businesses 
  FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "Owners can view own businesses" 
  ON public.businesses 
  FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins/Moderators can view all businesses" 
  ON public.businesses 
  FOR SELECT 
  USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

CREATE POLICY "Users can submit business listings" 
  ON public.businesses 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own business" 
  ON public.businesses 
  FOR UPDATE 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins/Moderators can update any business" 
  ON public.businesses 
  FOR UPDATE 
  USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
