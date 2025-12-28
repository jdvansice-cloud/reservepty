// Utility functions for checking and enforcing booking rules

export interface BookingRule {
  id: string;
  tier_id: string;
  name: string;
  description: string | null;
  rule_type: 'date_range' | 'consecutive_booking' | 'concurrent_booking' | 'lead_time' | 'custom';
  conditions: any;
  requires_approval: boolean;
  approval_type: 'any_approver' | 'all_principals' | 'tier_members' | 'specific_users';
  approver_tier_id: string | null;
  is_override: boolean;
  priority: number;
  applies_to_all_assets: boolean;
  is_active: boolean;
}

export interface RuleCheckResult {
  ruleId: string;
  ruleName: string;
  ruleDescription: string | null;
  triggered: boolean;
  message: string;
  requiresApproval: boolean;
  approvalType: string;
  approverTierId: string | null;
}

/**
 * Check if a date range rule applies to a booking
 */
export function checkDateRangeRule(
  rule: BookingRule,
  startDate: Date,
  endDate: Date
): boolean {
  const startMonthDay = rule.conditions?.start_month_day;
  const endMonthDay = rule.conditions?.end_month_day;
  
  if (!startMonthDay || !endMonthDay) return false;

  const bookingStart = `${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
  const bookingEnd = `${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  // Handle year wrap (Dec to Jan)
  if (startMonthDay > endMonthDay) {
    // Rule spans year boundary (e.g., 12-08 to 01-06)
    return bookingStart >= startMonthDay || bookingStart <= endMonthDay ||
           bookingEnd >= startMonthDay || bookingEnd <= endMonthDay;
  } else {
    // Normal date range
    return (bookingStart >= startMonthDay && bookingStart <= endMonthDay) ||
           (bookingEnd >= startMonthDay && bookingEnd <= endMonthDay);
  }
}

/**
 * Check if a consecutive booking rule applies
 * This requires checking existing reservations
 */
export function checkConsecutiveBookingRule(
  rule: BookingRule,
  startDate: Date,
  existingReservations: Array<{ start_datetime: string; end_datetime: string; asset_id: string }>,
  assetId: string
): boolean {
  const count = rule.conditions?.count || 2;
  const unit = rule.conditions?.unit || 'weekends';

  // Get asset's reservations sorted by date
  const assetReservations = existingReservations
    .filter(r => r.asset_id === assetId)
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  if (unit === 'weekends') {
    // Check for consecutive weekends
    const bookingWeekend = getWeekendNumber(startDate);
    let consecutiveCount = 1;

    for (const res of assetReservations) {
      const resStart = new Date(res.start_datetime);
      const resWeekend = getWeekendNumber(resStart);
      
      // Check if previous weekend
      if (bookingWeekend - resWeekend === 1) {
        consecutiveCount++;
      }
    }

    return consecutiveCount >= count;
  }

  return false;
}

/**
 * Check if a concurrent booking rule applies
 * User wants to book multiple assets same period
 */
export function checkConcurrentBookingRule(
  rule: BookingRule,
  startDate: Date,
  endDate: Date,
  existingReservations: Array<{ start_datetime: string; end_datetime: string; asset_id: string; user_id: string }>,
  userId: string,
  assetId: string
): { triggered: boolean; canRequest: boolean; message: string } {
  const maxAssets = rule.conditions?.max_assets || 2;
  const minDaysBefore = rule.conditions?.min_request_days_before || 0;

  // Find user's bookings that overlap with this period
  const overlappingBookings = existingReservations.filter(r => {
    if (r.user_id !== userId || r.asset_id === assetId) return false;
    
    const resStart = new Date(r.start_datetime);
    const resEnd = new Date(r.end_datetime);
    
    // Check overlap
    return startDate < resEnd && endDate > resStart;
  });

  const totalAssets = overlappingBookings.length + 1; // +1 for current booking

  if (totalAssets >= maxAssets) {
    // Check if request is within allowed time window
    const now = new Date();
    const daysUntilBooking = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilBooking > minDaysBefore) {
      return {
        triggered: true,
        canRequest: false,
        message: `No puedes solicitar una segunda propiedad hasta ${minDaysBefore} días antes del evento`,
      };
    }

    return {
      triggered: true,
      canRequest: true,
      message: `Reserva de ${totalAssets} propiedades simultáneas requiere aprobación`,
    };
  }

  return { triggered: false, canRequest: true, message: '' };
}

/**
 * Check if lead time rule applies
 */
export function checkLeadTimeRule(
  rule: BookingRule,
  startDate: Date
): boolean {
  const minHours = rule.conditions?.min_hours || 0;
  const now = new Date();
  const hoursUntil = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntil < minHours;
}

/**
 * Get ISO week number for weekend detection
 */
function getWeekendNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Main function to check all applicable rules for a booking
 */
export async function checkBookingRules(
  organizationId: string,
  assetId: string,
  userId: string,
  userTierId: string | null,
  startDate: Date,
  endDate: Date,
  rules: BookingRule[],
  existingReservations: Array<{ start_datetime: string; end_datetime: string; asset_id: string; user_id: string }>,
  ruleAssets: Array<{ rule_id: string; asset_id: string }>
): RuleCheckResult[] {
  const results: RuleCheckResult[] = [];

  // Filter rules for user's tier
  const applicableRules = rules.filter(rule => {
    if (!rule.is_active) return false;
    if (rule.tier_id !== userTierId) return false;
    
    // Check if rule applies to this asset
    if (!rule.applies_to_all_assets) {
      const ruleApplies = ruleAssets.some(ra => ra.rule_id === rule.id && ra.asset_id === assetId);
      if (!ruleApplies) return false;
    }
    
    return true;
  });

  // Sort by priority (override rules first, then by priority number)
  applicableRules.sort((a, b) => {
    if (a.is_override && !b.is_override) return -1;
    if (!a.is_override && b.is_override) return 1;
    return a.priority - b.priority;
  });

  for (const rule of applicableRules) {
    let triggered = false;
    let message = '';

    switch (rule.rule_type) {
      case 'date_range':
        triggered = checkDateRangeRule(rule, startDate, endDate);
        if (triggered) {
          message = `Fechas del ${rule.conditions?.start_month_day} al ${rule.conditions?.end_month_day} requieren aprobación`;
        }
        break;

      case 'consecutive_booking':
        triggered = checkConsecutiveBookingRule(rule, startDate, existingReservations, assetId);
        if (triggered) {
          message = `${rule.conditions?.count} ${rule.conditions?.unit === 'weekends' ? 'fines de semana' : 'días'} consecutivos requieren aprobación`;
        }
        break;

      case 'concurrent_booking':
        const concurrentResult = checkConcurrentBookingRule(
          rule, startDate, endDate, existingReservations, userId, assetId
        );
        triggered = concurrentResult.triggered;
        message = concurrentResult.message;
        if (triggered && !concurrentResult.canRequest) {
          // Block the booking
          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleDescription: rule.description,
            triggered: true,
            message: message,
            requiresApproval: false, // Can't even request
            approvalType: rule.approval_type,
            approverTierId: rule.approver_tier_id,
          });
          continue;
        }
        break;

      case 'lead_time':
        triggered = checkLeadTimeRule(rule, startDate);
        if (triggered) {
          message = `Se requieren ${rule.conditions?.min_hours} horas de anticipación`;
        }
        break;

      case 'custom':
        // Custom rules always trigger if active
        triggered = true;
        message = rule.conditions?.description || 'Regla personalizada requiere aprobación';
        break;
    }

    if (triggered) {
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleDescription: rule.description,
        triggered: true,
        message: message,
        requiresApproval: rule.requires_approval,
        approvalType: rule.approval_type,
        approverTierId: rule.approver_tier_id,
      });
    }
  }

  return results;
}

/**
 * Create approval requests for a reservation based on triggered rules
 */
export async function createApprovalRequests(
  supabaseUrl: string,
  accessToken: string,
  apiKey: string,
  organizationId: string,
  reservationId: string,
  triggeredRules: RuleCheckResult[],
  principalTierUsers: Array<{ user_id: string }>,
  tierMembers: Record<string, Array<{ user_id: string }>>
): Promise<void> {
  const approvalsToCreate: Array<{
    organization_id: string;
    reservation_id: string;
    rule_id: string;
    user_id: string;
  }> = [];

  for (const rule of triggeredRules) {
    if (!rule.requiresApproval) continue;

    let approvers: string[] = [];

    switch (rule.approvalType) {
      case 'all_principals':
        // All users in the principal (priority 1) tier must approve
        approvers = principalTierUsers.map(u => u.user_id);
        break;

      case 'tier_members':
        // All users in the specified tier must approve
        if (rule.approverTierId && tierMembers[rule.approverTierId]) {
          approvers = tierMembers[rule.approverTierId].map(u => u.user_id);
        }
        break;

      case 'any_approver':
      default:
        // For any_approver, we still need someone to approve
        // Default to principal tier
        approvers = principalTierUsers.map(u => u.user_id);
        break;
    }

    // Create approval request for each approver
    for (const userId of approvers) {
      approvalsToCreate.push({
        organization_id: organizationId,
        reservation_id: reservationId,
        rule_id: rule.ruleId,
        user_id: userId,
      });
    }
  }

  if (approvalsToCreate.length > 0) {
    await fetch(`${supabaseUrl}/rest/v1/rule_approvals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(approvalsToCreate),
    });
  }
}
