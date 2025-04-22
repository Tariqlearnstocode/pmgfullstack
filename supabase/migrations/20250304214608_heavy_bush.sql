/*
  # Add owner details to property view

  1. Changes
    - Update property_details view to include owner information
    - Add owner name, email, and phone to the view output

  2. Details
    - Joins the owners table to include owner details
    - Maintains all existing columns
    - Adds owner name, email, and phone columns
*/

-- Drop and recreate the property_details view to include owner information
DROP VIEW IF EXISTS property_details;

CREATE VIEW property_details AS
SELECT 
  p.*,
  t.id as tenant_id,
  t.name as tenant_name,
  t.email as tenant_email,
  t.current_balance as tenant_balance,
  ts.name as tenant_status,
  ps.name as property_status,
  o.name as owner_name,
  o.email as owner_email,
  o.phone as owner_phone
FROM properties p
LEFT JOIN tenants t ON t.property_id = p.id
LEFT JOIN tenant_statuses ts ON t.status_id = ts.id
LEFT JOIN property_statuses ps ON p.status_id = ps.id
LEFT JOIN owners o ON p.owner_id = o.id;