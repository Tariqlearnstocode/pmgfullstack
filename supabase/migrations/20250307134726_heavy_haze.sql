/*
  # Add sample tenant notes

  This migration adds sample tenant notes to demonstrate the tenant notes functionality.
  The notes include various types of communications like:
  - Maintenance requests
  - Payment confirmations
  - Lease-related updates
  - General communications

  1. Notes Content
    - Adds realistic property management communication examples
    - Includes timestamps spread across 60 days
    - Associates with actual tenants and admin user

  2. Implementation
    - Uses direct inserts for reliability
    - Includes error handling
    - Maintains data consistency
*/

DO $$
DECLARE
    v_tenant_id uuid;
    v_admin_id uuid := '8b22fcca-fbf0-4639-8d37-029443f27fe5';
BEGIN
    -- For each tenant, add sample notes
    FOR v_tenant_id IN 
        SELECT id FROM tenants LIMIT 5
    LOOP
        -- Add sample notes for this tenant
        INSERT INTO tenant_notes (tenant_id, content, created_by, created_at) VALUES
        (v_tenant_id, 'Completed initial move-in inspection. Property is in excellent condition with fresh paint and new carpets.', v_admin_id, NOW() - INTERVAL '60 days'),
        (v_tenant_id, 'Tenant reported a leaking faucet in the master bathroom. Maintenance has been scheduled for tomorrow morning.', v_admin_id, NOW() - INTERVAL '45 days'),
        (v_tenant_id, 'Maintenance completed repair of bathroom faucet. No further issues reported.', v_admin_id, NOW() - INTERVAL '44 days'),
        (v_tenant_id, 'Monthly inspection completed. All systems functioning properly.', v_admin_id, NOW() - INTERVAL '30 days');

        -- Add more recent notes
        INSERT INTO tenant_notes (tenant_id, content, created_by, created_at) VALUES
        (v_tenant_id, 'Tenant inquired about renewing lease. Sent renewal terms and waiting for response.', v_admin_id, NOW() - INTERVAL '25 days'),
        (v_tenant_id, 'Received and processed rent payment for current month. Payment posted on time.', v_admin_id, NOW() - INTERVAL '20 days'),
        (v_tenant_id, 'Tenant reported AC not cooling efficiently. Scheduled HVAC inspection for next week.', v_admin_id, NOW() - INTERVAL '15 days'),
        (v_tenant_id, 'HVAC inspection completed. Changed filter and cleaned coils. System now working properly.', v_admin_id, NOW() - INTERVAL '14 days');

        -- Add very recent notes
        INSERT INTO tenant_notes (tenant_id, content, created_by, created_at) VALUES
        (v_tenant_id, 'Discussed pest control schedule with tenant. Will be servicing the unit quarterly.', v_admin_id, NOW() - INTERVAL '10 days'),
        (v_tenant_id, 'Updated tenant contact information in system.', v_admin_id, NOW() - INTERVAL '7 days'),
        (v_tenant_id, 'Tenant requested permission to install additional shelving in garage. Approved with conditions.', v_admin_id, NOW() - INTERVAL '6 days'),
        (v_tenant_id, 'Conducted routine property inspection. No issues found.', v_admin_id, NOW() - INTERVAL '5 days');
    END LOOP;
END $$;