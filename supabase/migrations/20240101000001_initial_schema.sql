-- Create custom app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'business_owner', 'resident');

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER_ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'resident',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_roles_user_id_key UNIQUE (user_id)
);

-- 3. BUSINESSES TABLE
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Sari-Sari Store', 'Eatery / Carenderia', 'Water Station', 'Laundry', 
    'Salon', 'Repair Shop', 'Clinic', 'Pharmacy', 'Tailoring', 'Others'
  )),
  description TEXT,
  address TEXT,
  phone TEXT,
  hours TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  photo_url TEXT,
  map_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ANNOUNCEMENTS TABLE
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EVENTS TABLE
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DOCUMENT REQUESTS TABLE
CREATE TABLE public.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'barangay_clearance', 'barangay_id', 'certificate_of_residency', 
    'certificate_of_indigency', 'business_permit', 'other'
  )),
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_review', 'ready', 'completed', 'rejected'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EMERGENCY CONTACTS TABLE
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label TEXT,
  phone TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS public.app_role AS $$
  SELECT role FROM public.user_roles WHERE user_id = uid LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS POLICIES

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- USER ROLES
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- BUSINESSES
CREATE POLICY "Public can view approved businesses" ON public.businesses FOR SELECT USING (status = 'approved');
CREATE POLICY "Owners can view own businesses" ON public.businesses FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Admins/Moderators can view all businesses" ON public.businesses FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Users can submit business listings" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own pending/approved business" ON public.businesses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Admins/Moderators can update any business" ON public.businesses FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- ANNOUNCEMENTS
CREATE POLICY "Public can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins/Moderators can manage announcements" ON public.announcements FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- EVENTS
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins/Moderators can manage events" ON public.events FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- DOCUMENT REQUESTS
CREATE POLICY "Requesters can view own requests" ON public.document_requests FOR SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Requesters can create requests" ON public.document_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Admins/Moderators can view all document requests" ON public.document_requests FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Admins/Moderators can update document requests" ON public.document_requests FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- EMERGENCY CONTACTS
CREATE POLICY "Public can view emergency contacts" ON public.emergency_contacts FOR SELECT USING (true);
CREATE POLICY "Admins/Moderators can manage emergency contacts" ON public.emergency_contacts FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'moderator'));

-- AUTOMATED SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'resident');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
