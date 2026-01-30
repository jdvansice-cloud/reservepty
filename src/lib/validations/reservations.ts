import { z } from 'zod';
import {
  uuidSchema,
  nonEmptyString,
  optionalString,
  isoDateTimeSchema,
  reservationStatusSchema,
  dateRangeSchema,
} from './common';

// ============================================================================
// CREATE RESERVATION SCHEMA
// ============================================================================

export const createReservationSchema = z
  .object({
    asset_id: uuidSchema,
    member_id: uuidSchema,
    organization_id: uuidSchema,
    start_time: isoDateTimeSchema,
    end_time: isoDateTimeSchema,
    title: nonEmptyString.max(200, 'Title must be 200 characters or less'),
    notes: optionalString.transform((val) => val?.slice(0, 1000)),
    guest_count: z.number().int().min(1).optional().nullable(),
    // Aviation-specific fields
    departure_location: optionalString,
    arrival_location: optionalString,
    // Watercraft-specific fields
    departure_port: optionalString,
    destination_port: optionalString,
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: 'End time must be after start time',
    path: ['end_time'],
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

// ============================================================================
// UPDATE RESERVATION SCHEMA
// ============================================================================

export const updateReservationSchema = z
  .object({
    start_time: isoDateTimeSchema.optional(),
    end_time: isoDateTimeSchema.optional(),
    title: nonEmptyString.max(200).optional(),
    notes: optionalString,
    status: reservationStatusSchema.optional(),
    guest_count: z.number().int().min(1).optional().nullable(),
    departure_location: optionalString,
    arrival_location: optionalString,
    departure_port: optionalString,
    destination_port: optionalString,
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        return new Date(data.end_time) > new Date(data.start_time);
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  );

export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

// ============================================================================
// RESERVATION QUERY SCHEMA
// ============================================================================

export const reservationQuerySchema = z.object({
  organization_id: uuidSchema.optional(),
  asset_id: uuidSchema.optional(),
  member_id: uuidSchema.optional(),
  status: reservationStatusSchema.optional(),
  status_in: z.array(reservationStatusSchema).optional(),
  start_after: isoDateTimeSchema.optional(),
  end_before: isoDateTimeSchema.optional(),
  page: z.number().int().positive().default(1),
  page_size: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['start_time', 'end_time', 'created_at', 'status']).default('start_time'),
  sort_direction: z.enum(['asc', 'desc']).default('asc'),
});

export type ReservationQueryInput = z.infer<typeof reservationQuerySchema>;

// ============================================================================
// AVAILABILITY CHECK SCHEMA
// ============================================================================

export const checkAvailabilitySchema = z
  .object({
    asset_id: uuidSchema,
    start_time: isoDateTimeSchema,
    end_time: isoDateTimeSchema,
    exclude_reservation_id: uuidSchema.optional(),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: 'End time must be after start time',
    path: ['end_time'],
  });

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;

// ============================================================================
// APPROVAL/REJECTION SCHEMA
// ============================================================================

export const approveReservationSchema = z.object({
  reservation_id: uuidSchema,
  approved_by: uuidSchema,
  notes: optionalString,
});

export type ApproveReservationInput = z.infer<typeof approveReservationSchema>;

export const rejectReservationSchema = z.object({
  reservation_id: uuidSchema,
  rejected_by: uuidSchema,
  reason: nonEmptyString.max(500, 'Reason must be 500 characters or less'),
});

export type RejectReservationInput = z.infer<typeof rejectReservationSchema>;

// ============================================================================
// CALENDAR VIEW SCHEMA
// ============================================================================

export const calendarViewSchema = z
  .object({
    organization_id: uuidSchema,
    asset_ids: z.array(uuidSchema).optional(),
    section: z.enum(['planes', 'helicopters', 'residences', 'watercraft']).optional(),
    start_date: isoDateTimeSchema,
    end_date: isoDateTimeSchema,
    include_cancelled: z.boolean().default(false),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

export type CalendarViewInput = z.infer<typeof calendarViewSchema>;

// ============================================================================
// RECURRING RESERVATION SCHEMA (Future feature)
// ============================================================================

export const recurringPatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().int().positive().max(12),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional(), // 0 = Sunday
  day_of_month: z.number().int().min(1).max(31).optional(),
  end_after_occurrences: z.number().int().positive().optional(),
  end_by_date: isoDateTimeSchema.optional(),
});

// Base schema without the refine for extension purposes
const baseReservationSchema = z.object({
  asset_id: uuidSchema,
  member_id: uuidSchema,
  organization_id: uuidSchema,
  start_time: isoDateTimeSchema,
  end_time: isoDateTimeSchema,
  title: nonEmptyString.max(200, 'Title must be 200 characters or less'),
  notes: optionalString.transform((val) => val?.slice(0, 1000)),
  guest_count: z.number().int().min(1).optional().nullable(),
  departure_location: optionalString,
  arrival_location: optionalString,
  departure_port: optionalString,
  destination_port: optionalString,
});

export const createRecurringReservationSchema = baseReservationSchema
  .extend({
    recurring: recurringPatternSchema.optional(),
  })
  .refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: 'End time must be after start time',
    path: ['end_time'],
  });

export type CreateRecurringReservationInput = z.infer<typeof createRecurringReservationSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that a reservation doesn't exceed maximum duration (if applicable)
 */
export function validateReservationDuration(
  startTime: string,
  endTime: string,
  maxHours?: number
): { valid: boolean; error?: string } {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  if (maxHours && durationHours > maxHours) {
    return {
      valid: false,
      error: `Reservation duration exceeds maximum of ${maxHours} hours`,
    };
  }

  return { valid: true };
}

/**
 * Validate that reservation start is within allowed advance booking window
 */
export function validateAdvanceBooking(
  startTime: string,
  maxDaysInAdvance?: number
): { valid: boolean; error?: string } {
  if (!maxDaysInAdvance) return { valid: true };

  const start = new Date(startTime);
  const now = new Date();
  const maxDate = new Date(now.getTime() + maxDaysInAdvance * 24 * 60 * 60 * 1000);

  if (start > maxDate) {
    return {
      valid: false,
      error: `Cannot book more than ${maxDaysInAdvance} days in advance`,
    };
  }

  return { valid: true };
}

/**
 * Validate minimum notice period for reservations
 */
export function validateMinimumNotice(
  startTime: string,
  minHoursNotice?: number
): { valid: boolean; error?: string } {
  if (!minHoursNotice) return { valid: true };

  const start = new Date(startTime);
  const now = new Date();
  const minDate = new Date(now.getTime() + minHoursNotice * 60 * 60 * 1000);

  if (start < minDate) {
    return {
      valid: false,
      error: `Reservations require at least ${minHoursNotice} hours notice`,
    };
  }

  return { valid: true };
}
