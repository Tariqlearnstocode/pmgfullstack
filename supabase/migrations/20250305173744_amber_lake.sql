/*
  # Add One Year of Transactions for Sarah Williams

  1. New Transactions
    - Monthly rent charges for tenant (1st of each month)
    - Monthly rent payments from tenant (15th of each month)
    - Monthly management fees for property (last day of each month)
    All transactions for the past 12 months
*/

-- First, get Sarah's tenant info and required transaction types
WITH tenant_info AS (
  SELECT 
    t.id as tenant_id,
    t.property_id,
    t.monthly_rent,
    p.mgmt_fee_percentage,
    tt_charge.id as charge_type_id,
    tt_payment.id as payment_type_id,
    tt_mgmt.id as mgmt_fee_type_id
  FROM tenants t
  JOIN properties p ON t.property_id = p.id
  JOIN transaction_types tt_charge ON tt_charge.name = 'Rent Charge'
  JOIN transaction_types tt_payment ON tt_payment.name = 'Rent Payment'
  JOIN transaction_types tt_mgmt ON tt_mgmt.name = 'Management Fee'
  WHERE t.name = 'Sarah Williams'
  LIMIT 1
)
INSERT INTO transactions (tenant_id, property_id, type_id, amount, date, description)

-- April 2024
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2024-04-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2024-04-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2024-04-30', 'Monthly Management Fee' FROM tenant_info

-- March 2024
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2024-03-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2024-03-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2024-03-31', 'Monthly Management Fee' FROM tenant_info

-- February 2024
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2024-02-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2024-02-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2024-02-29', 'Monthly Management Fee' FROM tenant_info

-- January 2024
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2024-01-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2024-01-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2024-01-31', 'Monthly Management Fee' FROM tenant_info

-- December 2023
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2023-12-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2023-12-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2023-12-31', 'Monthly Management Fee' FROM tenant_info

-- November 2023
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2023-11-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2023-11-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2023-11-30', 'Monthly Management Fee' FROM tenant_info

-- October 2023
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2023-10-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2023-10-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2023-10-31', 'Monthly Management Fee' FROM tenant_info

-- September 2023
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2023-09-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2023-09-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2023-09-30', 'Monthly Management Fee' FROM tenant_info

-- August 2023
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2023-08-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2023-08-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2023-08-31', 'Monthly Management Fee' FROM tenant_info

-- July 2023
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2023-07-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2023-07-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2023-07-31', 'Monthly Management Fee' FROM tenant_info

-- June 2023
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2023-06-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2023-06-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2023-06-30', 'Monthly Management Fee' FROM tenant_info

-- May 2023
UNION ALL
SELECT tenant_id, property_id, charge_type_id, monthly_rent, DATE '2023-05-01', 'Monthly Rent Charge' FROM tenant_info
UNION ALL
SELECT tenant_id, property_id, payment_type_id, -monthly_rent, DATE '2023-05-15', 'Monthly Rent Payment' FROM tenant_info
UNION ALL
SELECT null, property_id, mgmt_fee_type_id, -(monthly_rent * mgmt_fee_percentage / 100), DATE '2023-05-31', 'Monthly Management Fee' FROM tenant_info;