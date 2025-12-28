-- Migration: Add SMTP settings to organizations
-- Version: 0.44.9
-- Run this in Supabase SQL Editor

-- Add SMTP configuration columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_host text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_port integer DEFAULT 587;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_user text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_password text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_from_email text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_from_name text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_secure boolean DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS smtp_enabled boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN organizations.smtp_host IS 'SMTP server hostname (e.g., smtp.gmail.com)';
COMMENT ON COLUMN organizations.smtp_port IS 'SMTP server port (usually 587 for TLS, 465 for SSL)';
COMMENT ON COLUMN organizations.smtp_user IS 'SMTP authentication username';
COMMENT ON COLUMN organizations.smtp_password IS 'SMTP authentication password (encrypted in production)';
COMMENT ON COLUMN organizations.smtp_from_email IS 'Email address to send from';
COMMENT ON COLUMN organizations.smtp_from_name IS 'Display name for sent emails';
COMMENT ON COLUMN organizations.smtp_secure IS 'Use TLS/SSL connection';
COMMENT ON COLUMN organizations.smtp_enabled IS 'Whether SMTP is configured and enabled';

-- Update RLS policy to allow owners/admins to update SMTP settings
-- (The existing update policy should already cover this if it allows organization updates)
