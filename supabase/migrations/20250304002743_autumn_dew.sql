/*
  # Initial Property Management Schema

  1. New Tables
    - `owners`
      - Basic owner information and contact details
    - `properties`
      - Property details, fees, and status
    - `tenants`
      - Tenant information, lease details, and balances
    - `transactions`
      - Financial transactions linked to properties and tenants
    - Supporting tables:
      - `property_statuses`
      - `tenant_statuses`
      - `transaction_types`

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Notes
    - All tables include created_at timestamps
    - Foreign key constraints ensure data integrity
    - Enum tables for statuses and types
*/

-- Property Statuses
CREATE TABLE IF NOT EXISTS property_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to property_statuses"
  ON property_statuses
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default property statuses
INSERT INTO property_statuses (name, description) VALUES
  ('Vacant', 'Property is currently unoccupied'),
  ('Occupied', 'Property is currently rented'),
  ('Maintenance', 'Property under maintenance'),
  ('Listed', 'Property available for rent');

-- Tenant Statuses
CREATE TABLE IF NOT EXISTS tenant_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tenant_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to tenant_statuses"
  ON tenant_statuses
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default tenant statuses
INSERT INTO tenant_statuses (name, description) VALUES
  ('Active', 'Current tenant in good standing'),
  ('Late', 'Tenant has overdue payments'),
  ('Notice', 'Tenant has given notice to vacate'),
  ('Eviction', 'Tenant in eviction process'),
  ('Former', 'Previous tenant');

-- Transaction Types
CREATE TABLE IF NOT EXISTS transaction_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transaction_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to transaction_types"
  ON transaction_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default transaction types
INSERT INTO transaction_types (name, category, display_name) VALUES
  ('rent_payment', 'Income', 'Rent Payment'),
  ('late_fee', 'Income', 'Late Fee'),
  ('security_deposit', 'Income', 'Security Deposit'),
  ('maintenance', 'Expense', 'Maintenance'),
  ('owner_payout', 'Expense', 'Owner Payout'),
  ('utility_payment', 'Expense', 'Utility Payment');

-- Owners
CREATE TABLE IF NOT EXISTS owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to authenticated users for owners"
  ON owners
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  city text NOT NULL,
  zip text NOT NULL,
  owner_id uuid REFERENCES owners(id) ON DELETE RESTRICT,
  status_id uuid REFERENCES property_statuses(id) ON DELETE RESTRICT,
  has_insurance boolean DEFAULT false,
  mgmt_fee_percentage decimal(5,2) NOT NULL,
  late_fee_amount decimal(10,2) NOT NULL,
  rent_amount decimal(10,2) NOT NULL,
  lease_fee_percentage decimal(5,2),
  current_balance decimal(10,2) DEFAULT 0,
  notes text,
  status_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to authenticated users for properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  monthly_rent decimal(10,2) NOT NULL,
  starting_balance decimal(10,2) DEFAULT 0,
  security_deposit decimal(10,2),
  current_balance decimal(10,2) DEFAULT 0,
  status_id uuid REFERENCES tenant_statuses(id) ON DELETE RESTRICT,
  property_id uuid REFERENCES properties(id) ON DELETE RESTRICT,
  lease_start_date date,
  lease_end_date date,
  move_in_date date,
  move_out_date date,
  lease_document_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to authenticated users for tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT,
  property_id uuid REFERENCES properties(id) ON DELETE RESTRICT,
  type_id uuid REFERENCES transaction_types(id) ON DELETE RESTRICT,
  amount decimal(10,2) NOT NULL,
  date timestamptz NOT NULL,
  unit_reference text,
  invoice_number text,
  is_manual_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to authenticated users for transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create views for detailed information
CREATE OR REPLACE VIEW property_details AS
SELECT 
  p.*,
  t.id as tenant_id,
  t.name as tenant_name,
  t.email as tenant_email,
  t.current_balance as tenant_balance,
  ts.name as tenant_status,
  ps.name as property_status
FROM properties p
LEFT JOIN tenants t ON t.property_id = p.id
LEFT JOIN tenant_statuses ts ON t.status_id = ts.id
LEFT JOIN property_statuses ps ON p.status_id = ps.id;

CREATE OR REPLACE VIEW tenant_details AS
SELECT 
  t.*,
  p.address as property_address,
  p.rent_amount,
  ps.name as property_status,
  ts.name as status
FROM tenants t
LEFT JOIN properties p ON t.property_id = p.id
LEFT JOIN property_statuses ps ON p.status_id = ps.id
LEFT JOIN tenant_statuses ts ON t.status_id = ts.id;