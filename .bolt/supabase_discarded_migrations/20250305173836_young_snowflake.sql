/*
  # Add Transaction Types and Sample Data

  1. New Transaction Types
    - Rent Charge
    - Rent Payment
    - Management Fee
    - Insurance
    - Late Fee
    - Lease Fee
    - Maintenance

  2. Sample Data
    - Add transactions for Sarah Williams including:
      - Rent charges
      - Rent payments
      - Management fees
      - Insurance payments
*/

-- First, create transaction types
INSERT INTO transaction_types (name, category, display_name) VALUES
  ('Rent Charge', 'Charge', 'Monthly Rent'),
  ('Rent Payment', 'Payment', 'Rent Payment'),
  ('Management Fee', 'Expense', 'Management Fee'),
  ('Insurance', 'Expense', 'Insurance Payment'),
  ('Late Fee', 'Charge', 'Late Fee'),
  ('Lease Fee', 'Expense', 'Lease Fee'),
  ('Maintenance', 'Expense', 'Maintenance')
ON CONFLICT (name) DO NOTHING;

-- Now add transactions for Sarah Williams
WITH tenant_info AS (
  SELECT 
    t.id as tenant_id,
    t.property_id,
    t.monthly_rent,
    p.mgmt_fee_percentage,
    tt_charge.id as charge_type_id,
    tt_payment.id as payment_type_id,
    tt_mgmt.id as mgmt_fee_type_id
  FROM tenants t
  JOIN properties p ON t.property_id = p.id
  JOIN transaction_types tt_charge ON tt_charge.name = 'Rent Charge'
  JOIN transaction_types tt_payment ON tt_payment.name = 'Rent Payment'
  JOIN transaction_types tt_mgmt ON tt_mgmt.name = 'Management Fee'
  WHERE t.name = 'Sarah Williams'
  LIMIT 1
)
INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, description)
SELECT 
  tenant_id, 
  property_id, 
  charge_type_id, 
  monthly_rent, 
  DATE '2024-04-01', 
  'Monthly Rent Charge' 
FROM tenant_info

UNION ALL

SELECT 
  tenant_id, 
  property_id, 
  payment_type_id, 
  -monthly_rent, 
  DATE '2024-04-15', 
  'Monthly Rent Payment' 
FROM tenant_info

UNION ALL

SELECT 
  NULL, 
  property_id, 
  mgmt_fee_type_id, 
  -(monthly_rent * mgmt_fee_percentage / 100), 
  DATE '2024-04-30', 
  'Monthly Management Fee' 
FROM tenant_info;