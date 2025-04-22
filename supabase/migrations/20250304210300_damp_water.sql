/*
  # Fix tenant ledger view

  1. Changes
    - Update transaction_details view to calculate running balance per transaction
    - Order transactions by date ascending for proper balance calculation
    - Keep current_balance in tenants table for the total balance

  2. Security
    - No changes to RLS policies needed
*/

-- Create function to calculate running balance up to a specific transaction
CREATE OR REPLACE FUNCTION calculate_running_balance(
  p_tenant_id uuid,
  p_transaction_date timestamptz,
  p_transaction_id uuid
) RETURNS decimal(10,2) AS $$
DECLARE
  v_balance decimal(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_balance
  FROM transactions t
  WHERE t.tenant_id = p_tenant_id
    AND (t.date < p_transaction_date 
         OR (t.date = p_transaction_date 
             AND (t.id < p_transaction_id 
                  OR t.id = p_transaction_id)));
    
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the transaction_details view
DROP VIEW IF EXISTS transaction_details;
CREATE VIEW transaction_details AS
SELECT 
  t.*,
  tt.name as type_name,
  tt.category,
  tt.display_name as type_display_name,
  ten.name as tenant_name,
  ten.email as tenant_email,
  calculate_running_balance(t.tenant_id, t.date, t.id) as running_balance,
  p.address as property_address,
  p.city as property_city,
  p.zip as property_zip,
  o.name as owner_name,
  o.email as owner_email
FROM transactions t
LEFT JOIN transaction_types tt ON t.type_id = tt.id
LEFT JOIN tenants ten ON t.tenant_id = ten.id
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN owners o ON p.owner_id = o.id;