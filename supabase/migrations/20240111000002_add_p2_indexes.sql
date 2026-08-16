-- Performance indexes for frequently queried/ordered columns
CREATE INDEX IF NOT EXISTS idx_complaints_complainant_id ON public.complaints(complainant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created ON public.announcements(pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events(starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_barangay_officials_display_order ON public.barangay_officials(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_display_order ON public.emergency_contacts(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_ingested_fb_posts_created_at ON public.ingested_fb_posts(created_at DESC);
