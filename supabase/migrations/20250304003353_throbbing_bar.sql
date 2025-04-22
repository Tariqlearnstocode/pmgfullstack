/*
  # Sample Data Population

  1. Data Overview
    - 5 property owners
    - 10 properties
    - 8 tenants
    - Various transactions

  2. Notes
    - All data is fictional and representative
    - Dates are set relative to current year (2025)
    - Realistic rental amounts and fees
*/

-- Get status IDs
DO $$
DECLARE
    active_status_id uuid;
    late_status_id uuid;
    occupied_status_id uuid;
    vacant_status_id uuid;
    rent_payment_type_id uuid;
    security_deposit_type_id uuid;
    maintenance_type_id uuid;
BEGIN
    -- Get tenant status IDs
    SELECT id INTO active_status_id FROM tenant_statuses WHERE name = 'Active';
    SELECT id INTO late_status_id FROM tenant_statuses WHERE name = 'Late';
    
    -- Get property status IDs
    SELECT id INTO occupied_status_id FROM property_statuses WHERE name = 'Occupied';
    SELECT id INTO vacant_status_id FROM property_statuses WHERE name = 'Vacant';
    
    -- Get transaction type IDs
    SELECT id INTO rent_payment_type_id FROM transaction_types WHERE name = 'rent_payment';
    SELECT id INTO security_deposit_type_id FROM transaction_types WHERE name = 'security_deposit';
    SELECT id INTO maintenance_type_id FROM transaction_types WHERE name = 'maintenance';

    -- Insert Owners
    INSERT INTO owners (name, email, phone) VALUES
    ('Robert Smith', 'robert.smith@example.com', '(555) 123-4567'),
    ('Jennifer Johnson', 'jennifer.j@example.com', '(555) 987-6543'),
    ('Michael Williams', 'michael.w@example.com', '(555) 456-7890'),
    ('Elizabeth Brown', 'elizabeth.b@example.com', '(555) 789-0123'),
    ('David Jones', 'david.j@example.com', '(555) 234-5678');

    -- Insert Properties
    WITH owner_ids AS (SELECT id, name FROM owners)
    INSERT INTO properties 
    (address, city, zip, owner_id, status_id, has_insurance, mgmt_fee_percentage, late_fee_amount, rent_amount, lease_fee_percentage, notes)
    SELECT
        address,
        'Anytown',
        '12345',
        owner_id,
        status_id,
        has_insurance,
        mgmt_fee_percentage,
        late_fee_amount,
        rent_amount,
        lease_fee_percentage,
        notes
    FROM (
        VALUES
        ('123 Main St, Apt 101', (SELECT id FROM owner_ids WHERE name = 'Robert Smith'), occupied_status_id, true, 10, 50, 1200, 50, 'Recently renovated kitchen'),
        ('456 Oak Ave, Unit 202', (SELECT id FROM owner_ids WHERE name = 'Jennifer Johnson'), occupied_status_id, true, 10, 50, 1500, 50, 'New appliances installed 2024'),
        ('789 Pine Rd, Apt 303', (SELECT id FROM owner_ids WHERE name = 'Robert Smith'), vacant_status_id, true, 10, 50, 1350, 50, 'Available for immediate occupancy'),
        ('321 Elm St, Unit 404', (SELECT id FROM owner_ids WHERE name = 'Elizabeth Brown'), occupied_status_id, false, 10, 50, 1100, 50, 'Insurance renewal pending'),
        ('654 Maple Dr, Apt 505', (SELECT id FROM owner_ids WHERE name = 'Michael Williams'), occupied_status_id, true, 10, 50, 1400, 50, 'Regular maintenance up to date'),
        ('987 Cedar Ln, Unit 606', (SELECT id FROM owner_ids WHERE name = 'Jennifer Johnson'), occupied_status_id, true, 10, 50, 1250, 50, 'New carpet installed'),
        ('159 Birch St, Apt 707', (SELECT id FROM owner_ids WHERE name = 'David Jones'), occupied_status_id, true, 10, 50, 1300, 50, 'Fresh paint throughout'),
        ('753 Spruce Ave, Unit 808', (SELECT id FROM owner_ids WHERE name = 'Elizabeth Brown'), vacant_status_id, false, 10, 50, 1450, 50, 'Showing available')
    ) AS v(address, owner_id, status_id, has_insurance, mgmt_fee_percentage, late_fee_amount, rent_amount, lease_fee_percentage, notes);

    -- Insert Tenants
    WITH property_ids AS (SELECT id, address FROM properties)
    INSERT INTO tenants 
    (name, email, monthly_rent, security_deposit, current_balance, status_id, property_id, lease_start_date, lease_end_date, move_in_date)
    SELECT
        name,
        email,
        monthly_rent,
        security_deposit,
        current_balance,
        status_id,
        (SELECT id FROM property_ids WHERE address = property_address),
        lease_start_date::date,
        lease_end_date::date,
        move_in_date::date
    FROM (
        VALUES
        ('John Doe', 'john.doe@example.com', 1200, 1200, 0, active_status_id, '123 Main St, Apt 101', '2024-01-01', '2025-01-01', '2024-01-01'),
        ('Jane Smith', 'jane.smith@example.com', 1500, 1500, -150, active_status_id, '456 Oak Ave, Unit 202', '2024-02-01', '2025-02-01', '2024-02-01'),
        ('Sarah Williams', 'sarah.w@example.com', 1100, 1100, 0, active_status_id, '321 Elm St, Unit 404', '2024-03-01', '2025-03-01', '2024-03-01'),
        ('Michael Brown', 'michael.b@example.com', 1400, 1400, 0, active_status_id, '654 Maple Dr, Apt 505', '2024-04-01', '2025-04-01', '2024-04-01'),
        ('Emily Davis', 'emily.d@example.com', 1250, 1250, 1250, late_status_id, '987 Cedar Ln, Unit 606', '2024-05-01', '2025-05-01', '2024-05-01'),
        ('David Miller', 'david.m@example.com', 1300, 1300, 0, active_status_id, '159 Birch St, Apt 707', '2024-06-01', '2025-06-01', '2024-06-01')
    ) AS v(name, email, monthly_rent, security_deposit, current_balance, status_id, property_address, lease_start_date, lease_end_date, move_in_date);

    -- Insert Transactions
    WITH tenant_ids AS (SELECT id, name FROM tenants),
         property_ids AS (SELECT id, address FROM properties)
    INSERT INTO transactions 
    (tenant_id, property_id, type_id, amount, date, unit_reference)
    SELECT
        (SELECT id FROM tenant_ids WHERE name = tenant_name),
        (SELECT id FROM property_ids WHERE address = property_address),
        type_id,
        amount,
        date::timestamptz,
        unit_reference
    FROM (
        VALUES
        ('John Doe', '123 Main St, Apt 101', rent_payment_type_id, 1200, '2025-04-01', 'APR2025'),
        ('Jane Smith', '456 Oak Ave, Unit 202', rent_payment_type_id, 1500, '2025-04-01', 'APR2025'),
        ('Sarah Williams', '321 Elm St, Unit 404', rent_payment_type_id, 1100, '2025-04-01', 'APR2025'),
        ('Michael Brown', '654 Maple Dr, Apt 505', rent_payment_type_id, 1400, '2025-04-01', 'APR2025'),
        ('David Miller', '159 Birch St, Apt 707', rent_payment_type_id, 1300, '2025-04-01', 'APR2025'),
        ('John Doe', '123 Main St, Apt 101', security_deposit_type_id, 1200, '2024-01-01', 'SD2024'),
        ('Jane Smith', '456 Oak Ave, Unit 202', maintenance_type_id, -350, '2025-03-15', 'MAINT123'),
        ('Emily Davis', '987 Cedar Ln, Unit 606', security_deposit_type_id, 1250, '2024-05-01', 'SD2024')
    ) AS v(tenant_name, property_address, type_id, amount, date, unit_reference);
END $$;