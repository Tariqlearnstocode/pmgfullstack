/*
  # Add tenant balance calculation

  1. New Functions
    - Create function to calculate tenant balance from transactions
    
  2. View Updates
    - Update transaction_details view to include running balance
*/

-- Create function to calculate tenant balance
CREATE OR REPLACE FUNCTION calculate_tenant_balance(
  p_tenant_id uuid,
  p_transaction_date timestamptz
) RETURNS decimal(10,2) AS $$
DECLARE
  v_balance decimal(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_balance
  FROM transactions t
  WHERE t.tenant_id = p_tenant_id
    AND t.date <= p_transaction_date;
    
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Update transaction details view to include running balance
CREATE OR REPLACE VIEW transaction_details AS
SELECT 
  t.*,
  tt.name as type_name,
  tt.category,
  tt.display_name as type_display_name,
  ten.name as tenant_name,
  ten.email as tenant_email,
  p.address as property_address,
  p.city as property_city,
  p.zip as property_zip,
  o.name as owner_name,
  o.email as owner_email,
  calculate_tenant_balance(t.tenant_id, t.date) as running_balance
FROM transactions t
LEFT JOIN transaction_types tt ON t.type_id = tt.id
LEFT JOIN tenants ten ON t.tenant_id = ten.id
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN owners o ON p.owner_id = o.id;