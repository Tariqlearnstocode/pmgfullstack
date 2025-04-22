-- Migration: add_test_transactions
-- Description: Adds test transactions for the report pages (TenantLedger, PropertyDirectory, OwnerStatement)
-- Created at: 2025-03-11T10:28:00

-- Insert Rent Charges and Payments for John Doe
INSERT INTO transactions (id, tenant_id, property_id, type_id, amount, date, description, created_at)
VALUES 
-- John Doe transactions
(gen_random_uuid(), '6dd87357-f55a-4020-92d3-97af4baf55ac', '6306264a-ee46-4b4e-b12a-4291cd1c4780', 'f61a9c09-ca26-406a-8e62-b54b9651b3a3', 1500, '2025-01-01', 'January Rent Charge', NOW()),
(gen_random_uuid(), '6dd87357-f55a-4020-92d3-97af4baf55ac', '6306264a-ee46-4b4e-b12a-4291cd1c4780', '93c2ba93-927c-432a-a8fe-2cbefe4b6965', -1500, '2025-01-02', 'January Rent Payment', NOW()),
(gen_random_uuid(), '6dd87357-f55a-4020-92d3-97af4baf55ac', '6306264a-ee46-4b4e-b12a-4291cd1c4780', 'f61a9c09-ca26-406a-8e62-b54b9651b3a3', 1500, '2025-02-01', 'February Rent Charge', NOW()),
(gen_random_uuid(), '6dd87357-f55a-4020-92d3-97af4baf55ac', '6306264a-ee46-4b4e-b12a-4291cd1c4780', '93c2ba93-927c-432a-a8fe-2cbefe4b6965', -1500, '2025-02-05', 'February Rent Payment', NOW()),
(gen_random_uuid(), '6dd87357-f55a-4020-92d3-97af4baf55ac', '6306264a-ee46-4b4e-b12a-4291cd1c4780', '7391b8d2-ab6c-4dc8-84d0-023b96dee354', 100, '2025-02-06', 'February Late Fee', NOW()),
(gen_random_uuid(), '6dd87357-f55a-4020-92d3-97af4baf55ac', '6306264a-ee46-4b4e-b12a-4291cd1c4780', 'f61a9c09-ca26-406a-8e62-b54b9651b3a3', 1500, '2025-03-01', 'March Rent Charge', NOW()),
(gen_random_uuid(), '6dd87357-f55a-4020-92d3-97af4baf55ac', '6306264a-ee46-4b4e-b12a-4291cd1c4780', '93c2ba93-927c-432a-a8fe-2cbefe4b6965', -1200, '2025-03-03', 'Partial March Rent Payment', NOW()),
(gen_random_uuid(), '6dd87357-f55a-4020-92d3-97af4baf55ac', '6306264a-ee46-4b4e-b12a-4291cd1c4780', '03508c39-3118-4060-bda7-92828d53af2e', -100, '2025-03-07', 'Late Fee Payment', NOW());

-- Sarah Williams transactions
INSERT INTO transactions (id, tenant_id, property_id, type_id, amount, date, description, created_at)
VALUES
(gen_random_uuid(), '02404903-db89-4a03-8b2d-f311a1b79764', '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', 'b417d5fd-8e1b-4cc2-8d56-19bcd78b5e4a', 2000, '2025-01-15', 'Security Deposit Charge', NOW()),
(gen_random_uuid(), '02404903-db89-4a03-8b2d-f311a1b79764', '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', '9c42b63a-66fa-4958-994d-d1daa489f630', -2000, '2025-01-15', 'Security Deposit Payment', NOW()),
(gen_random_uuid(), '02404903-db89-4a03-8b2d-f311a1b79764', '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', 'f61a9c09-ca26-406a-8e62-b54b9651b3a3', 1350, '2025-02-01', 'February Rent Charge', NOW()),
(gen_random_uuid(), '02404903-db89-4a03-8b2d-f311a1b79764', '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', '93c2ba93-927c-432a-a8fe-2cbefe4b6965', -1350, '2025-02-01', 'February Rent Payment', NOW()),
(gen_random_uuid(), '02404903-db89-4a03-8b2d-f311a1b79764', '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', 'f61a9c09-ca26-406a-8e62-b54b9651b3a3', 1350, '2025-03-01', 'March Rent Charge', NOW()),
(gen_random_uuid(), '02404903-db89-4a03-8b2d-f311a1b79764', '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', '93c2ba93-927c-432a-a8fe-2cbefe4b6965', -1350, '2025-03-02', 'March Rent Payment', NOW()),
(gen_random_uuid(), '02404903-db89-4a03-8b2d-f311a1b79764', '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', '6fda558e-9f16-4139-a4dc-3616d256c743', 250, '2025-03-10', 'Damage to Kitchen Counter', NOW());

-- Emily Davis transactions
INSERT INTO transactions (id, tenant_id, property_id, type_id, amount, date, description, created_at)
VALUES
(gen_random_uuid(), 'ffdeba4d-dd9b-42c6-9045-1f69e9451200', '725ff4fb-1a66-44d4-892e-d67e628dfe97', 'b417d5fd-8e1b-4cc2-8d56-19bcd78b5e4a', 1800, '2024-12-01', 'Security Deposit Charge', NOW()),
(gen_random_uuid(), 'ffdeba4d-dd9b-42c6-9045-1f69e9451200', '725ff4fb-1a66-44d4-892e-d67e628dfe97', '9c42b63a-66fa-4958-994d-d1daa489f630', -1800, '2024-12-05', 'Security Deposit Payment', NOW()),
(gen_random_uuid(), 'ffdeba4d-dd9b-42c6-9045-1f69e9451200', '725ff4fb-1a66-44d4-892e-d67e628dfe97', 'f61a9c09-ca26-406a-8e62-b54b9651b3a3', 1200, '2025-01-01', 'January Rent Charge', NOW()),
(gen_random_uuid(), 'ffdeba4d-dd9b-42c6-9045-1f69e9451200', '725ff4fb-1a66-44d4-892e-d67e628dfe97', '93c2ba93-927c-432a-a8fe-2cbefe4b6965', -1200, '2025-01-03', 'January Rent Payment', NOW()),
(gen_random_uuid(), 'ffdeba4d-dd9b-42c6-9045-1f69e9451200', '725ff4fb-1a66-44d4-892e-d67e628dfe97', 'f61a9c09-ca26-406a-8e62-b54b9651b3a3', 1200, '2025-02-01', 'February Rent Charge', NOW()),
(gen_random_uuid(), 'ffdeba4d-dd9b-42c6-9045-1f69e9451200', '725ff4fb-1a66-44d4-892e-d67e628dfe97', '93c2ba93-927c-432a-a8fe-2cbefe4b6965', -1000, '2025-02-02', 'Partial February Rent Payment', NOW());

-- Add management fees for property owners
INSERT INTO transactions (id, property_id, type_id, amount, date, description, created_at)
VALUES
-- Management fees for property 1
(gen_random_uuid(), '6306264a-ee46-4b4e-b12a-4291cd1c4780', '56095a11-2e00-40cc-86b9-b03927b80d4b', 150, '2025-01-15', 'January Management Fee', NOW()),
(gen_random_uuid(), '6306264a-ee46-4b4e-b12a-4291cd1c4780', '56095a11-2e00-40cc-86b9-b03927b80d4b', 150, '2025-02-15', 'February Management Fee', NOW()),
(gen_random_uuid(), '6306264a-ee46-4b4e-b12a-4291cd1c4780', '56095a11-2e00-40cc-86b9-b03927b80d4b', 150, '2025-03-15', 'March Management Fee', NOW()),

-- Management fees for property 2
(gen_random_uuid(), '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', '56095a11-2e00-40cc-86b9-b03927b80d4b', 135, '2025-01-15', 'January Management Fee', NOW()),
(gen_random_uuid(), '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', '56095a11-2e00-40cc-86b9-b03927b80d4b', 135, '2025-02-15', 'February Management Fee', NOW()),
(gen_random_uuid(), '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', '56095a11-2e00-40cc-86b9-b03927b80d4b', 135, '2025-03-15', 'March Management Fee', NOW()),

-- Management fees for property 3
(gen_random_uuid(), '725ff4fb-1a66-44d4-892e-d67e628dfe97', '56095a11-2e00-40cc-86b9-b03927b80d4b', 120, '2025-01-15', 'January Management Fee', NOW()),
(gen_random_uuid(), '725ff4fb-1a66-44d4-892e-d67e628dfe97', '56095a11-2e00-40cc-86b9-b03927b80d4b', 120, '2025-02-15', 'February Management Fee', NOW()),
(gen_random_uuid(), '725ff4fb-1a66-44d4-892e-d67e628dfe97', '56095a11-2e00-40cc-86b9-b03927b80d4b', 120, '2025-03-15', 'March Management Fee', NOW());

-- Add maintenance costs
INSERT INTO transactions (id, property_id, type_id, amount, date, description, created_at)
VALUES
(gen_random_uuid(), '6306264a-ee46-4b4e-b12a-4291cd1c4780', '3da19128-60af-4781-a95f-11e4186de0dc', 350, '2025-02-10', 'Plumbing Repair', NOW()),
(gen_random_uuid(), '082a0d7b-e8cf-42fc-9a26-858e3fa408c0', '3da19128-60af-4781-a95f-11e4186de0dc', 275, '2025-01-22', 'HVAC Maintenance', NOW()),
(gen_random_uuid(), '725ff4fb-1a66-44d4-892e-d67e628dfe97', '3da19128-60af-4781-a95f-11e4186de0dc', 180, '2025-03-08', 'Appliance Repair', NOW());

-- Update tenant starting balances if the column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'starting_balance') THEN
    UPDATE tenants SET starting_balance = 0 WHERE id = '6dd87357-f55a-4020-92d3-97af4baf55ac';
    UPDATE tenants SET starting_balance = 0 WHERE id = '02404903-db89-4a03-8b2d-f311a1b79764';
    UPDATE tenants SET starting_balance = 200 WHERE id = 'ffdeba4d-dd9b-42c6-9045-1f69e9451200';
  END IF;
END $$;
