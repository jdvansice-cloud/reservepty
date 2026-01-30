'use client';

import { BaseRepository, FilterCondition } from './base';
import type { Database } from '@/types/database';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api.types';
import { createSuccessResponse, createErrorResponse } from '@/lib/types/api.types';

// ============================================================================
// TYPES
// ============================================================================

type Reservation = Database['public']['Tables']['reservations']['Row'];
type ReservationInsert = Database['public']['Tables']['reservations']['Insert'];
type ReservationUpdate = Database['public']['Tables']['reservations']['Update'];
type ReservationStatus = Database['public']['Enums']['reservation_status'];
type AssetSection = Database['public']['Enums']['asset_section'];

export interface ReservationWithDetails extends Reservation {
  asset?: {
    id: string;
    name: string;
    section: AssetSection;
    primary_photo_url: string | null;
  };
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  approved_by_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface ReservationQueryOptions {
  organizationId: string;
  assetId?: string;
  userId?: string;
  status?: ReservationStatus | ReservationStatus[];
  startAfter?: string;
  endBefore?: string;
  page?: number;
  pageSize?: number;
}

export interface CalendarEvent {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_section: AssetSection;
  user_id: string;
  user_name: string;
  title: string | null;
  start_datetime: string;
  end_datetime: string;
  status: ReservationStatus;
  notes: string | null;
  guest_count: number | null;
  metadata: unknown;
}

export interface AvailabilityResult {
  is_available: boolean;
  conflicting_reservations: Array<{
    id: string;
    title: string;
    start_datetime: string;
    end_datetime: string;
    status: ReservationStatus;
    booked_by: string;
  }>;
  blackout_conflicts: Array<{
    id: string;
    start_date: string;
    end_date: string;
    reason: string | null;
  }>;
}

export interface ValidationResult {
  is_valid: boolean;
  error_code: string | null;
  error_message: string | null;
  requires_approval: boolean;
}

// ============================================================================
// RESERVATION REPOSITORY
// ============================================================================

export class ReservationRepository extends BaseRepository<'reservations'> {
  constructor() {
    super('reservations');
  }

  /**
   * Find reservations with filters
   */
  async findByOrganization(
    options: ReservationQueryOptions
  ): Promise<PaginatedResponse<Reservation>> {
    const filters: FilterCondition<Reservation>[] = [
      { field: 'organization_id', operator: 'eq', value: options.organizationId },
    ];

    if (options.assetId) {
      filters.push({ field: 'asset_id', operator: 'eq', value: options.assetId });
    }

    if (options.userId) {
      filters.push({ field: 'user_id', operator: 'eq', value: options.userId });
    }

    if (options.status) {
      if (Array.isArray(options.status)) {
        filters.push({ field: 'status', operator: 'in', value: options.status });
      } else {
        filters.push({ field: 'status', operator: 'eq', value: options.status });
      }
    }

    if (options.startAfter) {
      filters.push({ field: 'end_datetime', operator: 'gte', value: options.startAfter });
    }

    if (options.endBefore) {
      filters.push({ field: 'start_datetime', operator: 'lte', value: options.endBefore });
    }

    return this.findMany({
      filters,
      pagination: {
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      },
      orderBy: {
        column: 'start_datetime',
        ascending: true,
      },
    });
  }

  /**
   * Find reservation with full details
   */
  async findByIdWithDetails(id: string): Promise<ApiResponse<ReservationWithDetails>> {
    try {
      const { data, error } = await this.supabase
        .from('reservations')
        .select(`
          *,
          asset:assets(id, name, section, primary_photo_url),
          user:profiles!reservations_user_id_fkey(id, email, first_name, last_name),
          approved_by_user:profiles!reservations_approved_by_fkey(id, first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('NOT_FOUND', 'Reservation not found');
        }
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse(data as unknown as ReservationWithDetails);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Get calendar events (calls optimized database function)
   */
  async getCalendarEvents(
    organizationId: string,
    assetIds?: string[],
    startDate?: string,
    endDate?: string,
    statuses: ReservationStatus[] = ['approved', 'pending']
  ): Promise<ApiResponse<CalendarEvent[]>> {
    try {
      const { data, error } = await this.supabase.rpc('get_calendar_events', {
        p_organization_id: organizationId,
        p_asset_ids: assetIds || null,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_statuses: statuses,
      });

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse((data || []) as CalendarEvent[]);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Check asset availability (calls optimized database function)
   */
  async checkAvailability(
    assetId: string,
    startDatetime: string,
    endDatetime: string,
    excludeReservationId?: string
  ): Promise<ApiResponse<AvailabilityResult>> {
    try {
      const { data, error } = await this.supabase.rpc('check_asset_availability', {
        p_asset_id: assetId,
        p_start_datetime: startDatetime,
        p_end_datetime: endDatetime,
        p_exclude_reservation_id: excludeReservationId || null,
      });

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      // RPC returns array with single row
      const result = Array.isArray(data) ? data[0] : data;
      return createSuccessResponse(result as AvailabilityResult);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Validate reservation against tier rules (calls database function)
   */
  async validateReservation(
    userId: string,
    assetId: string,
    startDatetime: string,
    endDatetime: string,
    excludeReservationId?: string
  ): Promise<ApiResponse<ValidationResult>> {
    try {
      const { data, error } = await this.supabase.rpc('validate_reservation', {
        p_user_id: userId,
        p_asset_id: assetId,
        p_start_datetime: startDatetime,
        p_end_datetime: endDatetime,
        p_exclude_reservation_id: excludeReservationId || null,
      });

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      const result = Array.isArray(data) ? data[0] : data;
      return createSuccessResponse(result as ValidationResult);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Approve a reservation
   * Note: approval metadata is stored in the metadata JSON field
   */
  async approve(
    reservationId: string,
    approvedBy: string,
    notes?: string
  ): Promise<ApiResponse<Reservation>> {
    // First get the current reservation to merge metadata
    const current = await this.findById(reservationId);
    if (!current.success || !current.data) {
      return current;
    }

    const currentMetadata = (current.data.metadata as Record<string, unknown>) || {};

    return this.update(reservationId, {
      status: 'approved',
      notes: notes || current.data.notes,
      metadata: {
        ...currentMetadata,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      } as unknown as Database['public']['Tables']['reservations']['Update']['metadata'],
    });
  }

  /**
   * Reject a reservation
   * Note: rejection reason is stored in the metadata JSON field
   */
  async reject(
    reservationId: string,
    reason: string
  ): Promise<ApiResponse<Reservation>> {
    const current = await this.findById(reservationId);
    if (!current.success || !current.data) {
      return current;
    }

    const currentMetadata = (current.data.metadata as Record<string, unknown>) || {};

    return this.update(reservationId, {
      status: 'rejected',
      metadata: {
        ...currentMetadata,
        rejected_reason: reason,
        rejected_at: new Date().toISOString(),
      } as unknown as Database['public']['Tables']['reservations']['Update']['metadata'],
    });
  }

  /**
   * Cancel a reservation
   */
  async cancel(reservationId: string): Promise<ApiResponse<Reservation>> {
    const current = await this.findById(reservationId);
    if (!current.success || !current.data) {
      return current;
    }

    const currentMetadata = (current.data.metadata as Record<string, unknown>) || {};

    return this.update(reservationId, {
      status: 'canceled',
      metadata: {
        ...currentMetadata,
        canceled_at: new Date().toISOString(),
      } as unknown as Database['public']['Tables']['reservations']['Update']['metadata'],
    });
  }

  /**
   * Get user's upcoming reservations
   */
  async getUserUpcoming(
    userId: string,
    organizationId: string,
    limit = 5
  ): Promise<ApiResponse<ReservationWithDetails[]>> {
    try {
      const { data, error } = await this.supabase
        .from('reservations')
        .select(`
          *,
          asset:assets(id, name, section, primary_photo_url)
        `)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .in('status', ['approved', 'pending'])
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true })
        .limit(limit);

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse((data || []) as unknown as ReservationWithDetails[]);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Get pending approvals count
   */
  async getPendingCount(organizationId: string): Promise<number> {
    const { count } = await this.supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    return count || 0;
  }
}

// Export singleton instance
export const reservationRepository = new ReservationRepository();
