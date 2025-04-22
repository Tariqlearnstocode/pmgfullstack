/*
  # Create admin user

  1. New Users
    - Creates an admin user with email/password authentication
    - Email: admin@propmanager.com
    - Password: admin123 (hashed)

  2. Security
    - User is created in auth schema
    - Password is properly hashed
*/

-- Create admin user with hashed password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_current,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@propmanager.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;