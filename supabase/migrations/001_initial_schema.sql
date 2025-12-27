-- ============================================================================
-- ReservePTY Database Schema v1.0.0
-- Multi-tenant SaaS Platform for Luxury Asset Management
-- ============================================================================
-- Run this migration in Supabase SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Organization member roles
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');

-- Asset sections
CREATE TYPE asset_section AS ENUM ('planes', 'helicopters', 'residences', 'boats');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'complimentary');

-- Billing cycle
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- Reservation status
CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'rejected', 'canceled', 'completed');

-- Platform admin roles
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'support');

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/Panama',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_name TEXT NOT NULL,
  commercial_name TEXT,
  ruc TEXT, -- Panama tax ID
  dv TEXT,  -- Check digit
  billing_email TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  tier_id UUID, -- Will reference tiers table (added later to avoid circular dep)
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'trial',
  billing_cycle billing_cycle DEFAULT 'monthly',
  seat_limit INTEGER NOT NULL DEFAULT 5,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  external_customer_id TEXT, -- Payment provider customer ID
  external_subscription_id TEXT, -- Payment provider subscription ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id) -- One subscription per org
);

-- ============================================================================
-- ENTITLEMENTS TABLE (which sections org has access to)
-- ============================================================================

CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  section asset_section NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subscription_id, section)
);

-- ============================================================================
-- TIERS TABLE (booking priority levels)
-- ============================================================================

CREATE TABLE tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1, -- Lower = higher priority
  color TEXT DEFAULT '#c8b273', -- Display color
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, priority)
);

-- Add tier_id foreign key to organization_members
ALTER TABLE organization_members
  ADD CONSTRAINT fk_organization_members_tier
  FOREIGN KEY (tier_id) REFERENCES tiers(id) ON DELETE SET NULL;

-- ============================================================================
-- TIER RULES TABLE
-- ============================================================================

CREATE TABLE tier_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_id UUID NOT NULL REFERENCES tiers(id) ON DELETE CASCADE,
  max_days_per_month INTEGER, -- NULL = unlimited
  max_consecutive_days INTEGER, -- NULL = unlimited
  min_lead_time_hours INTEGER DEFAULT 0, -- Advance booking requirement
  max_advance_days INTEGER, -- How far ahead can book
  requires_approval BOOLEAN DEFAULT FALSE,
  can_override BOOLEAN DEFAULT FALSE, -- Can override lower priority bookings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tier_id) -- One rule set per tier
);

-- ============================================================================
-- BLACKOUT DATES TABLE
-- ============================================================================

CREATE TABLE blackout_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES tiers(id) ON DELETE CASCADE, -- NULL = applies to all tiers
  asset_id UUID, -- Will reference assets table (NULL = all assets)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (end_date >= start_date)
);

-- ============================================================================
-- ASSETS TABLE (generic for all sections)
-- ============================================================================

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  section asset_section NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  primary_photo_url TEXT,
  details JSONB DEFAULT '{}', -- Section-specific details
  is_active BOOLEAN DEFAULT TRUE,
  current_location JSONB, -- For planes/helicopters/boats
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Add asset_id foreign key to blackout_dates
ALTER TABLE blackout_dates
  ADD CONSTRAINT fk_blackout_dates_asset
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE;

-- ============================================================================
-- ASSET PHOTOS TABLE (gallery)
-- ============================================================================

CREATE TABLE asset_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RESERVATIONS TABLE
-- ============================================================================

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  guest_count INTEGER,
  metadata JSONB DEFAULT '{}', -- Section-specific data (flight legs, ports, etc.)
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  
  CHECK (end_datetime > start_datetime)
);

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  tier_id UUID REFERENCES tiers(id) ON DELETE SET NULL,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PLATFORM ADMINS TABLE (separate from regular users)
-- ============================================================================

CREATE TABLE platform_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  role admin_role NOT NULL DEFAULT 'support',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'organization', 'asset', 'reservation', etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AIRPORTS DIRECTORY (for aviation)
-- ============================================================================

CREATE TABLE airports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  icao_code TEXT UNIQUE NOT NULL,
  iata_code TEXT,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  timezone TEXT,
  type TEXT DEFAULT 'airport', -- 'airport', 'helipad'
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- PORTS DIRECTORY (for boats)
-- ============================================================================

CREATE TABLE ports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  timezone TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- COMPLIMENTARY ACCESS TABLE (tracks free memberships granted by admins)
-- ============================================================================

CREATE TABLE complimentary_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ, -- NULL = never expires
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id),
  revoke_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);

-- Organizations
CREATE INDEX idx_organizations_legal_name ON organizations(legal_name);
CREATE INDEX idx_organizations_ruc ON organizations(ruc);
CREATE INDEX idx_organizations_deleted ON organizations(deleted_at) WHERE deleted_at IS NULL;

-- Organization Members
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Entitlements
CREATE INDEX idx_entitlements_sub ON entitlements(subscription_id);
CREATE INDEX idx_entitlements_section ON entitlements(section);

-- Tiers
CREATE INDEX idx_tiers_org ON tiers(organization_id);

-- Assets
CREATE INDEX idx_assets_org ON assets(organization_id);
CREATE INDEX idx_assets_section ON assets(section);
CREATE INDEX idx_assets_deleted ON assets(deleted_at) WHERE deleted_at IS NULL;

-- Reservations
CREATE INDEX idx_reservations_org ON reservations(organization_id);
CREATE INDEX idx_reservations_asset ON reservations(asset_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_dates ON reservations(start_datetime, end_datetime);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Invitations
CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);

-- Audit Logs
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Airports
CREATE INDEX idx_airports_icao ON airports(icao_code);
CREATE INDEX idx_airports_country ON airports(country);

-- Ports
CREATE INDEX idx_ports_code ON ports(code);
CREATE INDEX idx_ports_country ON ports(country);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON entitlements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tier_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON platform_admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = usr_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role in organization
CREATE OR REPLACE FUNCTION get_org_role(org_id UUID, usr_id UUID)
RETURNS member_role AS $$
DECLARE
  user_role member_role;
BEGIN
  SELECT role INTO user_role
  FROM organization_members
  WHERE organization_id = org_id AND user_id = usr_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has at least the specified role level
CREATE OR REPLACE FUNCTION has_role_or_higher(org_id UUID, usr_id UUID, min_role member_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_role member_role;
  role_levels CONSTANT member_role[] := ARRAY['viewer', 'member', 'manager', 'admin', 'owner']::member_role[];
BEGIN
  SELECT role INTO user_role
  FROM organization_members
  WHERE organization_id = org_id AND user_id = usr_id;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN array_position(role_levels, user_role) >= array_position(role_levels, min_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = usr_id AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE complimentary_access ENABLE ROW LEVEL SECURITY;

-- Airports and Ports are public read
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_select_org_members ON profiles
  FOR SELECT USING (
    id IN (
      SELECT om.user_id FROM organization_members om
      WHERE om.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (is_platform_admin(auth.uid()));

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================

CREATE POLICY org_select_member ON organizations
  FOR SELECT USING (
    is_org_member(id, auth.uid()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY org_insert_authenticated ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY org_update_admin ON organizations
  FOR UPDATE USING (
    has_role_or_higher(id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

CREATE POLICY org_delete_owner ON organizations
  FOR DELETE USING (
    get_org_role(id, auth.uid()) = 'owner' OR is_platform_admin(auth.uid())
  );

-- ============================================================================
-- ORGANIZATION MEMBERS POLICIES
-- ============================================================================

CREATE POLICY org_members_select ON organization_members
  FOR SELECT USING (
    is_org_member(organization_id, auth.uid()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY org_members_insert ON organization_members
  FOR INSERT WITH CHECK (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

CREATE POLICY org_members_update ON organization_members
  FOR UPDATE USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

CREATE POLICY org_members_delete ON organization_members
  FOR DELETE USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

CREATE POLICY sub_select ON subscriptions
  FOR SELECT USING (
    is_org_member(organization_id, auth.uid()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY sub_insert ON subscriptions
  FOR INSERT WITH CHECK (
    get_org_role(organization_id, auth.uid()) = 'owner' OR is_platform_admin(auth.uid())
  );

CREATE POLICY sub_update ON subscriptions
  FOR UPDATE USING (is_platform_admin(auth.uid()));

-- ============================================================================
-- ENTITLEMENTS POLICIES
-- ============================================================================

CREATE POLICY ent_select ON entitlements
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE is_org_member(organization_id, auth.uid())
    ) OR is_platform_admin(auth.uid())
  );

CREATE POLICY ent_insert ON entitlements
  FOR INSERT WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY ent_update ON entitlements
  FOR UPDATE USING (is_platform_admin(auth.uid()));

-- ============================================================================
-- TIERS POLICIES
-- ============================================================================

CREATE POLICY tiers_select ON tiers
  FOR SELECT USING (
    is_org_member(organization_id, auth.uid()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY tiers_insert ON tiers
  FOR INSERT WITH CHECK (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

CREATE POLICY tiers_update ON tiers
  FOR UPDATE USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

CREATE POLICY tiers_delete ON tiers
  FOR DELETE USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

-- ============================================================================
-- TIER RULES POLICIES
-- ============================================================================

CREATE POLICY tier_rules_select ON tier_rules
  FOR SELECT USING (
    tier_id IN (
      SELECT id FROM tiers WHERE is_org_member(organization_id, auth.uid())
    ) OR is_platform_admin(auth.uid())
  );

CREATE POLICY tier_rules_modify ON tier_rules
  FOR ALL USING (
    tier_id IN (
      SELECT id FROM tiers WHERE has_role_or_higher(organization_id, auth.uid(), 'admin')
    ) OR is_platform_admin(auth.uid())
  );

-- ============================================================================
-- ASSETS POLICIES
-- ============================================================================

CREATE POLICY assets_select ON assets
  FOR SELECT USING (
    is_org_member(organization_id, auth.uid()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY assets_insert ON assets
  FOR INSERT WITH CHECK (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

CREATE POLICY assets_update ON assets
  FOR UPDATE USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

CREATE POLICY assets_delete ON assets
  FOR DELETE USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

-- ============================================================================
-- ASSET PHOTOS POLICIES
-- ============================================================================

CREATE POLICY asset_photos_select ON asset_photos
  FOR SELECT USING (
    asset_id IN (
      SELECT id FROM assets WHERE is_org_member(organization_id, auth.uid())
    ) OR is_platform_admin(auth.uid())
  );

CREATE POLICY asset_photos_modify ON asset_photos
  FOR ALL USING (
    asset_id IN (
      SELECT id FROM assets WHERE has_role_or_higher(organization_id, auth.uid(), 'admin')
    ) OR is_platform_admin(auth.uid())
  );

-- ============================================================================
-- RESERVATIONS POLICIES
-- ============================================================================

CREATE POLICY reservations_select ON reservations
  FOR SELECT USING (
    is_org_member(organization_id, auth.uid()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY reservations_insert ON reservations
  FOR INSERT WITH CHECK (
    is_org_member(organization_id, auth.uid()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY reservations_update ON reservations
  FOR UPDATE USING (
    -- User can update their own pending reservations
    (user_id = auth.uid() AND status = 'pending') OR
    -- Managers+ can approve/reject
    has_role_or_higher(organization_id, auth.uid(), 'manager') OR
    is_platform_admin(auth.uid())
  );

CREATE POLICY reservations_delete ON reservations
  FOR DELETE USING (
    -- User can cancel their own
    user_id = auth.uid() OR
    -- Admins can delete any
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR
    is_platform_admin(auth.uid())
  );

-- ============================================================================
-- INVITATIONS POLICIES
-- ============================================================================

CREATE POLICY invitations_select ON invitations
  FOR SELECT USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR
    email = (SELECT email FROM profiles WHERE id = auth.uid()) OR
    is_platform_admin(auth.uid())
  );

CREATE POLICY invitations_insert ON invitations
  FOR INSERT WITH CHECK (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

CREATE POLICY invitations_update ON invitations
  FOR UPDATE USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR
    email = (SELECT email FROM profiles WHERE id = auth.uid()) OR
    is_platform_admin(auth.uid())
  );

CREATE POLICY invitations_delete ON invitations
  FOR DELETE USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

-- ============================================================================
-- PLATFORM ADMINS POLICIES
-- ============================================================================

CREATE POLICY platform_admins_select ON platform_admins
  FOR SELECT USING (is_platform_admin(auth.uid()));

CREATE POLICY platform_admins_all ON platform_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM platform_admins 
      WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    )
  );

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT USING (
    (organization_id IS NOT NULL AND has_role_or_higher(organization_id, auth.uid(), 'admin')) OR
    is_platform_admin(auth.uid())
  );

CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT WITH CHECK (TRUE); -- Anyone can insert logs

-- ============================================================================
-- COMPLIMENTARY ACCESS POLICIES
-- ============================================================================

CREATE POLICY comp_access_select ON complimentary_access
  FOR SELECT USING (
    is_org_member(organization_id, auth.uid()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY comp_access_all ON complimentary_access
  FOR ALL USING (is_platform_admin(auth.uid()));

-- ============================================================================
-- DIRECTORY TABLES POLICIES (PUBLIC READ)
-- ============================================================================

CREATE POLICY airports_select ON airports
  FOR SELECT USING (TRUE);

CREATE POLICY airports_modify ON airports
  FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY ports_select ON ports
  FOR SELECT USING (TRUE);

CREATE POLICY ports_modify ON ports
  FOR ALL USING (is_platform_admin(auth.uid()));

-- ============================================================================
-- BLACKOUT DATES POLICIES
-- ============================================================================

CREATE POLICY blackout_select ON blackout_dates
  FOR SELECT USING (
    is_org_member(organization_id, auth.uid()) OR is_platform_admin(auth.uid())
  );

CREATE POLICY blackout_modify ON blackout_dates
  FOR ALL USING (
    has_role_or_higher(organization_id, auth.uid(), 'admin') OR is_platform_admin(auth.uid())
  );

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Note: Run these in Supabase Dashboard > Storage
-- 
-- Create bucket: organization-logos
-- Create bucket: asset-photos
-- 
-- Storage policies should allow authenticated users to:
-- - Read any file in organization-logos and asset-photos
-- - Write files to their own organization's folder

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
