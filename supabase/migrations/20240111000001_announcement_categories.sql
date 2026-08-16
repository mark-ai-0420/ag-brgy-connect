ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General'
  CHECK (category IN ('General', 'Health', 'Infrastructure', 'Emergency', 'Advisory', 'Programs'));
