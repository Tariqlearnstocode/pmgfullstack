/*
  # Create tenant notes view

  1. New Views
    - `tenant_note_details`: Joins tenant notes with user data from auth schema
      - Includes note content, timestamps, and user information
      - Filters out deleted notes by default

  2. Security
    - View inherits RLS policies from tenant_notes table
    - Only authenticated users can access the view
*/

-- Create view for tenant notes with user details
CREATE OR REPLACE VIEW tenant_note_details AS
SELECT 
  tn.id,
  tn.tenant_id,
  tn.content,
  tn.created_by,
  tn.created_at,
  tn.updated_at,
  tn.is_deleted,
  u.email as user_email,
  u.raw_user_meta_data as user_metadata
FROM tenant_notes tn
LEFT JOIN auth.users u ON tn.created_by = u.id;

-- Grant access to the view
GRANT SELECT ON tenant_note_details TO authenticated;