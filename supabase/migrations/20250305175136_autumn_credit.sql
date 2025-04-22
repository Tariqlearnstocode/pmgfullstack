/*
  # Fix transaction running balance calculation

  1. Changes
    - Update transaction_details view to correctly calculate running balance
    - Only include tenant-related transactions in balance calculation
    - Ensure transactions are ordered by date and created_at for accurate balance

  2. Technical Details
    - Uses window functions for running balance calculation
    - Filters transactions by type to only include relevant ones
    - Maintains all existing columns and functionality
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
  COALESCE(
    SUM(CASE WHEN t.is_tenant_transaction THEN t.amount ELSE 0 END) 
    OVER (
      PARTITION BY t.tenant_id 
      ORDER BY t.date, t.created_at
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ),
    0
  ) as running_balance
FROM tenant_transactions t
LEFT JOIN tenants ten ON t.tenant_id = ten.id
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN owners o ON p.owner_id = o.id;