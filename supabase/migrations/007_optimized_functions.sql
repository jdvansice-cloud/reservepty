-- ============================================================================
-- ReservePTY Database Migration: Optimized Query Functions
-- Migration: 007_optimized_functions.sql
-- Description: Optimized functions for common operations
-- ============================================================================

-- ============================================================================
-- AVAILABILITY CHECK FUNCTION
-- ============================================================================

-- Drop if exists for idempotency
DROP FUNCTION IF EXISTS check_asset_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID);

-- Optimized availability check with conflict details
CREATE OR REPLACE FUNCTION check_asset_availability(
  p_asset_id UUID,
  p_start_datetime TIMESTAMPTZ,
  p_end_datetime TIMESTAMPTZ,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_available BOOLEAN,
  conflicting_reservations JSONB,
  blackout_conflicts JSONB
) AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get organization_id for the asset
  SELECT organization_id INTO v_org_id
  FROM assets
  WHERE id = p_asset_id;

  RETURN QUERY
  WITH reservation_conflicts AS (
    SELECT
      r.id,
      r.title,
      r.start_datetime,
      r.end_datetime,
      r.status,
      COALESCE(p.first_name || ' ' || p.last_name, p.email) as booked_by
    FROM reservations r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.asset_id = p_asset_id
      AND r.status IN ('approved', 'pending')
      AND r.id != COALESCE(p_exclude_reservation_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND (r.start_datetime, r.end_datetime) OVERLAPS (p_start_datetime, p_end_datetime)
  ),
  blackout_conflicts AS (
    SELECT
      bd.id,
      bd.start_date,
      bd.end_date,
      bd.reason
    FROM blackout_dates bd
    WHERE bd.organization_id = v_org_id
      AND (bd.asset_id IS NULL OR bd.asset_id = p_asset_id)
      AND (bd.start_date::TIMESTAMPTZ, bd.end_date::TIMESTAMPTZ + INTERVAL '1 day')
          OVERLAPS (p_start_datetime, p_end_datetime)
  )
  SELECT
    (NOT EXISTS (SELECT 1 FROM reservation_conflicts)
     AND NOT EXISTS (SELECT 1 FROM blackout_conflicts)) as is_available,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(rc)) FROM reservation_conflicts rc),
      '[]'::jsonb
    ) as conflicting_reservations,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(bc)) FROM blackout_conflicts bc),
      '[]'::jsonb
    ) as blackout_conflicts;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- CALENDAR EVENTS FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS get_calendar_events(UUID, UUID[], TIMESTAMPTZ, TIMESTAMPTZ, reservation_status[]);

-- Optimized calendar events retrieval
CREATE OR REPLACE FUNCTION get_calendar_events(
  p_organization_id UUID,
  p_asset_ids UUID[] DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_statuses reservation_status[] DEFAULT ARRAY['approved', 'pending']::reservation_status[]
)
RETURNS TABLE (
  id UUID,
  asset_id UUID,
  asset_name TEXT,
  asset_section asset_section,
  user_id UUID,
  user_name TEXT,
  title TEXT,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  status reservation_status,
  notes TEXT,
  guest_count INTEGER,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.asset_id,
    a.name as asset_name,
    a.section as asset_section,
    r.user_id,
    COALESCE(p.first_name || ' ' || p.last_name, p.email) as user_name,
    r.title,
    r.start_datetime,
    r.end_datetime,
    r.status,
    r.notes,
    r.guest_count,
    r.metadata
  FROM reservations r
  JOIN assets a ON r.asset_id = a.id
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.organization_id = p_organization_id
    AND r.status = ANY(p_statuses)
    AND (p_asset_ids IS NULL OR r.asset_id = ANY(p_asset_ids))
    AND (p_start_date IS NULL OR r.end_datetime >= p_start_date)
    AND (p_end_date IS NULL OR r.start_datetime <= p_end_date)
  ORDER BY r.start_datetime ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- DASHBOARD STATISTICS FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS get_organization_stats(UUID);

-- Real-time organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats(p_organization_id UUID)
RETURNS TABLE (
  member_count BIGINT,
  asset_count BIGINT,
  assets_by_section JSONB,
  upcoming_reservations BIGINT,
  pending_approvals BIGINT,
  completed_this_month BIGINT,
  utilization_rate NUMERIC
) AS $$
DECLARE
  v_month_start TIMESTAMPTZ;
  v_month_end TIMESTAMPTZ;
  v_total_asset_hours NUMERIC;
  v_booked_hours NUMERIC;
BEGIN
  v_month_start := date_trunc('month', NOW());
  v_month_end := date_trunc('month', NOW()) + INTERVAL '1 month';

  RETURN QUERY
  WITH stats AS (
    SELECT
      -- Member count
      (SELECT COUNT(DISTINCT om.user_id)
       FROM organization_members om
       WHERE om.organization_id = p_organization_id) as member_count,

      -- Asset count
      (SELECT COUNT(*)
       FROM assets a
       WHERE a.organization_id = p_organization_id
         AND a.deleted_at IS NULL
         AND a.is_active = TRUE) as asset_count,

      -- Assets by section
      (SELECT COALESCE(
         jsonb_object_agg(section::text, cnt),
         '{}'::jsonb
       )
       FROM (
         SELECT a.section, COUNT(*) as cnt
         FROM assets a
         WHERE a.organization_id = p_organization_id
           AND a.deleted_at IS NULL
           AND a.is_active = TRUE
         GROUP BY a.section
       ) section_counts) as assets_by_section,

      -- Upcoming reservations
      (SELECT COUNT(*)
       FROM reservations r
       WHERE r.organization_id = p_organization_id
         AND r.status = 'approved'
         AND r.start_datetime > NOW()) as upcoming_reservations,

      -- Pending approvals
      (SELECT COUNT(*)
       FROM reservations r
       WHERE r.organization_id = p_organization_id
         AND r.status = 'pending') as pending_approvals,

      -- Completed this month
      (SELECT COUNT(*)
       FROM reservations r
       WHERE r.organization_id = p_organization_id
         AND r.status = 'completed'
         AND r.end_datetime >= v_month_start
         AND r.end_datetime < v_month_end) as completed_this_month
  )
  SELECT
    s.member_count,
    s.asset_count,
    s.assets_by_section,
    s.upcoming_reservations,
    s.pending_approvals,
    s.completed_this_month,
    -- Simple utilization calculation (can be enhanced)
    CASE
      WHEN s.asset_count = 0 THEN 0
      ELSE ROUND(
        (s.upcoming_reservations::NUMERIC / GREATEST(s.asset_count, 1)) * 100,
        1
      )
    END as utilization_rate
  FROM stats s;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- USER PERMISSIONS CHECK FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_permissions(UUID, UUID);

-- Get user's permissions for an organization
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  is_member BOOLEAN,
  role member_role,
  tier_id UUID,
  tier_name TEXT,
  tier_priority INTEGER,
  can_manage_assets BOOLEAN,
  can_manage_members BOOLEAN,
  can_approve_reservations BOOLEAN,
  can_manage_tiers BOOLEAN,
  can_view_audit_logs BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    om.id IS NOT NULL as is_member,
    om.role,
    om.tier_id,
    t.name as tier_name,
    t.priority as tier_priority,
    om.role IN ('owner', 'admin') as can_manage_assets,
    om.role IN ('owner', 'admin') as can_manage_members,
    om.role IN ('owner', 'admin', 'manager') as can_approve_reservations,
    om.role IN ('owner', 'admin') as can_manage_tiers,
    om.role IN ('owner', 'admin') as can_view_audit_logs
  FROM organization_members om
  LEFT JOIN tiers t ON om.tier_id = t.id
  WHERE om.user_id = p_user_id
    AND om.organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- RESERVATION VALIDATION FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS validate_reservation(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID);

-- Validate a reservation against tier rules
CREATE OR REPLACE FUNCTION validate_reservation(
  p_user_id UUID,
  p_asset_id UUID,
  p_start_datetime TIMESTAMPTZ,
  p_end_datetime TIMESTAMPTZ,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_code TEXT,
  error_message TEXT,
  requires_approval BOOLEAN
) AS $$
DECLARE
  v_org_id UUID;
  v_tier_id UUID;
  v_tier_rule RECORD;
  v_duration_days INTEGER;
  v_advance_days INTEGER;
  v_month_start TIMESTAMPTZ;
  v_days_used_this_month INTEGER;
  v_availability RECORD;
BEGIN
  -- Get organization and tier info
  SELECT a.organization_id INTO v_org_id
  FROM assets a
  WHERE a.id = p_asset_id;

  SELECT om.tier_id INTO v_tier_id
  FROM organization_members om
  WHERE om.user_id = p_user_id AND om.organization_id = v_org_id;

  -- Basic validation: user must be member
  IF v_tier_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'NOT_MEMBER', 'You are not a member of this organization', FALSE;
    RETURN;
  END IF;

  -- Get tier rules
  SELECT * INTO v_tier_rule
  FROM tier_rules
  WHERE tier_id = v_tier_id;

  -- Calculate duration
  v_duration_days := EXTRACT(DAY FROM (p_end_datetime - p_start_datetime))::INTEGER + 1;
  v_advance_days := EXTRACT(DAY FROM (p_start_datetime - NOW()))::INTEGER;

  -- Check min lead time
  IF v_tier_rule.min_lead_time_hours IS NOT NULL THEN
    IF p_start_datetime < NOW() + (v_tier_rule.min_lead_time_hours || ' hours')::INTERVAL THEN
      RETURN QUERY SELECT FALSE, 'MIN_LEAD_TIME',
        'Reservations require at least ' || v_tier_rule.min_lead_time_hours || ' hours advance notice',
        FALSE;
      RETURN;
    END IF;
  END IF;

  -- Check max advance days
  IF v_tier_rule.max_advance_days IS NOT NULL THEN
    IF v_advance_days > v_tier_rule.max_advance_days THEN
      RETURN QUERY SELECT FALSE, 'MAX_ADVANCE',
        'Cannot book more than ' || v_tier_rule.max_advance_days || ' days in advance',
        FALSE;
      RETURN;
    END IF;
  END IF;

  -- Check max consecutive days
  IF v_tier_rule.max_consecutive_days IS NOT NULL THEN
    IF v_duration_days > v_tier_rule.max_consecutive_days THEN
      RETURN QUERY SELECT FALSE, 'MAX_CONSECUTIVE',
        'Maximum consecutive days is ' || v_tier_rule.max_consecutive_days,
        FALSE;
      RETURN;
    END IF;
  END IF;

  -- Check monthly limit
  IF v_tier_rule.max_days_per_month IS NOT NULL THEN
    v_month_start := date_trunc('month', p_start_datetime);

    SELECT COALESCE(SUM(
      EXTRACT(DAY FROM (
        LEAST(r.end_datetime, v_month_start + INTERVAL '1 month') -
        GREATEST(r.start_datetime, v_month_start)
      ))::INTEGER + 1
    ), 0) INTO v_days_used_this_month
    FROM reservations r
    WHERE r.user_id = p_user_id
      AND r.organization_id = v_org_id
      AND r.status IN ('approved', 'pending')
      AND r.id != COALESCE(p_exclude_reservation_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND (r.start_datetime, r.end_datetime) OVERLAPS (v_month_start, v_month_start + INTERVAL '1 month');

    IF (v_days_used_this_month + v_duration_days) > v_tier_rule.max_days_per_month THEN
      RETURN QUERY SELECT FALSE, 'MONTHLY_LIMIT',
        'Monthly limit exceeded. You have used ' || v_days_used_this_month || ' of ' || v_tier_rule.max_days_per_month || ' days',
        FALSE;
      RETURN;
    END IF;
  END IF;

  -- Check availability
  SELECT * INTO v_availability
  FROM check_asset_availability(p_asset_id, p_start_datetime, p_end_datetime, p_exclude_reservation_id);

  IF NOT v_availability.is_available THEN
    RETURN QUERY SELECT FALSE, 'CONFLICT',
      'The asset is not available during this time period',
      FALSE;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::TEXT, COALESCE(v_tier_rule.requires_approval, FALSE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- MEMBER LISTING WITH DETAILS
-- ============================================================================

DROP FUNCTION IF EXISTS get_organization_members_detailed(UUID);

-- Get members with full details
CREATE OR REPLACE FUNCTION get_organization_members_detailed(p_organization_id UUID)
RETURNS TABLE (
  member_id UUID,
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role member_role,
  tier_id UUID,
  tier_name TEXT,
  tier_color TEXT,
  joined_at TIMESTAMPTZ,
  reservation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    om.id as member_id,
    om.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.avatar_url,
    om.role,
    om.tier_id,
    t.name as tier_name,
    t.color as tier_color,
    om.joined_at,
    (SELECT COUNT(*)
     FROM reservations r
     WHERE r.user_id = om.user_id
       AND r.organization_id = p_organization_id
       AND r.status IN ('approved', 'completed')) as reservation_count
  FROM organization_members om
  JOIN profiles p ON om.user_id = p.id
  LEFT JOIN tiers t ON om.tier_id = t.id
  WHERE om.organization_id = p_organization_id
  ORDER BY
    CASE om.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'member' THEN 4
      WHEN 'viewer' THEN 5
    END,
    p.first_name, p.last_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- SEARCH ASSETS FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS search_assets(UUID, TEXT, asset_section, INTEGER, INTEGER);

-- Full-text search on assets
CREATE OR REPLACE FUNCTION search_assets(
  p_organization_id UUID,
  p_search_query TEXT DEFAULT NULL,
  p_section asset_section DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  section asset_section,
  primary_photo_url TEXT,
  details JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.description,
    a.section,
    a.primary_photo_url,
    a.details,
    a.is_active,
    a.created_at,
    CASE
      WHEN p_search_query IS NOT NULL AND p_search_query != '' THEN
        ts_rank(
          to_tsvector('english', a.name || ' ' || COALESCE(a.description, '')),
          plainto_tsquery('english', p_search_query)
        )
      ELSE 1.0
    END as rank
  FROM assets a
  WHERE a.organization_id = p_organization_id
    AND a.deleted_at IS NULL
    AND (p_section IS NULL OR a.section = p_section)
    AND (
      p_search_query IS NULL
      OR p_search_query = ''
      OR to_tsvector('english', a.name || ' ' || COALESCE(a.description, ''))
         @@ plainto_tsquery('english', p_search_query)
    )
  ORDER BY
    CASE
      WHEN p_search_query IS NOT NULL AND p_search_query != '' THEN
        ts_rank(
          to_tsvector('english', a.name || ' ' || COALESCE(a.description, '')),
          plainto_tsquery('english', p_search_query)
        )
      ELSE 0
    END DESC,
    a.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_asset_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_events(UUID, UUID[], TIMESTAMPTZ, TIMESTAMPTZ, reservation_status[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_reservation(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_members_detailed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_assets(UUID, TEXT, asset_section, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
