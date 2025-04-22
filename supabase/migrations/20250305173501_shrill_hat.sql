/*
  # Add One Year of Transactions for Sarah Williams

  1. Transaction Types
    - Rent charges on 1st of each month
    - Rent payments on 15th of each month
    - Management fees on last day of each month

  2. Details
    - One year of transactions (12 months)
    - Consistent payment pattern
    - Management fees calculated based on property's fee percentage
*/

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
INSERT INTO transactions (
  tenant_id,
  property_id,
  type_id,
  amount,
  date,
  description
)
SELECT
  tenant_id,
  property_id,
  type_id,
  amount,
  date,
  description
FROM (
  -- Generate rent charges (1st of each month)
  SELECT 
    tenant_id,
    property_id,
    charge_type_id as type_id,
    monthly_rent as amount,
    (date_trunc('month', NOW()) - interval '12 months' + make_interval(months => n))::date as date,
    'Monthly Rent Charge' as description
  FROM tenant_info
  CROSS JOIN generate_series(0, 11) n

  UNION ALL

  -- Generate rent payments (15th of each month)
  SELECT 
    tenant_id,
    property_id,
    payment_type_id as type_id,
    -monthly_rent as amount,
    (date_trunc('month', NOW()) - interval '12 months' + make_interval(months => n) + interval '14 days')::date as date,
    'Monthly Rent Payment' as description
  FROM tenant_info
  CROSS JOIN generate_series(0, 11) n

  UNION ALL

  -- Generate management fees (Last day of each month)
  SELECT 
    tenant_id,
    property_id,
    mgmt_fee_type_id as type_id,
    -(monthly_rent * (mgmt_fee_percentage / 100)) as amount,
    (date_trunc('month', NOW()) - interval '12 months' + make_interval(months => n + 1) - interval '1 day')::date as date,
    'Monthly Management Fee' as description
  FROM tenant_info
  CROSS JOIN generate_series(0, 11) n
) transactions
ORDER BY date;