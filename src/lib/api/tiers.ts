'use client';

import { createClient } from '@/lib/supabase/client';
import type { Tier, TierRule } from '@/types/database';

const supabase = createClient();

// ============================================================================
// TYPES
// ============================================================================

export interface TierWithRules extends Tier {
  rules?: TierRule;
  member_count?: number;
}

export interface TierRuleInput {
  maxDaysPerMonth?: number | null;
  maxConsecutiveDays?: number | null;
  minLeadTimeHours?: number | null;
  requiresApproval: boolean;
  canOverride?: boolean;
}

// ============================================================================
// TIER CRUD
// ============================================================================

/**
 * Get all tiers for an organization
 */
export async function getTiers(
  organizationId: string,
  includeMemberCount: boolean = false
): Promise<TierWithRules[]> {
  const { data, error } = await supabase
    .from('tiers')
    .select(`
      *,
      rules:tier_rules (*)
    `)
    .eq('organization_id', organizationId)
    .order('priority', { ascending: true });

  if (error) throw error;

  // Cast to proper type
  const tiersData = (data || []) as unknown as Array<Tier & { rules?: TierRule[] }>;
  
  let tiers: TierWithRules[] = tiersData.map(t => ({
    ...t,
    rules: t.rules?.[0] || undefined,
  }));

  // Get member counts if requested
  if (includeMemberCount) {
    const tierIds = tiers.map(t => t.id);
    
    const { data: members } = await supabase
      .from('organization_members')
      .select('tier_id')
      .in('tier_id', tierIds);

    const countMap = new Map<string, number>();
    members?.forEach(m => {
      if (m.tier_id) {
        countMap.set(m.tier_id, (countMap.get(m.tier_id) || 0) + 1);
      }
    });

    tiers = tiers.map(t => ({
      ...t,
      member_count: countMap.get(t.id) || 0,
    }));
  }

  return tiers;
}

/**
 * Get a single tier by ID
 */
export async function getTier(id: string): Promise<TierWithRules | null> {
  const { data, error } = await supabase
    .from('tiers')
    .select(`
      *,
      rules:tier_rules (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Cast to proper type
  const tierData = data as unknown as Tier & { rules?: TierRule[] };
  
  return {
    ...tierData,
    rules: tierData.rules?.[0] || undefined,
  };
}

/**
 * Create a new tier with rules
 */
export async function createTier(input: {
  organizationId: string;
  name: string;
  color: string;
  priority?: number;
  rules?: TierRuleInput;
}): Promise<TierWithRules> {
  // Get the next priority if not specified
  let priority = input.priority;
  if (priority === undefined) {
    const { data: existing } = await supabase
      .from('tiers')
      .select('priority')
      .eq('organization_id', input.organizationId)
      .order('priority', { ascending: false })
      .limit(1);

    priority = (existing?.[0]?.priority ?? 0) + 1;
  }

  // Create tier
  const { data: tier, error: tierError } = await supabase
    .from('tiers')
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      color: input.color,
      priority,
    })
    .select()
    .single();

  if (tierError) throw tierError;

  // Create rules
  const rules = input.rules || { requiresApproval: false };
  const { data: tierRule, error: ruleError } = await supabase
    .from('tier_rules')
    .insert({
      tier_id: tier.id,
      max_days_per_month: rules.maxDaysPerMonth,
      max_consecutive_days: rules.maxConsecutiveDays,
      min_lead_time_hours: rules.minLeadTimeHours ?? 0,
      requires_approval: rules.requiresApproval,
      can_override: rules.canOverride ?? false,
    })
    .select()
    .single();

  if (ruleError) throw ruleError;

  return {
    ...tier,
    rules: tierRule,
  };
}

/**
 * Update a tier
 */
export async function updateTier(
  id: string,
  updates: Partial<{
    name: string;
    color: string;
    priority: number;
  }>
): Promise<Tier> {
  const { data, error } = await supabase
    .from('tiers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update tier rules
 */
export async function updateTierRules(
  tierId: string,
  rules: TierRuleInput
): Promise<TierRule> {
  const { data: existing } = await supabase
    .from('tier_rules')
    .select('id')
    .eq('tier_id', tierId)
    .single();

  if (existing) {
    // Update existing rules
    const { data, error } = await supabase
      .from('tier_rules')
      .update({
        max_days_per_month: rules.maxDaysPerMonth,
        max_consecutive_days: rules.maxConsecutiveDays,
        min_lead_time_hours: rules.minLeadTimeHours ?? 0,
        requires_approval: rules.requiresApproval,
        can_override: rules.canOverride ?? false,
      })
      .eq('tier_id', tierId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new rules
    const { data, error } = await supabase
      .from('tier_rules')
      .insert({
        tier_id: tierId,
        max_days_per_month: rules.maxDaysPerMonth,
        max_consecutive_days: rules.maxConsecutiveDays,
        min_lead_time_hours: rules.minLeadTimeHours ?? 0,
        requires_approval: rules.requiresApproval,
        can_override: rules.canOverride ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Delete a tier
 */
export async function deleteTier(id: string): Promise<void> {
  // First, remove tier from all members
  await supabase
    .from('organization_members')
    .update({ tier_id: null })
    .eq('tier_id', id);

  // Then delete the tier (rules will be deleted via CASCADE)
  const { error } = await supabase
    .from('tiers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Reorder tiers (update priorities)
 */
export async function reorderTiers(tierIds: string[]): Promise<void> {
  for (let i = 0; i < tierIds.length; i++) {
    await supabase
      .from('tiers')
      .update({ priority: i + 1 })
      .eq('id', tierIds[i]);
  }
}

// ============================================================================
// TIER VALIDATION
// ============================================================================

/**
 * Check if a user's booking request meets tier requirements
 */
export async function validateBookingAgainstTier(
  userId: string,
  organizationId: string,
  assetId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  valid: boolean;
  requiresApproval: boolean;
  errors: string[];
}> {
  // Get user's membership with tier
  const { data: membership } = await supabase
    .from('organization_members')
    .select(`
      tier_id,
      tier:tiers (
        name,
        priority,
        rules:tier_rules (*)
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (!membership) {
    return {
      valid: false,
      requiresApproval: true,
      errors: ['User is not a member of this organization'],
    };
  }

  // Cast membership to proper type - Supabase returns tier as array from join
  interface MembershipWithTier {
    tier_id: string | null;
    tier: Array<{
      name: string;
      priority: number;
      rules: TierRule[];
    }> | null;
  }
  
  const memberData = membership as unknown as MembershipWithTier;
  const tier = memberData.tier?.[0];
  const rules = tier?.rules?.[0];

  if (!rules) {
    // No rules = allowed with approval
    return {
      valid: true,
      requiresApproval: true,
      errors: [],
    };
  }

  const errors: string[] = [];
  const now = new Date();
  const bookingDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check lead time
  if (rules.min_lead_time_hours) {
    const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilStart < rules.min_lead_time_hours) {
      errors.push(
        `Bookings require at least ${rules.min_lead_time_hours} hours advance notice`
      );
    }
  }

  // Check consecutive days limit
  if (rules.max_consecutive_days && bookingDays > rules.max_consecutive_days) {
    errors.push(
      `Maximum ${rules.max_consecutive_days} consecutive days allowed for your tier`
    );
  }

  // Check monthly limit
  if (rules.max_days_per_month) {
    const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const { data: monthlyBookings } = await supabase
      .from('reservations')
      .select('start_datetime, end_datetime')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'approved'])
      .gte('start_datetime', startOfMonth.toISOString())
      .lte('end_datetime', endOfMonth.toISOString());

    let usedDays = 0;
    monthlyBookings?.forEach(booking => {
      const start = new Date(booking.start_datetime);
      const end = new Date(booking.end_datetime);
      usedDays += Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });

    if (usedDays + bookingDays > rules.max_days_per_month) {
      errors.push(
        `You have ${rules.max_days_per_month - usedDays} days remaining this month (limit: ${rules.max_days_per_month})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    requiresApproval: rules.requires_approval,
    errors,
  };
}

/**
 * Check if a tier can override another tier's booking
 */
export async function canOverrideBooking(
  userId: string,
  organizationId: string,
  existingBookingUserId: string
): Promise<boolean> {
  // Get both users' tier priorities
  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      user_id,
      tier:tiers (
        priority,
        rules:tier_rules (
          can_override
        )
      )
    `)
    .eq('organization_id', organizationId)
    .in('user_id', [userId, existingBookingUserId]);

  if (!members || members.length !== 2) return false;

  // Cast to proper type - Supabase returns tier as array from join
  interface MemberWithTierPriority {
    user_id: string;
    tier: Array<{
      priority: number;
      rules: Array<{ can_override: boolean }>;
    }> | null;
  }
  
  const membersData = members as unknown as MemberWithTierPriority[];
  const requestingUser = membersData.find(m => m.user_id === userId);
  const existingUser = membersData.find(m => m.user_id === existingBookingUserId);

  const requestingTier = requestingUser?.tier?.[0];
  const existingTier = existingUser?.tier?.[0];

  if (!requestingTier || !existingTier) return false;

  // Lower priority number = higher priority (1 is highest)
  const canOverride = requestingTier.rules?.[0]?.can_override;
  const hasHigherPriority = requestingTier.priority < existingTier.priority;

  return canOverride && hasHigherPriority;
}
