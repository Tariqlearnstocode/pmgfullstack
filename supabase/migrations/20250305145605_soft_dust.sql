/*
  # Add Lease Fee Trigger

  1. New Function
    - Creates a function to automatically generate lease fees when move-in payments are recorded
    - Calculates lease fee based on property's lease_fee_percentage
    - Only triggers for move-in payment transactions
    - Creates a new transaction for the lease fee

  2. New Trigger
    - Adds trigger to run after move-in payment transactions are inserted
    - Calls the lease fee function
*/

-- Create function to handle lease fee creation
CREATE OR REPLACE FUNCTION create_lease_fee()
RETURNS TRIGGER AS $$
DECLARE
  v_property_record RECORD;
  v_transaction_type_id UUID;
BEGIN
  -- Only proceed for move-in payments
  SELECT id INTO v_transaction_type_id 
  FROM transaction_types 
  WHERE name = 'move_in_payment';

  IF NEW.type_id = v_transaction_type_id THEN
    -- Get property details
    SELECT * INTO v_property_record
    FROM properties
    WHERE id = NEW.property_id;

    -- Only create lease fee if property has a lease fee percentage
    IF v_property_record.lease_fee_percentage IS NOT NULL AND 
       v_property_record.lease_fee_percentage > 0 THEN
      
      -- Get lease fee transaction type
      SELECT id INTO v_transaction_type_id 
      FROM transaction_types 
      WHERE name = 'lease_fee';

      -- Calculate lease fee amount
      -- Note: Move-in payment is negative, so we use ABS to get positive value
      -- Then calculate percentage and make it positive since it's an income
      INSERT INTO transactions (
        type_id,
        property_id,
        tenant_id,
        amount,
        date,
        unit_reference,
        description
      ) VALUES (
        v_transaction_type_id,
        NEW.property_id,
        NEW.tenant_id,
        ABS(NEW.amount) * (v_property_record.lease_fee_percentage / 100),
        NEW.date,
        NEW.unit_reference,
        'Automatic lease fee for move-in payment'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS create_lease_fee_trigger ON transactions;
CREATE TRIGGER create_lease_fee_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_lease_fee();