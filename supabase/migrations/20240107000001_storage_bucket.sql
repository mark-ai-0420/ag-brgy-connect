-- Create business-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-photos', 'business-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to business-photos
CREATE POLICY "Authenticated users can upload business photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-photos');

-- Allow public read access to business photos
CREATE POLICY "Public read access for business photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-photos');

-- Allow users to update/delete their own uploads
CREATE POLICY "Users can update own business photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-photos');

CREATE POLICY "Users can delete own business photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business-photos');
