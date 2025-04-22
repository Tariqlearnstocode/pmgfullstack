/*
  # Add transaction details view

  1. New Views
    - `transaction_details`: Combines transaction information with related data
      - Transaction type and category
      - Tenant information (if applicable)
      - Property information
      - Owner information

  2. Changes
    - Creates a view to efficiently query transaction information with related data
*/

CREATE OR REPLACE VIEW transaction_details AS
SELECT 
  t.*,
  tt.name as type_name,
  tt.category,
  tt.display_name as type_display_name,
  ten.name as tenant_name,
  ten.email as tenant_email,
  p.address as property_address,
  p.city as property_city,
  p.zip as property_zip,
  o.name as owner_name,
  o.email as owner_email
FROM transactions t
LEFT JOIN transaction_types tt ON t.type_id = tt.id
LEFT JOIN tenants ten ON t.tenant_id = ten.id
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN owners o ON p.owner_id = o.id;