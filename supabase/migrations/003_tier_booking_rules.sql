-- ================================================
-- ReservePTY v37 Migration - Tier Booking Rules
-- Run this in Supabase SQL Editor
-- ================================================

-- Rule types enum
CREATE TYPE rule_type AS ENUM (
  'date_range',           -- Specific date ranges require approval
  'consecutive_booking',  -- X bookings in a row require approval
  'concurrent_booking',   -- Multiple assets same period
  'lead_time',           -- Minimum time before booking
  'custom'               -- Custom rule with description
);

-- Approval type enum  
CREATE TYPE rule_approval_type AS ENUM (
  'any_approver',        -- Any user with approval role can approve
  'all_principals',      -- All users in principal (priority 1) tier must approve
  'specific_users',      -- Specific designated users must approve
  'tier_members'         -- All members of a specific tier must approve
);

-- Tier Booking Rules table
CREATE TABLE tier_booking_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES tiers(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  description text,
  
  rule_type rule_type NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}',
  -- Example conditions:
  -- date_range: { "start_month_day": "12-08", "end_month_day": "01-06" }
  -- consecutive_booking: { "count": 2, "unit": "weekends" }
  -- concurrent_booking: { "max_assets": 2, "min_request_days_before": 3 }
  -- lead_time: { "min_hours": 72 }
  
  requires_approval boolean NOT NULL DEFAULT true,
  approval_type rule_approval_type NOT NULL DEFAULT 'any_approver',
  approver_tier_id uuid REFERENCES tiers(id), -- For 'tier_members' type
  
  is_override boolean NOT NULL DEFAULT false, -- Override rules take precedence
  priority integer NOT NULL DEFAULT 100, -- Lower = higher priority
  
  applies_to_all_assets boolean NOT NULL DEFAULT true,
  
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Which assets each rule applies to (when applies_to_all_assets = false)
CREATE TABLE tier_rule_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id uuid NOT NULL REFERENCES tier_booking_rules(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rule_id, asset_id)
);

-- Track rule approvals for reservations
CREATE TABLE rule_approvals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES tier_booking_rules(id) ON DELETE CASCADE,
  
  user_id uuid NOT NULL REFERENCES profiles(id), -- Who needs to approve
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'), -- For email link
  token_expires_at timestamptz DEFAULT (now() + interval '7 days'),
  
  responded_at timestamptz,
  response_notes text,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(reservation_id, rule_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_tier_rules_org ON tier_booking_rules(organization_id);
CREATE INDEX idx_tier_rules_tier ON tier_booking_rules(tier_id);
CREATE INDEX idx_tier_rules_active ON tier_booking_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_rule_assets_rule ON tier_rule_assets(rule_id);
CREATE INDEX idx_rule_assets_asset ON tier_rule_assets(asset_id);
CREATE INDEX idx_rule_approvals_reservation ON rule_approvals(reservation_id);
CREATE INDEX idx_rule_approvals_user ON rule_approvals(user_id);
CREATE INDEX idx_rule_approvals_token ON rule_approvals(token);
CREATE INDEX idx_rule_approvals_pending ON rule_approvals(status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE tier_booking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_rule_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tier_booking_rules
CREATE POLICY "Users can view rules for their organization" ON tier_booking_rules
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage rules" ON tier_booking_rules
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for tier_rule_assets
CREATE POLICY "Users can view rule assets for their organization" ON tier_rule_assets
  FOR SELECT USING (
    rule_id IN (
      SELECT id FROM tier_booking_rules WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage rule assets" ON tier_rule_assets
  FOR ALL USING (
    rule_id IN (
      SELECT id FROM tier_booking_rules WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- RLS Policies for rule_approvals
CREATE POLICY "Users can view approvals they're involved in" ON rule_approvals
  FOR SELECT USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "System can create approvals" ON rule_approvals
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own approvals" ON rule_approvals
  FOR UPDATE USING (user_id = auth.uid());

-- Function to check if a reservation triggers any rules
CREATE OR REPLACE FUNCTION check_booking_rules(
  p_organization_id uuid,
  p_asset_id uuid,
  p_user_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE (
  rule_id uuid,
  rule_name text,
  rule_description text,
  approval_type rule_approval_type,
  approver_tier_id uuid
) AS $$
DECLARE
  v_user_tier_id uuid;
  v_start_month_day text;
  v_end_month_day text;
BEGIN
  -- Get user's tier
  SELECT tier_id INTO v_user_tier_id
  FROM organization_members
  WHERE organization_id = p_organization_id AND user_id = p_user_id;

  -- Format dates for comparison
  v_start_month_day := to_char(p_start_date, 'MM-DD');
  v_end_month_day := to_char(p_end_date, 'MM-DD');

  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.approval_type,
    r.approver_tier_id
  FROM tier_booking_rules r
  LEFT JOIN tier_rule_assets tra ON r.id = tra.rule_id
  WHERE r.organization_id = p_organization_id
    AND r.tier_id = v_user_tier_id
    AND r.is_active = true
    AND r.requires_approval = true
    AND (r.applies_to_all_assets = true OR tra.asset_id = p_asset_id)
    AND (
      -- Date range rule check
      (r.rule_type = 'date_range' AND (
        -- Handle year wrap (Dec to Jan)
        CASE 
          WHEN (r.conditions->>'start_month_day') > (r.conditions->>'end_month_day') THEN
            v_start_month_day >= (r.conditions->>'start_month_day') OR 
            v_start_month_day <= (r.conditions->>'end_month_day')
          ELSE
            v_start_month_day >= (r.conditions->>'start_month_day') AND 
            v_start_month_day <= (r.conditions->>'end_month_day')
        END
      ))
      -- Other rule types would need additional logic
      OR r.rule_type IN ('consecutive_booking', 'concurrent_booking', 'custom')
    )
  ORDER BY r.is_override DESC, r.priority ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify
SELECT 'Migration completed successfully' as status;
