/*
  # Fix tenant note details view

  This migration updates the tenant_note_details view to properly join with auth.users table
  and include the necessary user information for displaying notes.

  1. Changes
    - Drops existing view if it exists
    - Creates updated view with proper join to auth.users table
    - Includes user email and metadata from auth.users

  2. Implementation
    - Uses proper schema references
    - Maintains data consistency
    - Preserves existing functionality
*/

-- Drop the existing view if it exists
DROP VIEW IF EXISTS tenant_note_details;

-- Create the updated view with proper joins
CREATE VIEW tenant_note_details AS
SELECT 
    tn.id,
    tn.tenant_id,
    tn.content,
    tn.created_by,
    tn.created_at,
    tn.updated_at,
    tn.is_deleted,
    au.email as user_email,
    au.raw_user_meta_data as user_metadata
FROM 
    tenant_notes tn
    LEFT JOIN auth.users au ON tn.created_by = au.id;

-- Grant appropriate permissions
GRANT SELECT ON tenant_note_details TO authenticated;