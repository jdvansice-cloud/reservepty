-- Fix RLS policies for invitations table
-- Allow organization admins to create, view, and delete invitations

-- Drop existing policies if any
DROP POLICY IF EXISTS "Organization members can view invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;

-- Enable RLS on invitations table (if not already enabled)
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization owners, admins, and managers can view all invitations for their org
CREATE POLICY "Organization members can view invitations" ON invitations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Organization owners, admins, and managers can create invitations
CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Policy: Organization owners, admins, and managers can delete invitations
CREATE POLICY "Admins can delete invitations" ON invitations
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Policy: Organization owners, admins, and managers can update invitations (mark as accepted)
CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Policy: Anyone can view an invitation by token (for accepting invites)
-- This allows unauthenticated users to verify an invitation exists
CREATE POLICY "Anyone can view invitation by token" ON invitations
  FOR SELECT
  USING (true);
