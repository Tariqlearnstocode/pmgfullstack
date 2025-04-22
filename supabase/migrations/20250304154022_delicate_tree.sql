/*
  # Update transaction types RLS policies

  1. Security
    - Enable RLS on transaction_types table
    - Add policies for:
      - Read access for authenticated users
      - Write access for admin users (future implementation)
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow read access to transaction_types" ON transaction_types;

-- Enable RLS
ALTER TABLE transaction_types ENABLE ROW LEVEL SECURITY;

-- Create read policy for authenticated users
CREATE POLICY "Allow read access to transaction_types"
  ON transaction_types
  FOR SELECT
  TO authenticated
  USING (true);