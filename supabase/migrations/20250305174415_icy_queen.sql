/*
  # Update tenant balance trigger

  1. Changes
    - Modify update_tenant_balance trigger function to exclude lease fees from tenant balance calculations
    - Lease fees should only affect owner balances, not tenant balances

  2. Technical Details
    - Only include transaction types that are tenant-related in balance calculation
    - Specifically exclude 'Lease Fee' transactions
*/

CREATE OR REPLACE FUNCTION update_tenant_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process transactions that have a tenant_id
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.tenant_id IS NOT NULL THEN
    -- Only include transaction types that should affect tenant balance
    -- Explicitly exclude lease fees as they are owner-related
    IF EXISTS (
      SELECT 1 
      FROM transaction_types tt 
      WHERE tt.id = NEW.type_id 
      AND tt.name != 'Lease Fee'
    ) THEN
      UPDATE tenants
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.tenant_id;
    END IF;
  END IF;

  -- Handle deletion by reversing the amount
  IF TG_OP = 'DELETE' AND OLD.tenant_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 
      FROM transaction_types tt 
      WHERE tt.id = OLD.type_id 
      AND tt.name != 'Lease Fee'
    ) THEN
      UPDATE tenants
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.tenant_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;