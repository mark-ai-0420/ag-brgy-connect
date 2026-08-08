-- 1. CREATE COMPLAINTS TABLE
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complainant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Noise Complaint',
    'Sanitation & Trash',
    'Public Safety / Nuisance',
    'Boundary / Property',
    'Barangay Staff / Official',
    'Street Lights & Infra',
    'Dispute / Blotter',
    'Others'
  )),
  description TEXT NOT NULL,
  location TEXT,
  incident_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'investigating',
    'scheduled_hearing',
    'resolved',
    'dismissed'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'low',
    'medium',
    'high',
    'urgent'
  )),
  photo_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ENABLE RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES
-- Residents can view their own non-anonymous complaints
CREATE POLICY "Complainants can view own complaints"
ON public.complaints FOR SELECT
USING (auth.uid() = complainant_id);

-- Residents can insert complaints
CREATE POLICY "Users can submit complaints"
ON public.complaints FOR INSERT
WITH CHECK (auth.uid() = complainant_id OR complainant_id IS NULL);

-- Admins and Moderators can view all complaints
CREATE POLICY "Admins/Moderators can view all complaints"
ON public.complaints FOR SELECT
USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- Admins and Moderators can update complaints
CREATE POLICY "Admins/Moderators can update complaints"
ON public.complaints FOR UPDATE
USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- Admins and Moderators can delete complaints
CREATE POLICY "Admins/Moderators can delete complaints"
ON public.complaints FOR DELETE
USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- 4. STORAGE BUCKET FOR COMPLAINT PHOTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-photos', 'complaint-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload complaint photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'complaint-photos');

CREATE POLICY "Public read access for complaint photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'complaint-photos');
