'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import { bookingService, BookingRequest } from '@/lib/services/BookingService';
import type { Database } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

type Reservation = Database['public']['Tables']['reservations']['Row'];
type ReservationStatus = Database['public']['Enums']['reservation_status'];

export interface BookingFilters {
  assetId?: string;
  status?: ReservationStatus | ReservationStatus[];
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface CalendarDateRange {
  start: string;
  end: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (orgId: string, filters?: BookingFilters) =>
    [...bookingKeys.lists(), orgId, filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  calendar: (orgId: string, range: CalendarDateRange, assetIds?: string[]) =>
    [...bookingKeys.all, 'calendar', orgId, range, assetIds] as const,
  upcoming: (orgId: string, userId?: string) =>
    [...bookingKeys.all, 'upcoming', orgId, userId] as const,
  pending: (orgId: string) =>
    [...bookingKeys.all, 'pending', orgId] as const,
  pendingCount: (orgId: string) =>
    [...bookingKeys.all, 'pending-count', orgId] as const,
  availability: (assetId: string, start: string, end: string) =>
    [...bookingKeys.all, 'availability', assetId, start, end] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch calendar events for a date range
 */
export function useCalendarEvents(
  dateRange: CalendarDateRange,
  assetIds?: string[],
  statuses?: ReservationStatus[]
) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: bookingKeys.calendar(organization?.id || '', dateRange, assetIds),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return [];
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await bookingService.getCalendarEvents(
        ctx,
        organization.id,
        dateRange.start,
        dateRange.end,
        assetIds,
        statuses
      );

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch calendar events');
      }

      return result.data || [];
    },
    enabled: !!organization?.id && !!user?.id && !!dateRange.start && !!dateRange.end,
    staleTime: 1 * 60 * 1000, // 1 minute - calendar data changes frequently
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single booking by ID with details
 */
export function useBooking(bookingId: string) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return null;
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await bookingService.getBookingDetails(ctx, bookingId);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch booking');
      }

      return result.data;
    },
    enabled: !!bookingId && !!organization?.id && !!user?.id,
  });
}

/**
 * Hook to fetch user's upcoming reservations
 */
export function useUpcomingBookings(limit = 5) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: bookingKeys.upcoming(organization?.id || '', user?.id),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return [];
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await bookingService.getUserUpcoming(ctx, organization.id, limit);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch upcoming bookings');
      }

      return result.data || [];
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch pending approval count
 */
export function usePendingCount() {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: bookingKeys.pendingCount(organization?.id || ''),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return 0;
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await bookingService.getPendingCount(ctx, organization.id);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch pending count');
      }

      return result.data || 0;
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to check availability for a time slot
 */
export function useAvailability(
  assetId: string,
  startDatetime: string,
  endDatetime: string,
  excludeReservationId?: string
) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: bookingKeys.availability(assetId, startDatetime, endDatetime),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return { is_available: false, conflicting_reservations: [] };
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await bookingService.checkAvailability(
        ctx,
        assetId,
        startDatetime,
        endDatetime,
        excludeReservationId
      );

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to check availability');
      }

      return result.data;
    },
    enabled:
      !!assetId &&
      !!startDatetime &&
      !!endDatetime &&
      !!organization?.id &&
      !!user?.id,
    staleTime: 30 * 1000, // 30 seconds - availability changes quickly
  });
}

/**
 * Hook to create a new booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async (request: Omit<BookingRequest, 'organizationId'>) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Not authenticated');
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await bookingService.createBooking(ctx, {
        ...request,
        organizationId: organization.id,
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create booking');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate calendar and upcoming bookings
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: [...bookingKeys.all, 'calendar'],
      });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.upcoming(organization?.id || ''),
      });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.pendingCount(organization?.id || ''),
      });
    },
  });
}

/**
 * Hook to update an existing booking
 */
export function useUpdateBooking() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reservationId,
      data,
    }: {
      reservationId: string;
      data: {
        start_time?: string;
        end_time?: string;
        title?: string;
        notes?: string;
      };
    }) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Not authenticated');
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await bookingService.updateBooking(ctx, reservationId, data);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update booking');
      }

      return result.data;
    },
    onSuccess: (_data, { reservationId }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(reservationId) });
      queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}

/**
 * Hook to cancel a booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Not authenticated');
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await bookingService.cancelBooking(ctx, reservationId);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to cancel booking');
      }

      return result.data;
    },
    onSuccess: (_data, reservationId) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(reservationId) });
      queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.upcoming(organization?.id || ''),
      });
    },
  });
}

/**
 * Hook to approve a pending booking
 */
export function useApproveBooking() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reservationId,
      notes,
    }: {
      reservationId: string;
      notes?: string;
    }) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Not authenticated');
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
        role: 'admin' as const,
      };

      const result = await bookingService.approveBooking(ctx, reservationId, notes);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to approve booking');
      }

      return result.data;
    },
    onSuccess: (_data, { reservationId }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(reservationId) });
      queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.pendingCount(organization?.id || ''),
      });
    },
  });
}

/**
 * Hook to reject a pending booking
 */
export function useRejectBooking() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reservationId,
      reason,
    }: {
      reservationId: string;
      reason: string;
    }) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Not authenticated');
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
        role: 'admin' as const,
      };

      const result = await bookingService.rejectBooking(ctx, reservationId, reason);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to reject booking');
      }

      return result.data;
    },
    onSuccess: (_data, { reservationId }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(reservationId) });
      queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bookingKeys.pendingCount(organization?.id || ''),
      });
    },
  });
}
