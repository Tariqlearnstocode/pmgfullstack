/*
  # Fix date handling for transactions

  1. Changes
    - Drop transaction_details view temporarily
    - Modify transaction date column to use date type instead of timestamptz
    - Recreate transaction_details view
    - Update existing records to use only the date portion

  2. Notes
    - This ensures consistent date handling without timezone issues
    - Removes time component entirely from transaction dates
    - Preserves all view dependencies
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
  tt.name AS type_name,
  tt.category,
  tt.display_name AS type_display_name,
  tn.name AS tenant_name,
  tn.email AS tenant_email,
  p.address AS property_address,
  p.city AS property_city,
  p.zip AS property_zip,
  o.name AS owner_name,
  o.email AS owner_email,
  SUM(t2.amount) OVER (
    PARTITION BY t.tenant_id 
    ORDER BY t.date, t.created_at
    ROWS UNBOUNDED PRECEDING
  ) AS running_balance
FROM transactions t
LEFT JOIN transaction_types tt ON t.type_id = tt.id
LEFT JOIN tenants tn ON t.tenant_id = tn.id
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN owners o ON p.owner_id = o.id
LEFT JOIN transactions t2 ON t.tenant_id = t2.tenant_id 
  AND (t2.date < t.date OR (t2.date = t.date AND t2.created_at <= t.created_at));