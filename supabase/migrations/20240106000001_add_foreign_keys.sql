-- Add foreign key constraints between public tables to enable PostgREST relational embedding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_document_requests_profiles'
  ) THEN
    ALTER TABLE public.document_requests
      ADD CONSTRAINT fk_document_requests_profiles
      FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_roles_profiles'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT fk_user_roles_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
