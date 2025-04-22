/*
  # Tenant Notes System

  1. New Tables
    - `tenant_notes`: Stores notes for tenants
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key)
      - `content` (text)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_deleted` (boolean)

  2. Security
    - Enable RLS on tenant_notes table
    - Add policies for CRUD operations
    - Create secure functions for user data access

  3. Changes
    - Create tenant_notes table
    - Set up RLS policies
    - Add helper functions
*/

-- Create tenant_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS tenant_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- Create secure function to get user metadata
CREATE OR REPLACE FUNCTION get_user_metadata(user_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT raw_user_meta_data
  FROM auth.users
  WHERE id = user_id;
$$;

-- Create secure function to get user email
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT email
  FROM auth.users
  WHERE id = user_id;
$$;

-- Enable RLS on tenant_notes
ALTER TABLE tenant_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to create tenant notes" ON tenant_notes;
  DROP POLICY IF EXISTS "Allow authenticated users to view tenant notes" ON tenant_notes;
  DROP POLICY IF EXISTS "Allow users to update their own notes" ON tenant_notes;
  DROP POLICY IF EXISTS "Allow users to soft delete their own notes" ON tenant_notes;
END $$;

-- Create policies for tenant_notes
CREATE POLICY "Enable insert for authenticated users"
  ON tenant_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable select for authenticated users"
  ON tenant_notes
  FOR SELECT
  TO authenticated
  USING (NOT is_deleted);

CREATE POLICY "Enable update for note owners"
  ON tenant_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;