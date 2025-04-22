-- Test write access with properties table

-- Update existing property's notes (safer than inserting)
UPDATE properties
SET notes = CASE 
    WHEN notes IS NULL THEN 'Test note added via migration'
    ELSE notes || ' | Test note added via migration'
    END
WHERE id IN (SELECT id FROM properties LIMIT 1);

-- If that doesn't work, try inserting a new property
/*
INSERT INTO properties (
    address,
    city,
    zip,
    rent_amount, 
    late_fee_amount,
    mgmt_fee_percentage
) VALUES (
    '123 Test Street',
    'Test City',
    '12345',
    1500.00,
    50.00,
    10.00
);
*/