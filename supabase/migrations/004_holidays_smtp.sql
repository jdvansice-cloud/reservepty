-- ================================================
-- ReservePTY v38 Migration - Holidays & SMTP
-- Run this in Supabase SQL Editor
-- ================================================

-- Organization Holidays table
CREATE TABLE organization_holidays (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  description text,
  
  -- Date configuration
  date date,                    -- For fixed dates (Jan 1, Dec 25)
  month integer,                -- Month (1-12) for recurring
  day integer,                  -- Day of month for recurring
  is_recurring boolean NOT NULL DEFAULT true,  -- Repeats every year
  
  -- For variable holidays (Easter, Carnival, etc)
  is_variable boolean NOT NULL DEFAULT false,
  variable_rule text,           -- e.g., 'easter', 'easter-2', 'carnival'
  
  -- Categorization
  category text DEFAULT 'national' CHECK (category IN ('national', 'religious', 'company', 'custom')),
  
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Holiday periods (for rules like "semana santa", "navidad")
CREATE TABLE holiday_periods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  description text,
  
  -- Can reference specific holidays or date ranges
  start_holiday_id uuid REFERENCES organization_holidays(id),
  end_holiday_id uuid REFERENCES organization_holidays(id),
  
  -- Or use fixed dates
  start_month integer,
  start_day integer,
  end_month integer,
  end_day integer,
  
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Link rules to holidays/periods
CREATE TABLE tier_rule_holidays (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id uuid NOT NULL REFERENCES tier_booking_rules(id) ON DELETE CASCADE,
  holiday_id uuid REFERENCES organization_holidays(id) ON DELETE CASCADE,
  period_id uuid REFERENCES holiday_periods(id) ON DELETE CASCADE,
  
  -- Days before/after the holiday that rule applies
  days_before integer DEFAULT 0,
  days_after integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT check_holiday_or_period CHECK (
    (holiday_id IS NOT NULL AND period_id IS NULL) OR
    (holiday_id IS NULL AND period_id IS NOT NULL)
  )
);

-- Organization SMTP Settings (encrypted in practice)
CREATE TABLE organization_smtp_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- SMTP Configuration
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL DEFAULT 587,
  smtp_secure boolean NOT NULL DEFAULT true,  -- TLS
  smtp_user text NOT NULL,
  smtp_password text NOT NULL,  -- Should be encrypted in production
  
  -- Email settings
  from_email text NOT NULL,
  from_name text,
  reply_to text,
  
  -- Status
  is_active boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  last_test_at timestamptz,
  last_test_result text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add holiday rule type to existing enum (if not exists)
DO $$ 
BEGIN
  ALTER TYPE rule_type ADD VALUE IF NOT EXISTS 'holiday';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX idx_org_holidays_org ON organization_holidays(organization_id);
CREATE INDEX idx_org_holidays_date ON organization_holidays(month, day);
CREATE INDEX idx_holiday_periods_org ON holiday_periods(organization_id);
CREATE INDEX idx_rule_holidays_rule ON tier_rule_holidays(rule_id);
CREATE INDEX idx_smtp_settings_org ON organization_smtp_settings(organization_id);

-- Enable RLS
ALTER TABLE organization_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_rule_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_smtp_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_holidays
CREATE POLICY "Users can view holidays for their organization" ON organization_holidays
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage holidays" ON organization_holidays
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for holiday_periods
CREATE POLICY "Users can view periods for their organization" ON holiday_periods
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage periods" ON holiday_periods
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for tier_rule_holidays
CREATE POLICY "Users can view rule holidays" ON tier_rule_holidays
  FOR SELECT USING (
    rule_id IN (
      SELECT id FROM tier_booking_rules WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage rule holidays" ON tier_rule_holidays
  FOR ALL USING (
    rule_id IN (
      SELECT id FROM tier_booking_rules WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- RLS Policies for SMTP (owner only)
CREATE POLICY "Owner can view SMTP settings" ON organization_smtp_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owner can manage SMTP settings" ON organization_smtp_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Seed common Panama holidays
-- Note: Run this after creating an organization, replacing the org_id
-- INSERT INTO organization_holidays (organization_id, name, month, day, category, is_recurring) VALUES
-- ('YOUR_ORG_ID', 'Año Nuevo', 1, 1, 'national', true),
-- ('YOUR_ORG_ID', 'Día de los Mártires', 1, 9, 'national', true),
-- ('YOUR_ORG_ID', 'Día del Trabajo', 5, 1, 'national', true),
-- ('YOUR_ORG_ID', 'Separación de Panamá de Colombia', 11, 3, 'national', true),
-- ('YOUR_ORG_ID', 'Día de la Bandera', 11, 4, 'national', true),
-- ('YOUR_ORG_ID', 'Primer Grito de Independencia', 11, 10, 'national', true),
-- ('YOUR_ORG_ID', 'Independencia de Panamá de España', 11, 28, 'national', true),
-- ('YOUR_ORG_ID', 'Día de la Madre', 12, 8, 'national', true),
-- ('YOUR_ORG_ID', 'Navidad', 12, 25, 'religious', true),
-- ('YOUR_ORG_ID', 'Carnaval', null, null, 'national', true); -- Variable date

SELECT 'Migration completed successfully' as status;
