/*
  # Add MLI Group Properties

  1. New Properties Added
    - 5 properties with varying configurations:
      - Luxury Downtown Condo
      - Suburban Family Home
      - Modern Apartment
      - Historic Townhouse
      - Studio Apartment
    
  2. Property Details
    - Each property has:
      - Full address information
      - Management fee percentage
      - Late fee amount
      - Rent amount
      - Insurance status
      - Status (mix of occupied and vacant)

  3. Notes
    - All properties are owned by MLI Group
    - Management fees standardized at 10%
    - Insurance required for all properties
*/

-- Insert properties for MLI Group
INSERT INTO properties (
  address,
  city,
  zip,
  owner_id,
  status_id,
  has_insurance,
  mgmt_fee_percentage,
  late_fee_amount,
  rent_amount,
  lease_fee_percentage,
  current_balance,
  notes
) VALUES
-- Property 1: Luxury Downtown Condo
(
  '789 Market Street, Unit 1205',
  'Springfield',
  '12345',
  (SELECT id FROM owners WHERE name = 'MLI Group'),
  (SELECT id FROM property_statuses WHERE name = 'Available'),
  true,
  10.00,
  100.00,
  2800.00,
  50.00,
  0.00,
  'Luxury downtown condo with city views, granite countertops, and hardwood floors'
),
-- Property 2: Suburban Family Home
(
  '456 Oak Lane',
  'Springfield',
  '12345',
  (SELECT id FROM owners WHERE name = 'MLI Group'),
  (SELECT id FROM property_statuses WHERE name = 'Available'),
  true,
  10.00,
  75.00,
  2200.00,
  50.00,
  0.00,
  'Spacious 4-bedroom family home with fenced backyard and 2-car garage'
),
-- Property 3: Modern Apartment
(
  '123 Pine Street, Apt 304',
  'Springfield',
  '12345',
  (SELECT id FROM owners WHERE name = 'MLI Group'),
  (SELECT id FROM property_statuses WHERE name = 'Available'),
  true,
  10.00,
  85.00,
  1950.00,
  50.00,
  0.00,
  'Modern 2-bedroom apartment with updated appliances and in-unit laundry'
),
-- Property 4: Historic Townhouse
(
  '321 Maple Avenue',
  'Springfield',
  '12345',
  (SELECT id FROM owners WHERE name = 'MLI Group'),
  (SELECT id FROM property_statuses WHERE name = 'Available'),
  true,
  10.00,
  90.00,
  2500.00,
  50.00,
  0.00,
  'Charming 3-bedroom historic townhouse with original features and updated systems'
),
-- Property 5: Studio Apartment
(
  '567 Elm Court, Unit 101',
  'Springfield',
  '12345',
  (SELECT id FROM owners WHERE name = 'MLI Group'),
  (SELECT id FROM property_statuses WHERE name = 'Available'),
  true,
  10.00,
  50.00,
  1200.00,
  50.00,
  0.00,
  'Cozy studio apartment perfect for single occupancy, includes utilities'
);