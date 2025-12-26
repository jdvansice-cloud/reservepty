'use client';

import { createClient } from '@/lib/supabase/client';
import type { Organization, OrganizationMember, Subscription, Entitlement } from '@/types/database';

const supabase = createClient();

// ============================================================================
// ORGANIZATION SERVICES
// ============================================================================

export interface OrganizationWithDetails extends Organization {
  subscription?: Subscription & {
    entitlements?: Entitlement[];
  };
  member_count?: number;
}

/**
 * Get current user's organizations
 */
export async function getUserOrganizations(): Promise<OrganizationWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      organization:organizations (
        *,
        subscription:subscriptions (
          *,
          entitlements (*)
        )
      )
    `)
    .eq('user_id', user.id);

  if (error) throw error;
  
  // Flatten the nested structure
  return data?.map(item => ({
    ...item.organization,
    subscription: item.organization?.subscription?.[0] || undefined,
  })) || [];
}

/**
 * Get organization by ID with full details
 */
export async function getOrganization(id: string): Promise<OrganizationWithDetails | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      subscription:subscriptions (
        *,
        entitlements (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return {
    ...data,
    subscription: data?.subscription?.[0] || undefined,
  };
}

/**
 * Create a new organization with subscription
 */
export async function createOrganization(input: {
  legalName: string;
  commercialName?: string;
  ruc?: string;
  dv?: string;
  billingEmail?: string;
  sections: ('planes' | 'helicopters' | 'residences' | 'boats')[];
  seatLimit?: number;
  isDevMode?: boolean;
}): Promise<Organization> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      legal_name: input.legalName,
      commercial_name: input.commercialName,
      ruc: input.ruc,
      dv: input.dv,
      billing_email: input.billingEmail,
    })
    .select()
    .single();

  if (orgError) throw orgError;

  // Add user as owner
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memberError) throw memberError;

  // Create subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      organization_id: org.id,
      status: input.isDevMode ? 'complimentary' : 'trial',
      seat_limit: input.seatLimit || (input.isDevMode ? 100 : 5),
      trial_ends_at: input.isDevMode ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (subError) throw subError;

  // Create entitlements for selected sections
  const entitlements = input.sections.map(section => ({
    subscription_id: subscription.id,
    section,
    is_active: true,
  }));

  const { error: entError } = await supabase
    .from('entitlements')
    .insert(entitlements);

  if (entError) throw entError;

  // Create default tiers
  const tiers = [
    { name: 'Principals', priority: 1, color: '#c8b273' },
    { name: 'Family', priority: 2, color: '#22c55e' },
    { name: 'Staff', priority: 3, color: '#3b82f6' },
  ];

  for (const tier of tiers) {
    const { data: tierData, error: tierError } = await supabase
      .from('tiers')
      .insert({
        organization_id: org.id,
        ...tier,
      })
      .select()
      .single();

    if (tierError) throw tierError;

    // Create tier rules
    const rules = tier.priority === 1 
      ? { requires_approval: false, can_override: true }
      : tier.priority === 2
        ? { max_days_per_month: 10, min_lead_time_hours: 72, requires_approval: false }
        : { max_days_per_month: 5, min_lead_time_hours: 168, requires_approval: true };

    await supabase.from('tier_rules').insert({
      tier_id: tierData.id,
      ...rules,
    });
  }

  return org;
}

/**
 * Update organization
 */
export async function updateOrganization(
  id: string,
  updates: Partial<{
    legal_name: string;
    commercial_name: string;
    ruc: string;
    dv: string;
    billing_email: string;
    logo_url: string;
  }>
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
 * Delete organization (owner only)
 */
export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// MEMBER SERVICES
// ============================================================================

export interface MemberWithProfile extends OrganizationMember {
  profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  tier?: {
    id: string;
    name: string;
    color: string;
    priority: number;
  };
}

/**
 * Get organization members with profiles
 */
export async function getOrganizationMembers(organizationId: string): Promise<MemberWithProfile[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      profile:profiles (
        email,
        first_name,
        last_name,
        avatar_url
      ),
      tier:tiers (
        id,
        name,
        color,
        priority
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Update member role or tier
 */
export async function updateMember(
  memberId: string,
  updates: Partial<{
    role: OrganizationMember['role'];
    tier_id: string | null;
  }>
): Promise<OrganizationMember> {
  const { data, error } = await supabase
    .from('organization_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove member from organization
 */
export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

// ============================================================================
// INVITATION SERVICES
// ============================================================================

export interface InvitationWithInviter {
  id: string;
  email: string;
  role: OrganizationMember['role'];
  tier_id: string | null;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  inviter?: {
    first_name: string | null;
    last_name: string | null;
  };
}

/**
 * Get organization invitations
 */
export async function getOrganizationInvitations(organizationId: string): Promise<InvitationWithInviter[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      id,
      email,
      role,
      tier_id,
      expires_at,
      created_at,
      accepted_at,
      inviter:profiles!invited_by (
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create invitation
 */
export async function createInvitation(input: {
  organizationId: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  tierId?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('invitations')
    .insert({
      organization_id: input.organizationId,
      email: input.email.toLowerCase(),
      role: input.role,
      tier_id: input.tierId,
      invited_by: user.id,
    });

  if (error) throw error;

  // TODO: Send invitation email via Edge Function
}

/**
 * Cancel invitation
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId);

  if (error) throw error;
}

/**
 * Accept invitation (by token)
 */
export async function acceptInvitation(token: string): Promise<{
  organizationId: string;
  organizationName: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get invitation
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .select(`
      *,
      organization:organizations (
        id,
        legal_name,
        commercial_name
      )
    `)
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (invError) throw new Error('Invalid or expired invitation');

  // Add user to organization
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
      tier_id: invitation.tier_id,
    });

  if (memberError) throw memberError;

  // Mark invitation as accepted
  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);

  return {
    organizationId: invitation.organization_id,
    organizationName: invitation.organization?.commercial_name || invitation.organization?.legal_name || 'Organization',
  };
}

// ============================================================================
// SUBSCRIPTION SERVICES
// ============================================================================

/**
 * Get organization subscription with entitlements
 */
export async function getSubscription(organizationId: string): Promise<Subscription & { entitlements: Entitlement[] } | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      entitlements (*)
    `)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Check if organization has access to a section
 */
export async function hasSection(organizationId: string, section: 'planes' | 'helicopters' | 'residences' | 'boats'): Promise<boolean> {
  const subscription = await getSubscription(organizationId);
  if (!subscription) return false;

  return subscription.entitlements?.some(e => e.section === section && e.is_active) || false;
}

/**
 * Get active sections for organization
 */
export async function getActiveSections(organizationId: string): Promise<('planes' | 'helicopters' | 'residences' | 'boats')[]> {
  const subscription = await getSubscription(organizationId);
  if (!subscription) return [];

  return subscription.entitlements
    ?.filter(e => e.is_active)
    .map(e => e.section) || [];
}
