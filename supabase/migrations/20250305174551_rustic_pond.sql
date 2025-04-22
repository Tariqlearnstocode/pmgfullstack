/*
  # Update tenant balance trigger

  1. Changes
    - Modify update_tenant_balance trigger function to only include tenant-related transactions
    - Explicitly define which transaction types affect tenant balances
    - Remove any owner-related transactions from balance calculations

  2. Technical Details
    - Only include specific transaction types:
      - Rent Charge
      - Rent Payment
      - Security Deposit Charge
      - Security Deposit Payment
      - Late Fee
      - Late Fee Payment
      - Move In Charge
      - Move In Payment
      - Tenant Damage Charge
      - Other Tenant Payment
*/

CREATE OR REPLACE FUNCTION update_tenant_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process transactions that have a tenant_id
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.tenant_id IS NOT NULL THEN
    -- Only include specific tenant-related transaction types
    IF EXISTS (
      SELECT 1 
      FROM transaction_types tt 
      WHERE tt.id = NEW.type_id 
      AND tt.name IN (
        'Rent Charge',
        'Rent Payment',
        'Security Deposit Charge',
        'Security Deposit Payment',
        'Late Fee',
        'Late Fee Payment',
        'Move In Charge',
        'Move In Payment',
        'Tenant Damage Charge',
        'Other Tenant Payment'
      )
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
      AND tt.name IN (
        'Rent Charge',
        'Rent Payment',
        'Security Deposit Charge',
        'Security Deposit Payment',
        'Late Fee',
        'Late Fee Payment',
        'Move In Charge',
        'Move In Payment',
        'Tenant Damage Charge',
        'Other Tenant Payment'
      )
    ) THEN
      UPDATE tenants
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.tenant_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;