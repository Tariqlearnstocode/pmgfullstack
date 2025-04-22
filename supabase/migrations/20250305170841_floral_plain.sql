/*
  # Add property statuses

  1. New Data
    - Add default property statuses if they don't exist:
      - Available
      - Occupied
      - Maintenance
      - Not Available

  2. Security
    - Ensure property statuses exist without duplicates
*/

DO $$ 
BEGIN
  -- Available
  IF NOT EXISTS (SELECT 1 FROM property_statuses WHERE name = 'Available') THEN
    INSERT INTO property_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Available', 'Property is available for rent');
  END IF;

  -- Occupied
  IF NOT EXISTS (SELECT 1 FROM property_statuses WHERE name = 'Occupied') THEN
    INSERT INTO property_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000002', 'Occupied', 'Property is currently occupied by a tenant');
  END IF;

  -- Maintenance
  IF NOT EXISTS (SELECT 1 FROM property_statuses WHERE name = 'Maintenance') THEN
    INSERT INTO property_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000003', 'Property is under maintenance', 'Property is under maintenance');
  END IF;

  -- Not Available
  IF NOT EXISTS (SELECT 1 FROM property_statuses WHERE name = 'Not Available') THEN
    INSERT INTO property_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000004', 'Not Available', 'Property is not available for rent');
  END IF;
END $$;