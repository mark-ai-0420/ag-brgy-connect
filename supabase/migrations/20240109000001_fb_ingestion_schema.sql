-- 1. INGESTED FB POSTS TABLE
CREATE TABLE public.ingested_fb_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fb_post_id TEXT UNIQUE NOT NULL,
  post_url TEXT,
  post_text TEXT NOT NULL,
  is_class_suspension BOOLEAN NOT NULL DEFAULT FALSE,
  affected_levels TEXT,
  reason TEXT,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LGU SYNC SETTINGS TABLE
CREATE TABLE public.lgu_sync_settings (
  id INT PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_publish BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings row
INSERT INTO public.lgu_sync_settings (id, enabled, auto_publish)
VALUES (1, true, true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS POLICIES
ALTER TABLE public.ingested_fb_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgu_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Moderators can view ingested fb posts"
ON public.ingested_fb_posts FOR SELECT
USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

CREATE POLICY "Admins/Moderators can manage ingested fb posts"
ON public.ingested_fb_posts FOR ALL
USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

CREATE POLICY "Admins/Moderators can view lgu sync settings"
ON public.lgu_sync_settings FOR SELECT
USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

CREATE POLICY "Admins/Moderators can manage lgu sync settings"
ON public.lgu_sync_settings FOR ALL
USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
