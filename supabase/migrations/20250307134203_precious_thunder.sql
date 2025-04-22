/*
  # Disable RLS for Tenant Notes

  1. Changes
    - Disable RLS on tenant_notes table
    - Drop existing policies
    - Grant full access to authenticated users

  2. Security
    - Remove RLS restrictions
    - Grant direct table access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON tenant_notes;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON tenant_notes;
DROP POLICY IF EXISTS "Enable update for note owners" ON tenant_notes;

-- Disable RLS
ALTER TABLE tenant_notes DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users
GRANT ALL ON tenant_notes TO authenticated;