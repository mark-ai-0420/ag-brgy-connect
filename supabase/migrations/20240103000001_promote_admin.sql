-- Promote markhersonhuelgas@gmail.com to admin role
-- Run this AFTER signing up on the app with that email

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'markhersonhuelgas@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please sign up on the app first, then run this script.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id)
  DO UPDATE SET role = 'admin';

  RAISE NOTICE 'Successfully promoted markhersonhuelgas@gmail.com to admin!';
END $$;
