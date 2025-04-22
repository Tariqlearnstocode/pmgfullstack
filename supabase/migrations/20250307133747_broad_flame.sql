/*
  # Add tenant notes functionality
  
  1. New Tables
    - `tenant_notes`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to tenants)
      - `content` (text)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_deleted` (boolean)

  2. Security
    - Enable RLS on `tenant_notes` table
    - Add policies for authenticated users to manage notes
*/

-- Create tenant notes table
CREATE TABLE IF NOT EXISTS tenant_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_notes_tenant_id ON tenant_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_notes_created_by ON tenant_notes(created_by);

-- Enable RLS
ALTER TABLE tenant_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to view tenant notes"
  ON tenant_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create tenant notes"
  ON tenant_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to update their own notes"
  ON tenant_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_tenant_notes_updated_at
  BEFORE UPDATE ON tenant_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();