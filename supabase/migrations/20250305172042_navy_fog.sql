/*
  # Add Property Summary View

  1. New Views
    - `property_summary_view`
      - Combines property data with status information
      - Includes tenant balance calculations
      - Joins with property_statuses for status names

  2. Changes
    - Creates a new view to support the owner statement summary report
    - Handles proper status name resolution
    - Includes all necessary property and tenant information
*/

CREATE OR REPLACE VIEW property_summary_view AS
SELECT 
  p.id,
  p.address,
  p.city,
  p.zip,
  p.owner_id,
  p.status_id,
  ps.name as status_name,
  p.has_insurance,
  p.mgmt_fee_percentage,
  p.late_fee_amount,
  p.rent_amount,
  p.lease_fee_percentage,
  p.current_balance as property_balance,
  p.notes,
  p.status_date,
  p.created_at,
  t.id as tenant_id,
  t.name as tenant_name,
  t.email as tenant_email,
  t.current_balance as tenant_balance,
  ts.name as tenant_status,
  o.name as owner_name,
  o.email as owner_email,
  o.phone as owner_phone
FROM properties p
LEFT JOIN property_statuses ps ON p.status_id = ps.id
LEFT JOIN tenants t ON t.property_id = p.id
LEFT JOIN tenant_statuses ts ON t.status_id = ts.id
LEFT JOIN owners o ON p.owner_id = o.id;