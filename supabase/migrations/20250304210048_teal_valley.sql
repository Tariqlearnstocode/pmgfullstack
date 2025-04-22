/*
  # Fix transaction details view and add tenant balance tracking

  1. Changes
    - Add function to calculate tenant balance
    - Add trigger to automatically update tenant balance on transaction changes
    - Update all tenant balances based on their transactions
    - Update transaction_details view to include running balance

  2. Security
    - No changes to RLS policies needed
*/

-- Create function to calculate tenant balance
CREATE OR REPLACE FUNCTION calculate_tenant_balance(p_tenant_id uuid) 
RETURNS decimal(10,2) AS $$
DECLARE
  v_balance decimal(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_balance
  FROM transactions
  WHERE tenant_id = p_tenant_id;
    
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update tenant balance
CREATE OR REPLACE FUNCTION update_tenant_balance() 
RETURNS TRIGGER AS $$
BEGIN
  -- If tenant_id is provided, update their balance
  IF NEW.tenant_id IS NOT NULL THEN
    UPDATE tenants
    SET current_balance = calculate_tenant_balance(NEW.tenant_id)
    WHERE id = NEW.tenant_id;
  END IF;
  
  -- If tenant_id was changed and old tenant_id exists, update old tenant's balance
  IF TG_OP = 'UPDATE' AND OLD.tenant_id IS NOT NULL AND OLD.tenant_id != NEW.tenant_id THEN
    UPDATE tenants
    SET current_balance = calculate_tenant_balance(OLD.tenant_id)
    WHERE id = OLD.tenant_id;
  END IF;
  
  -- If tenant_id was deleted, update their balance
  IF TG_OP = 'DELETE' AND OLD.tenant_id IS NOT NULL THEN
    UPDATE tenants
    SET current_balance = calculate_tenant_balance(OLD.tenant_id)
    WHERE id = OLD.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS update_tenant_balance_trigger ON transactions;
CREATE TRIGGER update_tenant_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_tenant_balance();

-- Update all tenant balances
UPDATE tenants
SET current_balance = calculate_tenant_balance(id);

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
  ten.current_balance as running_balance,
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