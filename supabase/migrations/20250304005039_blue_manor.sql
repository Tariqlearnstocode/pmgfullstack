/*
  # Add owner details view

  1. New Views
    - `owner_details`: Combines owner information with property statistics
      - Total properties count
      - Total monthly rent
      - Total active tenants
      - Total vacant properties

  2. Changes
    - Creates a view to efficiently query owner information with aggregated property data
*/

CREATE OR REPLACE VIEW owner_details AS
SELECT 
  o.*,
  COUNT(p.id) as total_properties,
  COALESCE(SUM(p.rent_amount), 0) as total_rent,
  COUNT(t.id) as total_tenants,
  SUM(CASE WHEN ps.name = 'Vacant' THEN 1 ELSE 0 END) as vacant_properties
FROM owners o
LEFT JOIN properties p ON p.owner_id = o.id
LEFT JOIN tenants t ON t.property_id = p.id
LEFT JOIN property_statuses ps ON p.status_id = ps.id
GROUP BY o.id;