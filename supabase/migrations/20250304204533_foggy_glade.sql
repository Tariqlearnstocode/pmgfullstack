/*
  # Update Transaction Types

  1. Changes
    - Update transaction types to use charge/payment categories
    - Add new transaction types for charges and payments
    
  2. Transaction Types Added
    Charges:
      - Rent charge
      - Move in charge
      - Late fee charge
      - Security deposit charge
      - Tenant damage charge
      - Management fee
      - Lease fee
      - Invoice deduction
      - Owner Insurance fee
      - Other owner charge
    
    Payments:
      - Rent payment
      - Security deposit payment
      - Late fee payment
      - Other tenant payment
*/

-- First, update existing transaction types to avoid foreign key violations
UPDATE transaction_types
SET 
  name = 'rent_payment',
  category = 'Payment',
  display_name = 'Rent Payment'
WHERE name = 'rent_payment';

UPDATE transaction_types
SET 
  name = 'security_deposit_payment',
  category = 'Payment',
  display_name = 'Security Deposit Payment'
WHERE name = 'security_deposit';

UPDATE transaction_types
SET 
  name = 'late_fee_payment',
  category = 'Payment',
  display_name = 'Late Fee Payment'
WHERE name = 'late_fee';

-- Delete any remaining old transaction types that aren't referenced
DELETE FROM transaction_types
WHERE name NOT IN (
  'rent_payment',
  'security_deposit_payment',
  'late_fee_payment'
) AND NOT EXISTS (
  SELECT 1 FROM transactions WHERE transactions.type_id = transaction_types.id
);

-- Insert new transaction types
INSERT INTO transaction_types (name, category, display_name)
SELECT * FROM (
  VALUES
    -- Charges
    ('rent_charge', 'Charge', 'Rent Charge'),
    ('move_in_charge', 'Charge', 'Move In Charge'),
    ('late_fee_charge', 'Charge', 'Late Fee Charge'),
    ('security_deposit_charge', 'Charge', 'Security Deposit Charge'),
    ('tenant_damage_charge', 'Charge', 'Tenant Damage Charge'),
    ('management_fee', 'Charge', 'Management Fee'),
    ('lease_fee', 'Charge', 'Lease Fee'),
    ('invoice_deduction', 'Charge', 'Invoice Deduction'),
    ('owner_insurance_fee', 'Charge', 'Owner Insurance Fee'),
    ('other_owner_charge', 'Charge', 'Other Owner Charge'),
    
    -- Additional Payments (ones that weren't updated above)
    ('other_tenant_payment', 'Payment', 'Other Tenant Payment')
) AS new_types(name, category, display_name)
WHERE NOT EXISTS (
  SELECT 1 FROM transaction_types WHERE transaction_types.name = new_types.name
);