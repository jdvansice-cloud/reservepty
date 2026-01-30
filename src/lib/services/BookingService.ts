'use client';

import { BaseService, ServiceContext } from './base';
import {
  ReservationRepository,
  reservationRepository,
  ReservationWithDetails,
  CalendarEvent,
  AvailabilityResult,
  ValidationResult,
} from '@/lib/repositories';
import { organizationRepository } from '@/lib/repositories';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api.types';
import { createErrorResponse, createSuccessResponse } from '@/lib/types/api.types';
import {
  createReservationSchema,
  updateReservationSchema,
  CreateReservationInput,
  UpdateReservationInput,
  validateReservationDuration,
  validateAdvanceBooking,
  validateMinimumNotice,
} from '@/lib/validations';
import type { Database } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

type Reservation = Database['public']['Tables']['reservations']['Row'];
type ReservationStatus = Database['public']['Enums']['reservation_status'];

export interface BookingRequest {
  assetId: string;
  organizationId: string;
  startDatetime: string;
  endDatetime: string;
  title?: string;
  notes?: string;
  guestCount?: number;
  metadata?: Record<string, unknown>;
}

export interface BookingResult {
  reservation: Reservation;
  requiresApproval: boolean;
  message: string;
}

// ============================================================================
// BOOKING SERVICE
// ============================================================================

export class BookingService extends BaseService<'reservations'> {
  private reservationRepo: ReservationRepository;

  constructor() {
    super(reservationRepository, 'BookingService');
    this.reservationRepo = reservationRepository;
  }

  /**
   * Create a new booking with full validation
   */
  async createBooking(
    ctx: ServiceContext,
    request: BookingRequest
  ): Promise<ApiResponse<BookingResult>> {
    if (!ctx.userId) {
      return createErrorResponse('UNAUTHORIZED', 'You must be logged in to make a booking');
    }

    // Validate against tier rules using database function
    const tierValidation = await this.reservationRepo.validateReservation(
      ctx.userId,
      request.assetId,
      request.startDatetime,
      request.endDatetime
    );

    if (!tierValidation.success) {
      return createErrorResponse(
        tierValidation.error?.code || 'INTERNAL_ERROR',
        tierValidation.error?.message || 'Validation failed'
      );
    }

    if (!tierValidation.data?.is_valid) {
      return createErrorResponse(
        'BAD_REQUEST',
        tierValidation.data?.error_message || 'Booking validation failed',
        { errorCode: tierValidation.data?.error_code }
      );
    }

    // Determine initial status
    const requiresApproval = tierValidation.data.requires_approval;
    const initialStatus: ReservationStatus = requiresApproval ? 'pending' : 'approved';

    // Create the reservation
    const result = await this.reservationRepo.create({
      organization_id: request.organizationId,
      asset_id: request.assetId,
      user_id: ctx.userId,
      title: request.title || 'Reservation',
      start_datetime: request.startDatetime,
      end_datetime: request.endDatetime,
      status: initialStatus,
      notes: request.notes,
      metadata: (request.metadata || {}) as Database['public']['Tables']['reservations']['Insert']['metadata'],
    });

    if (!result.success) {
      return createErrorResponse(
        result.error?.code || 'INTERNAL_ERROR',
        result.error?.message || 'Failed to create reservation'
      );
    }

    return createSuccessResponse({
      reservation: result.data!,
      requiresApproval,
      message: requiresApproval
        ? 'Your booking request has been submitted and is pending approval.'
        : 'Your booking has been confirmed.',
    });
  }

  /**
   * Update an existing booking
   */
  async updateBooking(
    ctx: ServiceContext,
    reservationId: string,
    input: UpdateReservationInput
  ): Promise<ApiResponse<Reservation>> {
    if (!ctx.userId) {
      return createErrorResponse('UNAUTHORIZED', 'You must be logged in');
    }

    // Validate input
    const validation = this.validate(updateReservationSchema, input);
    if (!validation.success) {
      return validation as ApiResponse<Reservation>;
    }

    // Get existing reservation
    const existing = await this.reservationRepo.findByIdWithDetails(reservationId);
    if (!existing.success || !existing.data) {
      return this.notFound('Reservation');
    }

    // Check if user can modify
    const canModify = existing.data.user_id === ctx.userId ||
      ctx.role === 'admin' ||
      ctx.role === 'owner' ||
      ctx.role === 'manager';

    if (!canModify) {
      return this.unauthorized('You do not have permission to modify this booking');
    }

    // If dates are changing, revalidate availability
    if (input.start_time || input.end_time) {
      const startTime = input.start_time || existing.data.start_datetime;
      const endTime = input.end_time || existing.data.end_datetime;

      const availability = await this.reservationRepo.checkAvailability(
        existing.data.asset_id,
        startTime,
        endTime,
        reservationId
      );

      if (!availability.success) {
        return createErrorResponse(
          availability.error?.code || 'INTERNAL_ERROR',
          availability.error?.message || 'Availability check failed'
        );
      }

      if (!availability.data?.is_available) {
        return createErrorResponse(
          'CONFLICT',
          'The requested time slot is not available',
          { conflicts: availability.data?.conflicting_reservations }
        );
      }
    }

    return this.reservationRepo.update(reservationId, {
      start_datetime: input.start_time,
      end_datetime: input.end_time,
      title: input.title,
      notes: input.notes,
    });
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    ctx: ServiceContext,
    reservationId: string
  ): Promise<ApiResponse<Reservation>> {
    if (!ctx.userId) {
      return createErrorResponse('UNAUTHORIZED', 'You must be logged in');
    }

    // Get existing reservation
    const existing = await this.reservationRepo.findById(reservationId);
    if (!existing.success || !existing.data) {
      return this.notFound('Reservation');
    }

    // Check if user can cancel
    const canCancel = existing.data.user_id === ctx.userId ||
      ctx.role === 'admin' ||
      ctx.role === 'owner';

    if (!canCancel) {
      return this.unauthorized('You do not have permission to cancel this booking');
    }

    // Check if already completed or canceled
    if (['completed', 'canceled'].includes(existing.data.status)) {
      return createErrorResponse(
        'BAD_REQUEST',
        `Cannot cancel a ${existing.data.status} reservation`
      );
    }

    return this.reservationRepo.cancel(reservationId);
  }

  /**
   * Approve a pending booking
   */
  async approveBooking(
    ctx: ServiceContext,
    reservationId: string,
    notes?: string
  ): Promise<ApiResponse<Reservation>> {
    if (!ctx.userId) {
      return createErrorResponse('UNAUTHORIZED', 'You must be logged in');
    }

    // Check permission
    const canApprove = ctx.role === 'admin' || ctx.role === 'owner' || ctx.role === 'manager';
    if (!canApprove) {
      return this.unauthorized('You do not have permission to approve bookings');
    }

    // Get existing reservation
    const existing = await this.reservationRepo.findById(reservationId);
    if (!existing.success || !existing.data) {
      return this.notFound('Reservation');
    }

    // Verify it's pending
    if (existing.data.status !== 'pending') {
      return createErrorResponse(
        'BAD_REQUEST',
        `Cannot approve a ${existing.data.status} reservation`
      );
    }

    // Verify organization access
    if (ctx.organizationId && existing.data.organization_id !== ctx.organizationId) {
      return this.unauthorized('You do not have access to this reservation');
    }

    return this.reservationRepo.approve(reservationId, ctx.userId, notes);
  }

  /**
   * Reject a pending booking
   */
  async rejectBooking(
    ctx: ServiceContext,
    reservationId: string,
    reason: string
  ): Promise<ApiResponse<Reservation>> {
    if (!ctx.userId) {
      return createErrorResponse('UNAUTHORIZED', 'You must be logged in');
    }

    if (!reason || reason.trim().length === 0) {
      return createErrorResponse('VALIDATION_ERROR', 'A rejection reason is required');
    }

    // Check permission
    const canReject = ctx.role === 'admin' || ctx.role === 'owner' || ctx.role === 'manager';
    if (!canReject) {
      return this.unauthorized('You do not have permission to reject bookings');
    }

    // Get existing reservation
    const existing = await this.reservationRepo.findById(reservationId);
    if (!existing.success || !existing.data) {
      return this.notFound('Reservation');
    }

    // Verify it's pending
    if (existing.data.status !== 'pending') {
      return createErrorResponse(
        'BAD_REQUEST',
        `Cannot reject a ${existing.data.status} reservation`
      );
    }

    return this.reservationRepo.reject(reservationId, reason);
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(
    ctx: ServiceContext,
    organizationId: string,
    startDate: string,
    endDate: string,
    assetIds?: string[],
    statuses?: ReservationStatus[]
  ): Promise<ApiResponse<CalendarEvent[]>> {
    // Verify organization access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
      return this.unauthorized('You do not have access to this organization');
    }

    return this.reservationRepo.getCalendarEvents(
      organizationId,
      assetIds,
      startDate,
      endDate,
      statuses
    );
  }

  /**
   * Check availability for a time slot
   */
  async checkAvailability(
    ctx: ServiceContext,
    assetId: string,
    startDatetime: string,
    endDatetime: string,
    excludeReservationId?: string
  ): Promise<ApiResponse<AvailabilityResult>> {
    return this.reservationRepo.checkAvailability(
      assetId,
      startDatetime,
      endDatetime,
      excludeReservationId
    );
  }

  /**
   * Get user's upcoming reservations
   */
  async getUserUpcoming(
    ctx: ServiceContext,
    organizationId: string,
    limit = 5
  ): Promise<ApiResponse<ReservationWithDetails[]>> {
    if (!ctx.userId) {
      return createErrorResponse('UNAUTHORIZED', 'You must be logged in');
    }

    return this.reservationRepo.getUserUpcoming(ctx.userId, organizationId, limit);
  }

  /**
   * Get pending approval count
   */
  async getPendingCount(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<ApiResponse<number>> {
    // Verify organization access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
      return this.unauthorized('You do not have access to this organization');
    }

    const count = await this.reservationRepo.getPendingCount(organizationId);
    return createSuccessResponse(count);
  }

  /**
   * Get booking details
   */
  async getBookingDetails(
    ctx: ServiceContext,
    reservationId: string
  ): Promise<ApiResponse<ReservationWithDetails>> {
    const result = await this.reservationRepo.findByIdWithDetails(reservationId);

    if (!result.success || !result.data) {
      return result;
    }

    // Verify organization access
    if (ctx.organizationId && result.data.organization_id !== ctx.organizationId) {
      return this.unauthorized('You do not have access to this reservation');
    }

    return result;
  }
}

// Export singleton instance
export const bookingService = new BookingService();
