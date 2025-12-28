-- ============================================================================
-- ReservePTY Database Reset Script
-- WARNING: This will DELETE ALL DATA and tables!
-- ============================================================================
-- Run this in Supabase SQL Editor to completely reset the database
-- ============================================================================

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- ============================================================================
-- DROP ALL TABLES (in correct order due to foreign keys)
-- ============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS complimentary_access CASCADE;
DROP TABLE IF EXISTS blackout_dates CASCADE;
DROP TABLE IF EXISTS asset_photos CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS tier_rules CASCADE;
DROP TABLE IF EXISTS tiers CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS entitlements CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS platform_admins CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS airports CASCADE;
DROP TABLE IF EXISTS ports CASCADE;

-- ============================================================================
-- DROP ALL CUSTOM TYPES (ENUMS)
-- ============================================================================

DROP TYPE IF EXISTS member_role CASCADE;
DROP TYPE IF EXISTS asset_section CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS billing_cycle CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS admin_role CASCADE;

-- ============================================================================
-- DROP ALL CUSTOM FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS is_org_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_org_role(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS has_role_or_higher(UUID, UUID, member_role) CASCADE;
DROP FUNCTION IF EXISTS is_platform_admin(UUID) CASCADE;

-- ============================================================================
-- DROP TRIGGERS (if they exist on auth.users)
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- CLEAR STORAGE BUCKETS (run separately in Dashboard if needed)
-- ============================================================================

-- Note: To clear storage buckets, go to:
-- Supabase Dashboard > Storage > Select bucket > Delete all files
-- Or delete and recreate the buckets

-- ============================================================================
-- OPTIONAL: Clear auth.users (careful - this deletes all user accounts!)
-- ============================================================================

-- Uncomment the following lines ONLY if you want to delete all users:
-- DELETE FROM auth.users;
-- DELETE FROM auth.identities;

-- ============================================================================
-- Re-enable triggers
-- ============================================================================

SET session_replication_role = 'origin';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that tables are gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Should return empty or only system tables

-- ============================================================================
-- DONE! Now run 001_initial_schema.sql followed by 002_seed_data.sql
-- ============================================================================
