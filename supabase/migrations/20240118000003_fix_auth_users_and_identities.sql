-- Fix GoTrue scanner error: replace NULL tokens with empty strings
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL 
   OR recovery_token IS NULL 
   OR email_change_token_new IS NULL 
   OR email_change IS NULL;

-- Fix missing auth.identities for seeded users without writing to generated email column
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  id, 
  id::text,
  'email', 
  jsonb_build_object('sub', id, 'email', email, 'email_verified', true, 'phone_verified', false), 
  now(), 
  now(), 
  now()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities WHERE auth.identities.user_id = auth.users.id
);
