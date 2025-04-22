/*
  # Update Transaction Date Type

  1. Changes
    - Drop transaction_details view to allow column type change
    - Convert date column to date type
    - Recreate transaction_details view

  2. Security
    - Preserves existing RLS policies
*/

-- Drop the view that depends on the date column
DROP VIEW IF EXISTS transaction_details;

-- Convert date column to date type
ALTER TABLE transactions 
  ALTER COLUMN date TYPE date 
  USING date::date;

-- Recreate the transaction_details view
CREATE VIEW transaction_details AS
SELECT 
  t.id,
  t.tenant_id,
  t.property_id,
  t.type_id,
  t.amount,
  t.date,
  t.unit_reference,
  t.invoice_number,
  t.is_manual_edit,
  t.created_at,
  t.description,
  t.notes,
  tt.name as type_name,
  tt.category,
  tt.display_name as type_display_name,
  tn.name as tenant_name,
  tn.email as tenant_email,
  p.address as property_address,
  p.city as property_city,
  p.zip as property_zip,
  o.name as owner_name,
  o.email as owner_email,
  COALESCE(
    (
      SELECT SUM(amount)
      FROM transactions t2
      WHERE t2.tenant_id = t.tenant_id
      AND t2.date <= t.date
    ),
    0
  ) as running_balance
FROM transactions t
LEFT JOIN transaction_types tt ON t.type_id = tt.id
LEFT JOIN tenants tn ON t.tenant_id = tn.id
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN owners o ON p.owner_id = o.id;

-- Grant access to the recreated view
GRANT SELECT ON transaction_details TO authenticated;