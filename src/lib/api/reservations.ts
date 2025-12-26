'use client';

import { createClient } from '@/lib/supabase/client';
import type { Reservation, ReservationStatus, Asset, Json } from '@/types/database';

const supabase = createClient();

// ============================================================================
// TYPES
// ============================================================================

export interface ReservationWithDetails extends Reservation {
  asset?: {
    id: string;
    name: string;
    section: string;
    primary_photo_url: string | null;
  };
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: ReservationStatus;
  assetId: string;
  assetName: string;
  section: string;
  userId: string;
  userName: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: {
    id: string;
    start: Date;
    end: Date;
    userName: string;
    status: ReservationStatus;
  }[];
}

// ============================================================================
// RESERVATION CRUD
// ============================================================================

/**
 * Get reservations for an organization
 */
export async function getReservations(
  organizationId: string,
  options?: {
    assetId?: string;
    userId?: string;
    status?: ReservationStatus | ReservationStatus[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<ReservationWithDetails[]> {
  let query = supabase
    .from('reservations')
    .select(`
      *,
      asset:assets (
        id,
        name,
        section,
        primary_photo_url
      ),
      user:profiles (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .order('start_datetime', { ascending: true });

  if (options?.assetId) {
    query = query.eq('asset_id', options.assetId);
  }

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options?.status) {
    if (Array.isArray(options.status)) {
      query = query.in('status', options.status);
    } else {
      query = query.eq('status', options.status);
    }
  }

  if (options?.startDate) {
    query = query.gte('start_datetime', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('end_datetime', options.endDate.toISOString());
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as unknown as ReservationWithDetails[];
}

/**
 * Get a single reservation by ID
 */
export async function getReservation(id: string): Promise<ReservationWithDetails | null> {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      asset:assets (
        id,
        name,
        section,
        primary_photo_url
      ),
      user:profiles (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as unknown as ReservationWithDetails;
}

/**
 * Create a new reservation
 */
export async function createReservation(input: {
  organizationId: string;
  assetId: string;
  title?: string;
  startDatetime: Date;
  endDatetime: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
  autoApprove?: boolean;
}): Promise<Reservation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check for conflicts
  const availability = await checkAvailability(
    input.assetId,
    input.startDatetime,
    input.endDatetime
  );

  if (!availability.available) {
    throw new Error('Asset is not available for the selected time period');
  }

  // Determine initial status based on tier rules
  // For now, use autoApprove flag or default to pending
  const status: ReservationStatus = input.autoApprove ? 'approved' : 'pending';

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      organization_id: input.organizationId,
      asset_id: input.assetId,
      user_id: user.id,
      title: input.title,
      start_datetime: input.startDatetime.toISOString(),
      end_datetime: input.endDatetime.toISOString(),
      notes: input.notes,
      metadata: (input.metadata as Json) || {},
      status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a reservation
 */
export async function updateReservation(
  id: string,
  updates: Partial<{
    title: string;
    start_datetime: Date;
    end_datetime: Date;
    notes: string;
    metadata: Record<string, unknown>;
  }>
): Promise<Reservation> {
  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata as Json;
  if (updates.start_datetime) updateData.start_datetime = updates.start_datetime.toISOString();
  if (updates.end_datetime) updateData.end_datetime = updates.end_datetime.toISOString();

  const { data, error } = await supabase
    .from('reservations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cancel a reservation
 */
export async function cancelReservation(id: string): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'canceled' })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Approve a reservation
 */
export async function approveReservation(id: string): Promise<Reservation> {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'approved' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reject a reservation
 */
export async function rejectReservation(id: string): Promise<Reservation> {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// AVAILABILITY & CONFLICT CHECKING
// ============================================================================

/**
 * Check if an asset is available for a time period
 */
export async function checkAvailability(
  assetId: string,
  startDatetime: Date,
  endDatetime: Date,
  excludeReservationId?: string
): Promise<AvailabilityResult> {
  let query = supabase
    .from('reservations')
    .select(`
      id,
      start_datetime,
      end_datetime,
      status,
      user:profiles (
        first_name,
        last_name
      )
    `)
    .eq('asset_id', assetId)
    .in('status', ['pending', 'approved'])
    .or(`and(start_datetime.lt.${endDatetime.toISOString()},end_datetime.gt.${startDatetime.toISOString()})`);

  if (excludeReservationId) {
    query = query.neq('id', excludeReservationId);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Cast to proper type
  interface ConflictRow {
    id: string;
    start_datetime: string;
    end_datetime: string;
    status: string;
    user?: { first_name?: string | null; last_name?: string | null } | null;
  }
  
  const rows = (data || []) as unknown as ConflictRow[];
  
  const conflicts = rows.map(r => ({
    id: r.id,
    start: new Date(r.start_datetime),
    end: new Date(r.end_datetime),
    userName: r.user ? `${r.user.first_name || ''} ${r.user.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
    status: r.status as ReservationStatus,
  }));

  return {
    available: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Get available time slots for an asset on a specific date
 */
export async function getAvailableSlots(
  assetId: string,
  date: Date,
  slotDurationMinutes: number = 60
): Promise<{ start: Date; end: Date }[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get reservations for this day
  const { data: reservations } = await supabase
    .from('reservations')
    .select('start_datetime, end_datetime')
    .eq('asset_id', assetId)
    .in('status', ['pending', 'approved'])
    .gte('start_datetime', startOfDay.toISOString())
    .lte('end_datetime', endOfDay.toISOString())
    .order('start_datetime', { ascending: true });

  const slots: { start: Date; end: Date }[] = [];
  let currentTime = new Date(startOfDay);
  currentTime.setHours(8, 0, 0, 0); // Start at 8 AM

  const endTime = new Date(startOfDay);
  endTime.setHours(20, 0, 0, 0); // End at 8 PM

  const bookedSlots = reservations?.map(r => ({
    start: new Date(r.start_datetime),
    end: new Date(r.end_datetime),
  })) || [];

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + slotDurationMinutes * 60 * 1000);
    
    // Check if slot overlaps with any booked slot
    const isBlocked = bookedSlots.some(
      b => currentTime < b.end && slotEnd > b.start
    );

    if (!isBlocked && slotEnd <= endTime) {
      slots.push({
        start: new Date(currentTime),
        end: new Date(slotEnd),
      });
    }

    currentTime = slotEnd;
  }

  return slots;
}

// ============================================================================
// CALENDAR HELPERS
// ============================================================================

/**
 * Get reservations formatted for calendar view
 */
export async function getCalendarEvents(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  section?: string
): Promise<CalendarEvent[]> {
  const query = supabase
    .from('reservations')
    .select(`
      id,
      title,
      start_datetime,
      end_datetime,
      status,
      asset:assets (
        id,
        name,
        section
      ),
      user:profiles (
        id,
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .gte('start_datetime', startDate.toISOString())
    .lte('end_datetime', endDate.toISOString())
    .neq('status', 'canceled');

  const { data, error } = await query;
  if (error) throw error;

  // Cast to proper type
  interface CalendarRow {
    id: string;
    title: string | null;
    start_datetime: string;
    end_datetime: string;
    status: string;
    asset?: { id?: string; name?: string; section?: string } | null;
    user?: { id?: string; first_name?: string | null; last_name?: string | null } | null;
  }
  
  const rows = (data || []) as unknown as CalendarRow[];

  let events = rows.map(r => ({
    id: r.id,
    title: r.title || r.asset?.name || 'Booking',
    start: new Date(r.start_datetime),
    end: new Date(r.end_datetime),
    status: r.status as ReservationStatus,
    assetId: r.asset?.id || '',
    assetName: r.asset?.name || 'Unknown Asset',
    section: r.asset?.section || '',
    userId: r.user?.id || '',
    userName: r.user 
      ? `${r.user.first_name || ''} ${r.user.last_name || ''}`.trim() || 'Unknown' 
      : 'Unknown',
  }));

  // Filter by section if provided
  if (section && section !== 'all') {
    events = events.filter(e => e.section === section);
  }

  return events;
}

/**
 * Get upcoming reservations for dashboard
 */
export async function getUpcomingReservations(
  organizationId: string,
  limit: number = 5
): Promise<ReservationWithDetails[]> {
  return getReservations(organizationId, {
    status: ['pending', 'approved'],
    startDate: new Date(),
    limit,
  });
}

/**
 * Get recent reservations (including past)
 */
export async function getRecentReservations(
  organizationId: string,
  limit: number = 10
): Promise<ReservationWithDetails[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      asset:assets (
        id,
        name,
        section,
        primary_photo_url
      ),
      user:profiles (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as unknown as ReservationWithDetails[];
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get reservation statistics for dashboard
 */
export async function getReservationStats(organizationId: string): Promise<{
  total: number;
  pending: number;
  approved: number;
  thisMonth: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total and by status
  const { data: statusCounts } = await supabase
    .from('reservations')
    .select('status')
    .eq('organization_id', organizationId);

  const stats = {
    total: statusCounts?.length || 0,
    pending: statusCounts?.filter(r => r.status === 'pending').length || 0,
    approved: statusCounts?.filter(r => r.status === 'approved').length || 0,
    thisMonth: 0,
  };

  // This month
  const { count: monthCount } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfMonth.toISOString());

  stats.thisMonth = monthCount || 0;

  return stats;
}

/**
 * Get booking count by section for a time period
 */
export async function getBookingCountBySection(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, number>> {
  let query = supabase
    .from('reservations')
    .select(`
      asset:assets (
        section
      )
    `)
    .eq('organization_id', organizationId)
    .in('status', ['pending', 'approved']);

  if (startDate) {
    query = query.gte('start_datetime', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('end_datetime', endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  const counts: Record<string, number> = {
    planes: 0,
    helicopters: 0,
    residences: 0,
    boats: 0,
  };

  // Cast data to proper type
  const reservations = (data || []) as unknown as Array<{ asset?: { section?: string } }>;
  
  reservations.forEach(r => {
    const section = r.asset?.section;
    if (section && section in counts) {
      counts[section] = (counts[section] || 0) + 1;
    }
  });

  return counts;
}
