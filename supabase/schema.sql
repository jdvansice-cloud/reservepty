-- ============================================================================
-- ReservePTY Database Schema v1.0.0
-- ============================================================================
-- Run this script in Supabase SQL Editor to create all tables and policies
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'complimentary');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
CREATE TYPE asset_section AS ENUM ('planes', 'helicopters', 'residences', 'boats');
CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'rejected', 'canceled');
CREATE TYPE platform_role AS ENUM ('super_admin', 'admin', 'support');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_name TEXT NOT NULL,
    commercial_name TEXT,
    ruc TEXT,
    dv TEXT,
    billing_email TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Organization Members (junction table)
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role organization_role NOT NULL DEFAULT 'member',
    tier_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    status subscription_status NOT NULL DEFAULT 'trial',
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    seat_limit INTEGER NOT NULL DEFAULT 5,
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Entitlements (which sections are active)
CREATE TABLE entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    section asset_section NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(subscription_id, section)
);

-- Tiers (booking priority levels)
CREATE TABLE tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    color TEXT NOT NULL DEFAULT '#c8b273',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add foreign key for tier_id in organization_members
ALTER TABLE organization_members 
ADD CONSTRAINT fk_tier 
FOREIGN KEY (tier_id) REFERENCES tiers(id) ON DELETE SET NULL;

-- Tier Rules
CREATE TABLE tier_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_id UUID NOT NULL REFERENCES tiers(id) ON DELETE CASCADE UNIQUE,
    max_days_per_month INTEGER,
    max_consecutive_days INTEGER,
    min_lead_time_hours INTEGER DEFAULT 0,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    can_override BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    section asset_section NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    details JSONB NOT NULL DEFAULT '{}',
    primary_photo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Asset Photos
CREATE TABLE asset_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reservations
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    status reservation_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_dates CHECK (end_datetime > start_datetime)
);

-- Invitations
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role organization_role NOT NULL DEFAULT 'member',
    tier_id UUID REFERENCES tiers(id) ON DELETE SET NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Platform Admins (separate from regular users)
CREATE TABLE platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role platform_role NOT NULL DEFAULT 'support',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Airports (global directory)
CREATE TABLE airports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    icao_code TEXT NOT NULL UNIQUE,
    iata_code TEXT,
    name TEXT NOT NULL,
    city TEXT,
    country TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    timezone TEXT,
    type TEXT DEFAULT 'airport',
    runway_length_ft INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ports (for boats)
CREATE TABLE ports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    city TEXT,
    country TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    timezone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_assets_org ON assets(organization_id);
CREATE INDEX idx_assets_section ON assets(section);
CREATE INDEX idx_assets_active ON assets(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_asset ON reservations(asset_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_org ON reservations(organization_id);
CREATE INDEX idx_reservations_dates ON reservations(start_datetime, end_datetime);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_airports_icao ON airports(icao_code);
CREATE INDEX idx_airports_iata ON airports(iata_code);
CREATE INDEX idx_airports_active ON airports(is_active);
CREATE INDEX idx_ports_code ON ports(code);
CREATE INDEX idx_ports_active ON ports(is_active);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get user's organization memberships
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid UUID)
RETURNS TABLE(organization_id UUID, role organization_role) AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id, om.role
    FROM organization_members om
    WHERE om.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = user_uuid AND organization_id = org_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has role in organization
CREATE OR REPLACE FUNCTION has_org_role(user_uuid UUID, org_uuid UUID, required_roles organization_role[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = user_uuid 
        AND organization_id = org_uuid
        AND role = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_admins WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tiers_updated_at
    BEFORE UPDATE ON tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_platform_admins_updated_at
    BEFORE UPDATE ON platform_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Profiles
-- ============================================================================

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Org members can view other members' profiles
CREATE POLICY "Org members can view peer profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om1
            JOIN organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.id
        )
    );

-- ============================================================================
-- RLS POLICIES - Organizations
-- ============================================================================

CREATE POLICY "Members can view their organizations"
    ON organizations FOR SELECT
    USING (is_org_member(auth.uid(), id));

CREATE POLICY "Anyone can create an organization"
    ON organizations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Owners and admins can update organizations"
    ON organizations FOR UPDATE
    USING (has_org_role(auth.uid(), id, ARRAY['owner', 'admin']::organization_role[]));

CREATE POLICY "Only owners can delete organizations"
    ON organizations FOR DELETE
    USING (has_org_role(auth.uid(), id, ARRAY['owner']::organization_role[]));

-- ============================================================================
-- RLS POLICIES - Organization Members
-- ============================================================================

CREATE POLICY "Members can view org members"
    ON organization_members FOR SELECT
    USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owners and admins can manage members"
    ON organization_members FOR INSERT
    WITH CHECK (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

CREATE POLICY "Owners and admins can update members"
    ON organization_members FOR UPDATE
    USING (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

CREATE POLICY "Owners and admins can remove members"
    ON organization_members FOR DELETE
    USING (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

-- ============================================================================
-- RLS POLICIES - Subscriptions
-- ============================================================================

CREATE POLICY "Members can view subscription"
    ON subscriptions FOR SELECT
    USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owners can manage subscription"
    ON subscriptions FOR ALL
    USING (has_org_role(auth.uid(), organization_id, ARRAY['owner']::organization_role[]));

-- ============================================================================
-- RLS POLICIES - Entitlements
-- ============================================================================

CREATE POLICY "Members can view entitlements"
    ON entitlements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.id = entitlements.subscription_id
            AND is_org_member(auth.uid(), s.organization_id)
        )
    );

CREATE POLICY "Owners can manage entitlements"
    ON entitlements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.id = entitlements.subscription_id
            AND has_org_role(auth.uid(), s.organization_id, ARRAY['owner']::organization_role[])
        )
    );

-- ============================================================================
-- RLS POLICIES - Tiers
-- ============================================================================

CREATE POLICY "Members can view tiers"
    ON tiers FOR SELECT
    USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owners and admins can manage tiers"
    ON tiers FOR ALL
    USING (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

-- ============================================================================
-- RLS POLICIES - Tier Rules
-- ============================================================================

CREATE POLICY "Members can view tier rules"
    ON tier_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tiers t
            WHERE t.id = tier_rules.tier_id
            AND is_org_member(auth.uid(), t.organization_id)
        )
    );

CREATE POLICY "Owners and admins can manage tier rules"
    ON tier_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tiers t
            WHERE t.id = tier_rules.tier_id
            AND has_org_role(auth.uid(), t.organization_id, ARRAY['owner', 'admin']::organization_role[])
        )
    );

-- ============================================================================
-- RLS POLICIES - Assets
-- ============================================================================

CREATE POLICY "Members can view active assets"
    ON assets FOR SELECT
    USING (is_org_member(auth.uid(), organization_id) AND deleted_at IS NULL);

CREATE POLICY "Owners and admins can create assets"
    ON assets FOR INSERT
    WITH CHECK (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

CREATE POLICY "Owners and admins can update assets"
    ON assets FOR UPDATE
    USING (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

CREATE POLICY "Owners and admins can delete assets"
    ON assets FOR DELETE
    USING (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

-- ============================================================================
-- RLS POLICIES - Asset Photos
-- ============================================================================

CREATE POLICY "Members can view asset photos"
    ON asset_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM assets a
            WHERE a.id = asset_photos.asset_id
            AND is_org_member(auth.uid(), a.organization_id)
        )
    );

CREATE POLICY "Owners and admins can manage asset photos"
    ON asset_photos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM assets a
            WHERE a.id = asset_photos.asset_id
            AND has_org_role(auth.uid(), a.organization_id, ARRAY['owner', 'admin']::organization_role[])
        )
    );

-- ============================================================================
-- RLS POLICIES - Reservations
-- ============================================================================

CREATE POLICY "Members can view org reservations"
    ON reservations FOR SELECT
    USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Members can create reservations"
    ON reservations FOR INSERT
    WITH CHECK (
        is_org_member(auth.uid(), organization_id) 
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can update own reservations"
    ON reservations FOR UPDATE
    USING (auth.uid() = user_id OR has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'manager']::organization_role[]));

CREATE POLICY "Managers can approve/reject reservations"
    ON reservations FOR UPDATE
    USING (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'manager']::organization_role[]));

-- ============================================================================
-- RLS POLICIES - Invitations
-- ============================================================================

CREATE POLICY "Owners and admins can view invitations"
    ON invitations FOR SELECT
    USING (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

CREATE POLICY "Invited users can view their invitation"
    ON invitations FOR SELECT
    USING (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Owners and admins can create invitations"
    ON invitations FOR INSERT
    WITH CHECK (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

CREATE POLICY "Owners and admins can delete invitations"
    ON invitations FOR DELETE
    USING (has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::organization_role[]));

-- ============================================================================
-- RLS POLICIES - Platform Admins
-- ============================================================================

CREATE POLICY "Platform admins can view admins"
    ON platform_admins FOR SELECT
    USING (is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can manage platform admins"
    ON platform_admins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM platform_admins 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- RLS POLICIES - Audit Logs
-- ============================================================================

CREATE POLICY "Owners can view org audit logs"
    ON audit_logs FOR SELECT
    USING (
        has_org_role(auth.uid(), organization_id, ARRAY['owner']::organization_role[])
        OR is_platform_admin(auth.uid())
    );

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- HANDLE NEW USER SIGNUP
-- ============================================================================

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
-- STORAGE BUCKETS
-- ============================================================================

-- These need to be created in Supabase Dashboard > Storage
-- Bucket: organization-logos
-- Bucket: asset-photos
-- Bucket: profile-avatars

-- Example storage policies (run in SQL editor after creating buckets):

-- Allow authenticated users to upload their own avatar
-- CREATE POLICY "Users can upload own avatar"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'profile-avatars' 
--     AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Allow org members to upload asset photos
-- CREATE POLICY "Org members can upload asset photos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'asset-photos'
--     AND has_org_role(auth.uid(), (storage.foldername(name))[1]::uuid, ARRAY['owner', 'admin']::organization_role[])
-- );

-- ============================================================================
-- SEED DATA FOR DEVELOPMENT
-- ============================================================================

-- This creates a development organization with sample data
-- Only run in development environment!

-- CREATE OR REPLACE FUNCTION seed_development_data()
-- RETURNS void AS $$
-- DECLARE
--     v_org_id UUID;
--     v_sub_id UUID;
--     v_tier1_id UUID;
--     v_tier2_id UUID;
-- BEGIN
--     -- Create development organization
--     INSERT INTO organizations (legal_name, commercial_name)
--     VALUES ('Development Corp', 'DevCorp')
--     RETURNING id INTO v_org_id;
--     
--     -- Create subscription
--     INSERT INTO subscriptions (organization_id, status, seat_limit)
--     VALUES (v_org_id, 'complimentary', 100)
--     RETURNING id INTO v_sub_id;
--     
--     -- Create entitlements for all sections
--     INSERT INTO entitlements (subscription_id, section) VALUES
--         (v_sub_id, 'planes'),
--         (v_sub_id, 'helicopters'),
--         (v_sub_id, 'residences'),
--         (v_sub_id, 'boats');
--     
--     -- Create tiers
--     INSERT INTO tiers (organization_id, name, priority, color)
--     VALUES (v_org_id, 'Principals', 1, '#c8b273')
--     RETURNING id INTO v_tier1_id;
--     
--     INSERT INTO tiers (organization_id, name, priority, color)
--     VALUES (v_org_id, 'Family', 2, '#22c55e')
--     RETURNING id INTO v_tier2_id;
--     
--     -- Create tier rules
--     INSERT INTO tier_rules (tier_id, max_days_per_month, requires_approval)
--     VALUES (v_tier1_id, NULL, FALSE);
--     
--     INSERT INTO tier_rules (tier_id, max_days_per_month, min_lead_time_hours, requires_approval)
--     VALUES (v_tier2_id, 10, 72, FALSE);
--     
--     RAISE NOTICE 'Development data seeded. Organization ID: %', v_org_id;
-- END;
-- $$ LANGUAGE plpgsql;

-- To seed: SELECT seed_development_data();

-- ============================================================================
-- RLS POLICIES - Airports (Global Directory)
-- ============================================================================

-- Anyone authenticated can view airports
CREATE POLICY "Authenticated users can view airports"
    ON airports FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Org owners/admins can create airports
CREATE POLICY "Org admins can create airports"
    ON airports FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Org owners/admins can update airports
CREATE POLICY "Org admins can update airports"
    ON airports FOR UPDATE
    TO authenticated
    USING (true);

-- ============================================================================
-- RLS POLICIES - Ports (Global Directory)
-- ============================================================================

-- Anyone authenticated can view ports
CREATE POLICY "Authenticated users can view ports"
    ON ports FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Org admins can manage ports
CREATE POLICY "Org admins can create ports"
    ON ports FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Org admins can update ports"
    ON ports FOR UPDATE
    TO authenticated
    USING (true);

-- ============================================================================
-- DONE!
-- ============================================================================
