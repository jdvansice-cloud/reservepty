-- ============================================================================
-- ReservePTY Database Migration: Performance Indexes
-- Migration: 006_performance_indexes.sql
-- Description: Add optimized indexes for high-frequency queries
-- ============================================================================

-- ============================================================================
-- COMPOSITE INDEXES FOR RESERVATIONS
-- ============================================================================

-- Calendar view queries (most frequent)
-- Optimized for: WHERE asset_id = ? AND status IN (...) AND start_datetime BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_reservations_calendar_lookup
ON reservations (asset_id, status, start_datetime, end_datetime)
WHERE status != 'canceled';

-- User's upcoming reservations
CREATE INDEX IF NOT EXISTS idx_reservations_user_upcoming
ON reservations (user_id, status, start_datetime DESC)
WHERE status IN ('pending', 'approved');

-- Organization dashboard queries
CREATE INDEX IF NOT EXISTS idx_reservations_org_status_date
ON reservations (organization_id, status, start_datetime DESC);

-- Pending approvals for managers
CREATE INDEX IF NOT EXISTS idx_reservations_pending_approval
ON reservations (organization_id, status, created_at DESC)
WHERE status = 'pending';

-- ============================================================================
-- COMPOSITE INDEXES FOR ASSETS
-- ============================================================================

-- Assets by organization and section (filtered by active)
CREATE INDEX IF NOT EXISTS idx_assets_org_section_active
ON assets (organization_id, section, name)
WHERE deleted_at IS NULL AND is_active = TRUE;

-- Full-text search on assets (name + description)
CREATE INDEX IF NOT EXISTS idx_assets_fulltext_search
ON assets USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')))
WHERE deleted_at IS NULL;

-- JSONB index for asset details (GIN for containment queries)
CREATE INDEX IF NOT EXISTS idx_assets_details_gin
ON assets USING gin(details jsonb_path_ops)
WHERE deleted_at IS NULL;

-- ============================================================================
-- COMPOSITE INDEXES FOR ORGANIZATION MEMBERS
-- ============================================================================

-- User's organizations with role (for auth checks)
CREATE INDEX IF NOT EXISTS idx_org_members_user_org_role
ON organization_members (user_id, organization_id, role);

-- Members by organization with tier (for member listing)
CREATE INDEX IF NOT EXISTS idx_org_members_org_tier
ON organization_members (organization_id, tier_id, role);

-- ============================================================================
-- INDEXES FOR INVITATIONS
-- ============================================================================

-- Pending invitations lookup
CREATE INDEX IF NOT EXISTS idx_invitations_pending
ON invitations (organization_id, email, expires_at)
WHERE accepted_at IS NULL;

-- Token lookup (for invitation acceptance)
-- Note: idx_invitations_token already exists but adding compound for org context
CREATE INDEX IF NOT EXISTS idx_invitations_token_org
ON invitations (token, organization_id)
WHERE accepted_at IS NULL;

-- ============================================================================
-- INDEXES FOR TIERS
-- ============================================================================

-- Tiers with rules lookup
CREATE INDEX IF NOT EXISTS idx_tiers_org_priority
ON tiers (organization_id, priority ASC);

-- ============================================================================
-- INDEXES FOR AUDIT LOGS
-- ============================================================================

-- Recent activity by organization
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_recent
ON audit_logs (organization_id, created_at DESC)
WHERE organization_id IS NOT NULL;

-- Entity-specific audit trail
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_time
ON audit_logs (entity_type, entity_id, created_at DESC);

-- ============================================================================
-- INDEXES FOR BLACKOUT DATES
-- ============================================================================

-- Blackout lookup for availability checks
CREATE INDEX IF NOT EXISTS idx_blackout_dates_lookup
ON blackout_dates (organization_id, start_date, end_date);

-- Asset-specific blackouts
CREATE INDEX IF NOT EXISTS idx_blackout_dates_asset
ON blackout_dates (asset_id, start_date, end_date)
WHERE asset_id IS NOT NULL;

-- ============================================================================
-- INDEXES FOR SUBSCRIPTIONS
-- ============================================================================

-- Active subscriptions lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_active
ON subscriptions (organization_id, status)
WHERE status IN ('active', 'trial', 'complimentary');

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Active organizations only
CREATE INDEX IF NOT EXISTS idx_organizations_active
ON organizations (id, legal_name)
WHERE is_active = TRUE AND deleted_at IS NULL;

-- Active platform admins
CREATE INDEX IF NOT EXISTS idx_platform_admins_active
ON platform_admins (user_id)
WHERE is_active = TRUE;

-- ============================================================================
-- COVERING INDEXES (INCLUDE) FOR COMMON QUERIES
-- ============================================================================

-- Reservation calendar events with all needed data
DROP INDEX IF EXISTS idx_reservations_calendar_lookup;
CREATE INDEX idx_reservations_calendar_covering
ON reservations (asset_id, start_datetime, end_datetime)
INCLUDE (id, user_id, title, status, notes)
WHERE status != 'canceled';

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update statistics for query planner
ANALYZE reservations;
ANALYZE assets;
ANALYZE organization_members;
ANALYZE invitations;
ANALYZE tiers;
ANALYZE audit_logs;
ANALYZE blackout_dates;
ANALYZE subscriptions;
ANALYZE organizations;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
