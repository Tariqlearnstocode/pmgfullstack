/*
  # Add tenant balance update trigger

  1. New Functions
    - update_tenant_balance(): Updates tenant balance after transaction changes
      - Recalculates tenant balance based on all transactions
      - Updates tenant.current_balance field
      
  2. Triggers
    - update_tenant_balance_trigger: Fires after INSERT, UPDATE, or DELETE on transactions
    - Ensures tenant balance stays accurate

  3. Changes
    - No schema changes, only adds trigger functionality
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_tenant_balance()
RETURNS TRIGGER AS $$
DECLARE
  tenant_to_update uuid;
BEGIN
  -- Get the tenant_id to update
  tenant_to_update := CASE
    WHEN TG_OP = 'DELETE' THEN OLD.tenant_id
    ELSE NEW.tenant_id
  END;

  -- If tenant_id exists, update their balance
  IF (TG_OP = 'DELETE' AND OLD.tenant_id IS NOT NULL) OR 
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.tenant_id IS NOT NULL) THEN
    
    -- Update tenant balance by summing all their transactions
    UPDATE tenants
    SET current_balance = COALESCE(
      (
        SELECT SUM(amount)
        FROM transactions
        WHERE tenant_id = tenant_to_update
      ),
      0
    )
    WHERE id = tenant_to_update;
  END IF;

  -- Return appropriate row based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS update_tenant_balance_trigger ON transactions;
CREATE TRIGGER update_tenant_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_balance();