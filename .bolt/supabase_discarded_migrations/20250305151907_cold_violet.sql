/*
  # Add Charge Transaction Types

  1. New Transaction Types
    - Monthly Rent
    - Late Fee
    - Security Deposit
    - Move-in Fee
    - Pet Fee
    - Maintenance Fee
    - Utility Charge
    - Other Charge

  All charge types are categorized as 'Income' to distinguish them from payments.
*/

-- Insert charge transaction types
INSERT INTO transaction_types (name, category, display_name)
VALUES
  ('monthly_rent', 'Income', 'Monthly Rent'),
  ('late_fee', 'Income', 'Late Fee'),
  ('security_deposit', 'Income', 'Security Deposit'),
  ('move_in_fee', 'Income', 'Move-in Fee'),
  ('pet_fee', 'Income', 'Pet Fee'),
  ('maintenance_fee', 'Income', 'Maintenance Fee'),
  ('utility_charge', 'Income', 'Utility Charge'),
  ('other_charge', 'Income', 'Other Charge')
ON CONFLICT (name) DO NOTHING;