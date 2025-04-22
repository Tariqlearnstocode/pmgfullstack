/*
  # Fix transaction details view

  1. Changes
    - Fix running balance calculation to properly handle tenant transactions
    - Only include specific tenant-related transactions in balance:
      - Rent Charge/Payment
      - Security Deposit Charge/Payment
      - Late Fee/Payment
      - Move In Charge/Payment
      - Tenant Damage Charge
      - Other Tenant Payment
    - Fix GROUP BY clause error

  2. Technical Details
    - Use window functions for running balance calculation
    - Filter transaction types in a CTE
    - Properly group all non-aggregated columns
*/

CREATE OR REPLACE VIEW transaction_details AS
WITH tenant_transactions AS (
  SELECT 
    t.*,
    tt.name as type_name,
    tt.category,
    tt.display_name as type_display_name,
    CASE 
      WHEN tt.name IN (
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
      ) THEN true
      ELSE false
    END as is_tenant_transaction
  FROM transactions t
  JOIN transaction_types tt ON t.type_id = tt.id
),
running_balances AS (
  SELECT 
    t.*,
    SUM(CASE WHEN t.is_tenant_transaction THEN t.amount ELSE 0 END) 
      OVER (
        PARTITION BY t.tenant_id 
        ORDER BY t.date, t.created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) as running_balance
  FROM tenant_transactions t
)
SELECT 
  t.id,
  t.tenant_id,
  t.property_id,
  t.type_id,
  t.amount,
  t.date,
  t.unit_reference,
  t.invoice_number,
  t.is_manual_edit,
  t.created_at,
  t.description,
  t.notes,
  t.type_name,
  t.category,
  t.type_display_name,
  ten.name as tenant_name,
  ten.email as tenant_email,
  p.address as property_address,
  p.city as property_city,
  p.zip as property_zip,
  o.name as owner_name,
  o.email as owner_email,
  COALESCE(t.running_balance, 0) as running_balance
FROM running_balances t
LEFT JOIN tenants ten ON t.tenant_id = ten.id
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN owners o ON p.owner_id = o.id;