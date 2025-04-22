/*
  # Add Automatic Fee Triggers

  1. New Functions
    - `get_transaction_type_id`: Helper function to get transaction type ID by name
    - `create_management_fee`: Creates management fee transaction
    - `create_lease_fee`: Creates lease fee transaction
  
  2. New Triggers
    - Trigger for management fees on rent payments
    - Trigger for lease fees on move-in charges
*/

-- Helper function to get transaction type ID
CREATE OR REPLACE FUNCTION get_transaction_type_id(type_name text)
RETURNS uuid AS $$
DECLARE
  type_id uuid;
BEGIN
  SELECT id INTO type_id FROM transaction_types WHERE name = type_name;
  RETURN type_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create management fee transaction
CREATE OR REPLACE FUNCTION create_management_fee()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  property_record record;
  mgmt_fee_amount decimal(10,2);
  mgmt_fee_type_id uuid;
BEGIN
  -- Only proceed for rent payments
  IF NOT EXISTS (
    SELECT 1 FROM transaction_types 
    WHERE id = NEW.type_id AND name = 'rent_payment'
  ) THEN
    RETURN NEW;
  END IF;

  -- Get property details
  SELECT * INTO property_record
  FROM properties
  WHERE id = NEW.property_id;

  -- Calculate management fee (negative amount since it's a charge)
  mgmt_fee_amount := (ABS(NEW.amount) * property_record.mgmt_fee_percentage / 100) * -1;
  
  -- Get management fee transaction type
  mgmt_fee_type_id := get_transaction_type_id('management_fee');

  -- Create management fee transaction
  INSERT INTO transactions (
    tenant_id,
    property_id,
    type_id,
    amount,
    date,
    unit_reference,
    is_manual_edit
  ) VALUES (
    NEW.tenant_id,
    NEW.property_id,
    mgmt_fee_type_id,
    mgmt_fee_amount,
    NEW.date,
    'MGMT-' || NEW.unit_reference,
    false
  );

  RETURN NEW;
END;
$$;

-- Function to create lease fee transaction
CREATE OR REPLACE FUNCTION create_lease_fee()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  property_record record;
  lease_fee_amount decimal(10,2);
  lease_fee_type_id uuid;
BEGIN
  -- Only proceed for move-in charges
  IF NOT EXISTS (
    SELECT 1 FROM transaction_types 
    WHERE id = NEW.type_id AND name = 'move_in_charge'
  ) THEN
    RETURN NEW;
  END IF;

  -- Get property details
  SELECT * INTO property_record
  FROM properties
  WHERE id = NEW.property_id;

  -- Calculate lease fee (negative amount since it's a charge)
  lease_fee_amount := (ABS(NEW.amount) * property_record.lease_fee_percentage / 100) * -1;
  
  -- Get lease fee transaction type
  lease_fee_type_id := get_transaction_type_id('lease_fee');

  -- Create lease fee transaction
  INSERT INTO transactions (
    tenant_id,
    property_id,
    type_id,
    amount,
    date,
    unit_reference,
    is_manual_edit
  ) VALUES (
    NEW.tenant_id,
    NEW.property_id,
    lease_fee_type_id,
    lease_fee_amount,
    NEW.date,
    'LEASE-' || NEW.unit_reference,
    false
  );

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS create_management_fee_trigger ON transactions;
CREATE TRIGGER create_management_fee_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_management_fee();

DROP TRIGGER IF EXISTS create_lease_fee_trigger ON transactions;
CREATE TRIGGER create_lease_fee_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_lease_fee();