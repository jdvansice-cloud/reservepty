export type MemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
export type AdminRole = 'super_admin' | 'admin' | 'support';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'complimentary';
export type BillingCycle = 'monthly' | 'yearly';
export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'canceled';
export type AssetSection = 'planes' | 'helicopters' | 'residences' | 'boats';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  legal_name: string;
  commercial_name: string | null;
  ruc: string | null;
  dv: string | null;
  billing_email: string | null;
  logo_url: string | null;
  is_active: boolean;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from_email: string | null;
  smtp_from_name: string | null;
  smtp_secure: boolean | null;
  smtp_enabled: boolean | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  tier_id: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  tier?: Tier;
}

export interface Subscription {
  id: string;
  organization_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  seat_limit: number;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string | null;
  external_customer_id: string | null;
  external_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entitlement {
  id: string;
  subscription_id: string;
  section: AssetSection;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  organization_id: string;
  section: AssetSection;
  name: string;
  description: string | null;
  primary_photo_url: string | null;
  details: Record<string, unknown>;
  is_active: boolean;
  current_location: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AssetPhoto {
  id: string;
  asset_id: string;
  url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  organization_id: string;
  asset_id: string;
  user_id: string;
  title: string | null;
  start_datetime: string;
  end_datetime: string;
  status: ReservationStatus;
  notes: string | null;
  guest_count: number | null;
  metadata: Record<string, unknown>;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
  canceled_at: string | null;
  asset?: Asset;
  profile?: Profile;
}

export interface Tier {
  id: string;
  organization_id: string;
  name: string;
  priority: number;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TierRule {
  id: string;
  tier_id: string;
  max_days_per_month: number | null;
  max_consecutive_days: number | null;
  min_lead_time_hours: number;
  max_advance_days: number | null;
  requires_approval: boolean;
  can_override: boolean;
  created_at: string;
  updated_at: string;
}

export interface Airport {
  id: string;
  icao_code: string;
  iata_code: string | null;
  name: string;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  type: string;
  is_active: boolean;
}

export interface Heliport {
  id: string;
  icao_code: string | null;
  name: string;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  is_active: boolean;
}

export interface Port {
  id: string;
  code: string | null;
  name: string;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  is_active: boolean;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: MemberRole;
  tier_id: string | null;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface ComplimentaryAccess {
  id: string;
  organization_id: string;
  granted_by: string;
  reason: string;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  created_at: string;
  organization?: Organization;
}
