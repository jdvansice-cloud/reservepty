'use client';

import { createClient } from '@/lib/supabase/client';
import type { 
  Organization, 
  Profile, 
  Subscription, 
  Entitlement,
  PlatformAdmin,
  AuditLog,
  ComplimentaryAccess,
  OrganizationMember 
} from '@/types/database';

const supabase = createClient();

// ============================================================================
// PLATFORM ADMIN SERVICES
// ============================================================================

export interface PlatformAdminWithProfile extends PlatformAdmin {
  profile?: Profile;
}

/**
 * Check if current user is a platform admin
 */
export async function checkPlatformAdmin(): Promise<PlatformAdminWithProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('platform_admins')
    .select(`
      *,
      profile:profiles (*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data as unknown as PlatformAdminWithProfile;
}

/**
 * Get all platform admins
 */
export async function getPlatformAdmins(): Promise<PlatformAdminWithProfile[]> {
  const { data, error } = await supabase
    .from('platform_admins')
    .select(`
      *,
      profile:profiles (*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as PlatformAdminWithProfile[];
}

// ============================================================================
// ORGANIZATION ADMIN SERVICES
// ============================================================================

export interface OrganizationWithDetails extends Organization {
  subscription?: Subscription & {
    entitlements?: Entitlement[];
  };
  member_count?: number;
  owner?: Profile;
}

/**
 * Get all organizations (admin view)
 */
export async function getAllOrganizations(): Promise<OrganizationWithDetails[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      subscription:subscriptions (
        *,
        entitlements (*)
      ),
      members:organization_members (
        id,
        role,
        user_id,
        profile:profiles (
          email,
          first_name,
          last_name
        )
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Cast and transform data to include owner and member count
  const orgs = (data || []) as unknown as Array<Organization & { 
    subscription?: Array<Subscription & { entitlements?: Entitlement[] }>;
    members?: Array<OrganizationMember & { profile?: Profile }>;
  }>;
  
  return orgs.map(org => {
    const owner = org.members?.find(m => m.role === 'owner');
    return {
      ...org,
      subscription: org.subscription?.[0] || undefined,
      member_count: org.members?.length || 0,
      owner: owner?.profile,
    };
  });
}

/**
 * Get organization by ID with full details (admin view)
 */
export async function getOrganizationDetails(id: string): Promise<OrganizationWithDetails | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      subscription:subscriptions (
        *,
        entitlements (*)
      ),
      members:organization_members (
        *,
        profile:profiles (*),
        tier:tiers (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Cast to proper type
  const orgData = data as unknown as Organization & { 
    subscription?: Array<Subscription & { entitlements?: Entitlement[] }>;
    members?: Array<OrganizationMember & { profile?: Profile }>;
  };

  const owner = orgData.members?.find(m => m.role === 'owner');
  return {
    ...orgData,
    subscription: orgData.subscription?.[0] || undefined,
    member_count: orgData.members?.length || 0,
    owner: owner?.profile,
  };
}

/**
 * Create organization with owner (admin action)
 */
export async function createOrganizationWithOwner(input: {
  legalName: string;
  commercialName?: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  sections: ('planes' | 'helicopters' | 'residences' | 'watercraft')[];
  seatLimit: number;
  isComplimentary: boolean;
}): Promise<Organization> {
  // Note: This would typically be done via an Edge Function to handle
  // user creation securely. For now, this is a placeholder.
  throw new Error('Use Supabase Edge Function for creating organizations with new users');
}

/**
 * Update organization (admin action)
 */
export async function updateOrganization(
  id: string,
  updates: Partial<Organization>
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Suspend organization
 */
export async function suspendOrganization(id: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
  
  await logAdminAction('organization_suspended', 'organization', id);
}

/**
 * Reactivate organization
 */
export async function reactivateOrganization(id: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ is_active: true })
    .eq('id', id);

  if (error) throw error;
  
  await logAdminAction('organization_reactivated', 'organization', id);
}

/**
 * Delete organization (soft delete)
 */
export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  
  await logAdminAction('organization_deleted', 'organization', id);
}

// ============================================================================
// USER ADMIN SERVICES
// ============================================================================

export interface UserWithOrganizations extends Profile {
  memberships?: (OrganizationMember & {
    organization?: Organization;
  })[];
}

/**
 * Get all users (admin view)
 */
export async function getAllUsers(): Promise<UserWithOrganizations[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      memberships:organization_members (
        *,
        organization:organizations (
          id,
          legal_name,
          commercial_name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get user by ID with details
 */
export async function getUserDetails(id: string): Promise<UserWithOrganizations | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      memberships:organization_members (
        *,
        organization:organizations (*),
        tier:tiers (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

// ============================================================================
// COMPLIMENTARY ACCESS SERVICES
// ============================================================================

export interface ComplimentaryAccessWithDetails extends ComplimentaryAccess {
  organization?: Organization;
  granted_by_profile?: Profile;
  revoked_by_profile?: Profile;
}

/**
 * Get all complimentary access records
 */
export async function getComplimentaryAccess(): Promise<ComplimentaryAccessWithDetails[]> {
  const { data, error } = await supabase
    .from('complimentary_access')
    .select(`
      *,
      organization:organizations (
        id,
        legal_name,
        commercial_name,
        logo_url
      ),
      granted_by_profile:profiles!granted_by (
        first_name,
        last_name,
        email
      ),
      revoked_by_profile:profiles!revoked_by (
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Grant complimentary access
 */
export async function grantComplimentaryAccess(input: {
  organizationId: string;
  sections: ('planes' | 'helicopters' | 'residences' | 'watercraft')[];
  seatLimit: number;
  reason: string;
  expiresAt?: string | null;
}): Promise<ComplimentaryAccess> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Start transaction: update subscription and create record
  
  // 1. Get subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('organization_id', input.organizationId)
    .single();

  if (subError) throw subError;

  // 2. Update subscription status
  const { error: updateSubError } = await supabase
    .from('subscriptions')
    .update({
      status: 'complimentary',
      seat_limit: input.seatLimit,
    })
    .eq('id', subscription.id);

  if (updateSubError) throw updateSubError;

  // 3. Update entitlements
  // First, deactivate all
  await supabase
    .from('entitlements')
    .update({ is_active: false })
    .eq('subscription_id', subscription.id);

  // Then activate selected sections
  for (const section of input.sections) {
    const { error: entError } = await supabase
      .from('entitlements')
      .upsert({
        subscription_id: subscription.id,
        section,
        is_active: true,
      }, {
        onConflict: 'subscription_id,section',
      });

    if (entError) throw entError;
  }

  // 4. Create complimentary access record
  const { data: access, error: accessError } = await supabase
    .from('complimentary_access')
    .insert({
      organization_id: input.organizationId,
      granted_by: user.id,
      reason: input.reason,
      expires_at: input.expiresAt,
    })
    .select()
    .single();

  if (accessError) throw accessError;

  await logAdminAction('complimentary_granted', 'organization', input.organizationId, {
    sections: input.sections,
    seat_limit: input.seatLimit,
    reason: input.reason,
  });

  return access;
}

/**
 * Revoke complimentary access
 */
export async function revokeComplimentaryAccess(
  accessId: string,
  reason: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get access record
  const { data: access, error: getError } = await supabase
    .from('complimentary_access')
    .select('organization_id')
    .eq('id', accessId)
    .single();

  if (getError) throw getError;

  // Update access record
  const { error: updateError } = await supabase
    .from('complimentary_access')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: user.id,
      revoke_reason: reason,
    })
    .eq('id', accessId);

  if (updateError) throw updateError;

  // Update subscription status to canceled
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('organization_id', access.organization_id);

  await logAdminAction('complimentary_revoked', 'organization', access.organization_id, {
    reason,
  });
}

// ============================================================================
// AUDIT LOG SERVICES
// ============================================================================

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(options?: {
  organizationId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles (
        first_name,
        last_name,
        email
      ),
      organization:organizations (
        legal_name,
        commercial_name
      )
    `)
    .order('created_at', { ascending: false });

  if (options?.organizationId) {
    query = query.eq('organization_id', options.organizationId);
  }

  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType);
  }

  if (options?.action) {
    query = query.ilike('action', `%${options.action}%`);
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate);
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Log admin action
 */
export async function logAdminAction(
  action: string,
  entityType: string,
  entityId?: string,
  newValues?: Record<string, unknown>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from('audit_logs').insert({
    user_id: user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_values: newValues,
  });
}

// ============================================================================
// SUBSCRIPTION ADMIN SERVICES
// ============================================================================

/**
 * Update subscription (admin action)
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<Subscription>
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update entitlements (admin action)
 */
export async function updateEntitlements(
  subscriptionId: string,
  sections: ('planes' | 'helicopters' | 'residences' | 'watercraft')[]
): Promise<void> {
  // Deactivate all first
  await supabase
    .from('entitlements')
    .update({ is_active: false })
    .eq('subscription_id', subscriptionId);

  // Activate selected sections
  for (const section of sections) {
    await supabase
      .from('entitlements')
      .upsert({
        subscription_id: subscriptionId,
        section,
        is_active: true,
      }, {
        onConflict: 'subscription_id,section',
      });
  }
}

// ============================================================================
// PLATFORM STATISTICS
// ============================================================================

export interface PlatformStats {
  total_organizations: number;
  active_organizations: number;
  trial_organizations: number;
  complimentary_organizations: number;
  total_users: number;
  total_assets: number;
  total_bookings_this_month: number;
  mrr: number;
  section_breakdown: {
    planes: number;
    helicopters: number;
    residences: number;
    watercraft: number;
  };
}

/**
 * Get platform statistics
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  // Organization counts
  const { count: totalOrgs } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  const { count: activeOrgs } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: trialOrgs } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'trial');

  const { count: compOrgs } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'complimentary');

  // User count
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Asset count
  const { count: totalAssets } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // This month's bookings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthBookings } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());

  // Asset breakdown by section
  const { data: assetCounts } = await supabase
    .from('assets')
    .select('section')
    .is('deleted_at', null);

  const sectionCounts = {
    planes: 0,
    helicopters: 0,
    residences: 0,
    watercraft: 0,
  };

  assetCounts?.forEach(asset => {
    if (asset.section in sectionCounts) {
      sectionCounts[asset.section as keyof typeof sectionCounts]++;
    }
  });

  return {
    total_organizations: totalOrgs || 0,
    active_organizations: activeOrgs || 0,
    trial_organizations: trialOrgs || 0,
    complimentary_organizations: compOrgs || 0,
    total_users: totalUsers || 0,
    total_assets: totalAssets || 0,
    total_bookings_this_month: monthBookings || 0,
    mrr: 0, // TODO: Calculate from subscriptions
    section_breakdown: sectionCounts,
  };
}
