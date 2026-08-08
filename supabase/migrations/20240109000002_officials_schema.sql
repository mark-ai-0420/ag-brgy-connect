-- Create barangay_officials table
CREATE TABLE public.barangay_officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL, -- Punong Barangay, Barangay Kagawad, SK Chairperson, Barangay Secretary, Barangay Treasurer, Chief Tanod
  committee TEXT, -- Appropriations, Peace & Order, Health & Sanitation, Education, Infrastructure, Agriculture, Youth & Sports, Way and Means
  photo_url TEXT,
  contact_number TEXT,
  term TEXT NOT NULL DEFAULT '2023 - 2026',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.barangay_officials ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public read access for barangay_officials"
ON public.barangay_officials FOR SELECT
TO public USING (true);

-- Admin manage policy
CREATE POLICY "Admins/Moderators can manage barangay_officials"
ON public.barangay_officials FOR ALL
USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- Create official-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('official-photos', 'official-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload official photos"
ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'official-photos');

CREATE POLICY "Public read access for official photos"
ON storage.objects FOR SELECT
TO public USING (bucket_id = 'official-photos');

-- Seed initial Barangay Daine officials
INSERT INTO public.barangay_officials (name, position, committee, display_order) VALUES
('Hon. Rolando E. Daine', 'Punong Barangay', 'Executive / Overall Governance', 1),
('Hon. Maria Santos', 'Barangay Kagawad', 'Committee on Appropriations & Finance', 2),
('Hon. Juan Dela Cruz', 'Barangay Kagawad', 'Committee on Peace & Order and Safety', 3),
('Hon. Antonio Reyes', 'Barangay Kagawad', 'Committee on Health & Sanitation', 4),
('Hon. Elena Gonzales', 'Barangay Kagawad', 'Committee on Infrastructure & Public Works', 5),
('Hon. Roberto Ramos', 'Barangay Kagawad', 'Committee on Agriculture & Livelihood', 6),
('Hon. Teresa Mendoza', 'Barangay Kagawad', 'Committee on Education & Culture', 7),
('Hon. Mark Anthony Cruz', 'SK Chairperson', 'Committee on Youth & Sports Development', 8),
('Ms. Clarissa Villar', 'Barangay Secretary', 'Administrative Operations & Records', 9),
('Mr. Jaime Hernandez', 'Barangay Treasurer', 'Financial Operations & Disbursing', 10);
