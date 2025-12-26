export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          legal_name: string;
          commercial_name: string | null;
          ruc: string | null;
          dv: string | null;
          billing_email: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          legal_name: string;
          commercial_name?: string | null;
          ruc?: string | null;
          dv?: string | null;
          billing_email?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          legal_name?: string;
          commercial_name?: string | null;
          ruc?: string | null;
          dv?: string | null;
          billing_email?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
          tier_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
          tier_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
          tier_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          status: 'trial' | 'active' | 'past_due' | 'canceled' | 'complimentary';
          billing_cycle: 'monthly' | 'yearly';
          seat_limit: number;
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          status?: 'trial' | 'active' | 'past_due' | 'canceled' | 'complimentary';
          billing_cycle?: 'monthly' | 'yearly';
          seat_limit?: number;
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          status?: 'trial' | 'active' | 'past_due' | 'canceled' | 'complimentary';
          billing_cycle?: 'monthly' | 'yearly';
          seat_limit?: number;
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      entitlements: {
        Row: {
          id: string;
          subscription_id: string;
          section: 'planes' | 'helicopters' | 'residences' | 'boats';
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          section: 'planes' | 'helicopters' | 'residences' | 'boats';
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          section?: 'planes' | 'helicopters' | 'residences' | 'boats';
          is_active?: boolean;
          created_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          organization_id: string;
          section: 'planes' | 'helicopters' | 'residences' | 'boats';
          name: string;
          description: string | null;
          details: Json;
          primary_photo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          section: 'planes' | 'helicopters' | 'residences' | 'boats';
          name: string;
          description?: string | null;
          details?: Json;
          primary_photo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          section?: 'planes' | 'helicopters' | 'residences' | 'boats';
          name?: string;
          description?: string | null;
          details?: Json;
          primary_photo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      asset_photos: {
        Row: {
          id: string;
          asset_id: string;
          url: string;
          caption: string | null;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          url: string;
          caption?: string | null;
          order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          url?: string;
          caption?: string | null;
          order?: number;
          created_at?: string;
        };
      };
      tiers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          priority: number;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          priority: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          priority?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tier_rules: {
        Row: {
          id: string;
          tier_id: string;
          max_days_per_month: number | null;
          max_consecutive_days: number | null;
          min_lead_time_hours: number | null;
          requires_approval: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tier_id: string;
          max_days_per_month?: number | null;
          max_consecutive_days?: number | null;
          min_lead_time_hours?: number | null;
          requires_approval?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tier_id?: string;
          max_days_per_month?: number | null;
          max_consecutive_days?: number | null;
          min_lead_time_hours?: number | null;
          requires_approval?: boolean;
          created_at?: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          asset_id: string;
          user_id: string;
          organization_id: string;
          title: string | null;
          start_datetime: string;
          end_datetime: string;
          status: 'pending' | 'approved' | 'rejected' | 'canceled';
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          user_id: string;
          organization_id: string;
          title?: string | null;
          start_datetime: string;
          end_datetime: string;
          status?: 'pending' | 'approved' | 'rejected' | 'canceled';
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          user_id?: string;
          organization_id?: string;
          title?: string | null;
          start_datetime?: string;
          end_datetime?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'canceled';
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: 'admin' | 'manager' | 'member' | 'viewer';
          tier_id: string | null;
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role: 'admin' | 'manager' | 'member' | 'viewer';
          tier_id?: string | null;
          invited_by: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: 'admin' | 'manager' | 'member' | 'viewer';
          tier_id?: string | null;
          invited_by?: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      platform_admins: {
        Row: {
          id: string;
          user_id: string;
          role: 'super_admin' | 'admin' | 'support';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'super_admin' | 'admin' | 'support';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'super_admin' | 'admin' | 'support';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      airports: {
        Row: {
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
        };
        Insert: {
          id?: string;
          icao_code: string;
          iata_code?: string | null;
          name: string;
          city?: string | null;
          country: string;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string | null;
          type?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          icao_code?: string;
          iata_code?: string | null;
          name?: string;
          city?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string | null;
          type?: string;
          is_active?: boolean;
        };
      };
      ports: {
        Row: {
          id: string;
          code: string | null;
          name: string;
          city: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          timezone: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          code?: string | null;
          name: string;
          city?: string | null;
          country: string;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          code?: string | null;
          name?: string;
          city?: string | null;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string | null;
          is_active?: boolean;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      complimentary_access: {
        Row: {
          id: string;
          organization_id: string;
          granted_by: string;
          reason: string;
          expires_at: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          revoke_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          granted_by: string;
          reason: string;
          expires_at?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          granted_by?: string;
          reason?: string;
          expires_at?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
          created_at?: string;
        };
      };
      blackout_dates: {
        Row: {
          id: string;
          organization_id: string;
          tier_id: string | null;
          asset_id: string | null;
          start_date: string;
          end_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          tier_id?: string | null;
          asset_id?: string | null;
          start_date: string;
          end_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          tier_id?: string | null;
          asset_id?: string | null;
          start_date?: string;
          end_date?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      organization_role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
      subscription_status: 'trial' | 'active' | 'past_due' | 'canceled' | 'complimentary';
      billing_cycle: 'monthly' | 'yearly';
      asset_section: 'planes' | 'helicopters' | 'residences' | 'boats';
      reservation_status: 'pending' | 'approved' | 'rejected' | 'canceled';
      platform_role: 'super_admin' | 'admin' | 'support';
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
export type InsertDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Convenience types
export type Profile = Tables<'profiles'>;
export type Organization = Tables<'organizations'>;
export type OrganizationMember = Tables<'organization_members'>;
export type Subscription = Tables<'subscriptions'>;
export type Entitlement = Tables<'entitlements'>;
export type Asset = Tables<'assets'>;
export type AssetPhoto = Tables<'asset_photos'>;
export type Tier = Tables<'tiers'>;
export type TierRule = Tables<'tier_rules'>;
export type Reservation = Tables<'reservations'>;
export type Invitation = Tables<'invitations'>;
export type PlatformAdmin = Tables<'platform_admins'>;
export type Airport = Tables<'airports'>;
export type Port = Tables<'ports'>;
export type AuditLog = Tables<'audit_logs'>;
export type ComplimentaryAccess = Tables<'complimentary_access'>;
export type BlackoutDate = Tables<'blackout_dates'>;

export type OrganizationRole = Enums<'organization_role'>;
export type SubscriptionStatus = Enums<'subscription_status'>;
export type BillingCycle = Enums<'billing_cycle'>;
export type AssetSection = Enums<'asset_section'>;
export type ReservationStatus = Enums<'reservation_status'>;
export type PlatformRole = Enums<'platform_role'>;
