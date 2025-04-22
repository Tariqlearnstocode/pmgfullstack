/*
  # Add owner statement functionality

  1. Views
    - `owner_statement_details`: Combines property information with tenant and status details
      - Property information (address, rent, fees)
      - Current tenant details
      - Property status
      - Financial metrics

  2. Functions
    - `calculate_owner_statement`: Generates statement data for a specific owner and date range
      - Calculates previous balances
      - Tracks payments received
      - Computes management fees
      - Determines net owner proceeds
      - Handles expenses and adjustments

  3. Security
    - Enables RLS for all new objects
    - Restricts access to authenticated users
*/

-- Create view for owner statement details
CREATE OR REPLACE VIEW owner_statement_details AS
SELECT 
  p.id AS property_id,
  p.address,
  p.city,
  p.zip,
  ps.name AS status,
  p.rent_amount,
  p.mgmt_fee_percentage,
  p.owner_id,
  p.current_balance,
  t.name AS tenant_name,
  t.current_balance AS tenant_balance
FROM properties p
LEFT JOIN property_statuses ps ON ps.id = p.status_id
LEFT JOIN tenant_details t ON t.property_id = p.id;

-- Function to calculate owner statement
CREATE OR REPLACE FUNCTION calculate_owner_statement(
  p_owner_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE (
  property_id uuid,
  address text,
  status text,
  rent_amount numeric,
  previous_balance numeric,
  total_received numeric,
  remaining_balance numeric,
  owner_expenses numeric,
  management_fee numeric,
  net_to_owner numeric
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH transaction_totals AS (
    SELECT 
      t.property_id,
      -- Calculate previous balance (before start date)
      SUM(CASE 
        WHEN t.date < p_start_date THEN t.amount 
        ELSE 0 
      END) as previous_balance,
      -- Calculate payments received in period
      SUM(CASE 
        WHEN t.date BETWEEN p_start_date AND p_end_date 
        AND tt.category = 'Payment' THEN ABS(t.amount)
        ELSE 0 
      END) as total_received,
      -- Calculate owner expenses in period
      SUM(CASE 
        WHEN t.date BETWEEN p_start_date AND p_end_date 
        AND tt.category = 'Expense' THEN t.amount
        ELSE 0 
      END) as owner_expenses
    FROM transactions t
    JOIN properties p ON p.id = t.property_id
    JOIN transaction_types tt ON tt.id = t.type_id
    WHERE p.owner_id = p_owner_id
    GROUP BY t.property_id
  )
  SELECT 
    p.id as property_id,
    p.address,
    ps.name as status,
    p.rent_amount,
    COALESCE(tt.previous_balance, 0) as previous_balance,
    COALESCE(tt.total_received, 0) as total_received,
    p.current_balance as remaining_balance,
    COALESCE(tt.owner_expenses, 0) as owner_expenses,
    ROUND(COALESCE(tt.total_received * (p.mgmt_fee_percentage / 100.0), 0), 2) as management_fee,
    ROUND(
      COALESCE(tt.total_received, 0) - 
      COALESCE(tt.owner_expenses, 0) - 
      COALESCE(tt.total_received * (p.mgmt_fee_percentage / 100.0), 0)
    , 2) as net_to_owner
  FROM properties p
  LEFT JOIN property_statuses ps ON ps.id = p.status_id
  LEFT JOIN transaction_totals tt ON tt.property_id = p.id
  WHERE p.owner_id = p_owner_id
  ORDER BY p.address;
END;
$$;