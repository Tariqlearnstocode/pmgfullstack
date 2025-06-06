/*
  # Clean up transaction history

  1. Changes
    - Make charges positive and payments negative
    - Update transaction amounts to reflect proper accounting
    - Ensure consistent transaction references
    - Fix transaction order and timing
    
  2. Transaction Types
    - Charges are positive amounts (debits)
    - Payments are negative amounts (credits)
*/

-- First, delete all existing transactions to start fresh
DELETE FROM transactions;

-- Get necessary IDs
DO $$
DECLARE
    tenant_id uuid;
    property_id uuid;
    rent_charge_type_id uuid;
    rent_payment_type_id uuid;
    late_fee_charge_type_id uuid;
    late_fee_payment_type_id uuid;
    security_deposit_charge_type_id uuid;
    security_deposit_payment_type_id uuid;
    move_in_charge_type_id uuid;
    tenant_record record;
BEGIN
    -- Get Michael Brown's tenant and property IDs
    SELECT t.id, t.property_id INTO tenant_record
    FROM tenants t
    WHERE t.name = 'Michael Brown';

    tenant_id := tenant_record.id;
    property_id := tenant_record.property_id;

    -- Get transaction type IDs
    SELECT id INTO rent_charge_type_id FROM transaction_types WHERE name = 'rent_charge';
    SELECT id INTO rent_payment_type_id FROM transaction_types WHERE name = 'rent_payment';
    SELECT id INTO late_fee_charge_type_id FROM transaction_types WHERE name = 'late_fee_charge';
    SELECT id INTO late_fee_payment_type_id FROM transaction_types WHERE name = 'late_fee_payment';
    SELECT id INTO security_deposit_charge_type_id FROM transaction_types WHERE name = 'security_deposit_charge';
    SELECT id INTO security_deposit_payment_type_id FROM transaction_types WHERE name = 'security_deposit_payment';
    SELECT id INTO move_in_charge_type_id FROM transaction_types WHERE name = 'move_in_charge';

    -- Insert initial move-in related transactions (April 2024)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    -- Security deposit (charge is positive, payment is negative)
    (tenant_id, property_id, security_deposit_charge_type_id, 1400.00, '2024-04-01 09:00:00', 'SD2024-04'),
    (tenant_id, property_id, security_deposit_payment_type_id, -1400.00, '2024-04-01 09:00:01', 'SD2024-04-PMT'),
    -- Move in charge
    (tenant_id, property_id, move_in_charge_type_id, 150.00, '2024-04-01 09:00:02', 'MOVE-IN-2024-04');

    -- Insert monthly transactions (April 2024 - March 2025)
    -- April 2024 (on-time payment)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2024-04-01 00:00:00', 'RENT-2024-04'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2024-04-01 14:30:00', 'RENT-2024-04-PMT');

    -- May 2024 (late payment with fee)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2024-05-01 00:00:00', 'RENT-2024-05'),
    (tenant_id, property_id, late_fee_charge_type_id, 50.00, '2024-05-06 00:00:00', 'LATE-2024-05'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2024-05-07 10:15:00', 'RENT-2024-05-PMT'),
    (tenant_id, property_id, late_fee_payment_type_id, -50.00, '2024-05-07 10:15:01', 'LATE-2024-05-PMT');

    -- June 2024 (on-time payment)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2024-06-01 00:00:00', 'RENT-2024-06'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2024-06-01 11:45:00', 'RENT-2024-06-PMT');

    -- July 2024 (on-time payment)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2024-07-01 00:00:00', 'RENT-2024-07'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2024-07-01 09:30:00', 'RENT-2024-07-PMT');

    -- August 2024 (late payment with fee)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2024-08-01 00:00:00', 'RENT-2024-08'),
    (tenant_id, property_id, late_fee_charge_type_id, 50.00, '2024-08-06 00:00:00', 'LATE-2024-08'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2024-08-08 16:20:00', 'RENT-2024-08-PMT'),
    (tenant_id, property_id, late_fee_payment_type_id, -50.00, '2024-08-08 16:20:01', 'LATE-2024-08-PMT');

    -- September 2024 (on-time payment)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2024-09-01 00:00:00', 'RENT-2024-09'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2024-09-01 13:15:00', 'RENT-2024-09-PMT');

    -- October 2024 (on-time payment)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2024-10-01 00:00:00', 'RENT-2024-10'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2024-10-01 10:45:00', 'RENT-2024-10-PMT');

    -- November 2024 (on-time payment)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2024-11-01 00:00:00', 'RENT-2024-11'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2024-11-01 14:00:00', 'RENT-2024-11-PMT');

    -- December 2024 (on-time payment)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2024-12-01 00:00:00', 'RENT-2024-12'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2024-12-01 11:30:00', 'RENT-2024-12-PMT');

    -- January 2025 (on-time payment)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2025-01-01 00:00:00', 'RENT-2025-01'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2025-01-01 15:45:00', 'RENT-2025-01-PMT');

    -- February 2025 (on-time payment)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2025-02-01 00:00:00', 'RENT-2025-02'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2025-02-01 12:30:00', 'RENT-2025-02-PMT');

    -- March 2025 (late payment with fee)
    INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, unit_reference)
    VALUES
    (tenant_id, property_id, rent_charge_type_id, 1400.00, '2025-03-01 00:00:00', 'RENT-2025-03'),
    (tenant_id, property_id, late_fee_charge_type_id, 50.00, '2025-03-06 00:00:00', 'LATE-2025-03'),
    (tenant_id, property_id, rent_payment_type_id, -1400.00, '2025-03-08 09:45:00', 'RENT-2025-03-PMT'),
    (tenant_id, property_id, late_fee_payment_type_id, -50.00, '2025-03-08 09:45:01', 'LATE-2025-03-PMT');

END $$;