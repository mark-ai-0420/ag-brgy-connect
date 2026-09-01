-- 20240126000001_business_claims_schema.sql
-- MSME Business Ownership Claiming Schema & RLS

CREATE TABLE IF NOT EXISTS public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimant_name TEXT NOT NULL,
  claimant_phone TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'Owner',
  proof_notes TEXT,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_business_claims_business_id ON public.business_claims(business_id);
CREATE INDEX IF NOT EXISTS idx_business_claims_claimant_id ON public.business_claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_business_claims_status ON public.business_claims(status);
CREATE INDEX IF NOT EXISTS idx_business_claims_created_at ON public.business_claims(created_at DESC);

-- Enable Row-Level Security
ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Claimants can view own claims"
  ON public.business_claims
  FOR SELECT
  USING (auth.uid() = claimant_id);

CREATE POLICY "Authenticated users can submit claims"
  ON public.business_claims
  FOR INSERT
  WITH CHECK (auth.uid() = claimant_id);

CREATE POLICY "Admins and moderators can view all claims"
  ON public.business_claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can update claims"
  ON public.business_claims
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );
