/*
  # Add tenant notes trigger

  1. Changes
    - Create trigger function for updating updated_at column
    - Add trigger to tenant_notes table if it doesn't exist

  2. Safety
    - Check if trigger exists before creating
    - Use IF NOT EXISTS clauses
*/

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_tenant_notes_updated_at'
  ) THEN
    DROP TRIGGER update_tenant_notes_updated_at ON tenant_notes;
  END IF;
END $$;

-- Create trigger
CREATE TRIGGER update_tenant_notes_updated_at
  BEFORE UPDATE ON tenant_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();