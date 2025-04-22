/*
  # Add tenant statuses

  1. New Data
    - Add default tenant statuses:
      - Active
      - Late
      - Past Due
      - Eviction
      - Moved Out
      - Inactive

  2. Security
    - Ensure tenant statuses exist without duplicates
*/

DO $$ 
BEGIN
  -- Active
  IF NOT EXISTS (SELECT 1 FROM tenant_statuses WHERE name = 'Active') THEN
    INSERT INTO tenant_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Active', 'Tenant is currently active and in good standing');
  END IF;

  -- Late
  IF NOT EXISTS (SELECT 1 FROM tenant_statuses WHERE name = 'Late') THEN
    INSERT INTO tenant_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000002', 'Late', 'Tenant has missed the current rent payment');
  END IF;

  -- Past Due
  IF NOT EXISTS (SELECT 1 FROM tenant_statuses WHERE name = 'Past Due') THEN
    INSERT INTO tenant_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000003', 'Past Due', 'Tenant has multiple missed payments');
  END IF;

  -- Eviction
  IF NOT EXISTS (SELECT 1 FROM tenant_statuses WHERE name = 'Eviction') THEN
    INSERT INTO tenant_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000004', 'Eviction', 'Tenant is in the eviction process');
  END IF;

  -- Moved Out
  IF NOT EXISTS (SELECT 1 FROM tenant_statuses WHERE name = 'Moved Out') THEN
    INSERT INTO tenant_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000005', 'Moved Out', 'Tenant has moved out of the property');
  END IF;

  -- Inactive
  IF NOT EXISTS (SELECT 1 FROM tenant_statuses WHERE name = 'Inactive') THEN
    INSERT INTO tenant_statuses (id, name, description)
    VALUES ('00000000-0000-0000-0000-000000000006', 'Inactive', 'Tenant is no longer active');
  END IF;
END $$;