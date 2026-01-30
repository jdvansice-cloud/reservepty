import { z } from 'zod';

// ============================================================================
// COMMON FIELD VALIDATORS
// ============================================================================

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation with better error messages
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

/**
 * Phone number validation (international format)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number. Use international format (e.g., +1234567890)'
  )
  .optional()
  .nullable();

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .optional()
  .nullable();

/**
 * Non-empty string
 */
export const nonEmptyString = z.string().min(1, 'This field is required');

/**
 * Optional string that transforms empty strings to null
 */
export const optionalString = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val));

/**
 * Positive number validation
 */
export const positiveNumber = z
  .number()
  .positive('Must be a positive number');

/**
 * Non-negative number validation
 */
export const nonNegativeNumber = z
  .number()
  .min(0, 'Must be zero or greater');

/**
 * Percentage validation (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage must be at most 100');

// ============================================================================
// DATE & TIME VALIDATORS
// ============================================================================

/**
 * ISO date string validation
 */
export const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Invalid date format. Use YYYY-MM-DD'
  );

/**
 * ISO datetime string validation
 */
export const isoDateTimeSchema = z
  .string()
  .datetime({ message: 'Invalid datetime format' });

/**
 * Time string validation (HH:mm format)
 */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm');

/**
 * Future date validation
 */
export const futureDateSchema = z
  .string()
  .datetime()
  .refine(
    (date) => new Date(date) > new Date(),
    'Date must be in the future'
  );

/**
 * Date range validation
 */
export const dateRangeSchema = z
  .object({
    start: isoDateTimeSchema,
    end: isoDateTimeSchema,
  })
  .refine(
    (data) => new Date(data.end) > new Date(data.start),
    { message: 'End date must be after start date' }
  );

// ============================================================================
// PAGINATION VALIDATORS
// ============================================================================

/**
 * Pagination input validation
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================================
// SORT VALIDATORS
// ============================================================================

/**
 * Sort direction enum
 */
export const sortDirectionSchema = z.enum(['asc', 'desc']);

export type SortDirection = z.infer<typeof sortDirectionSchema>;

// ============================================================================
// ASSET SECTION VALIDATORS
// ============================================================================

/**
 * Asset section enum
 */
export const assetSectionSchema = z.enum([
  'planes',
  'helicopters',
  'residences',
  'watercraft',
]);

export type AssetSection = z.infer<typeof assetSectionSchema>;

// ============================================================================
// USER ROLE VALIDATORS
// ============================================================================

/**
 * Organization role enum
 */
export const organizationRoleSchema = z.enum([
  'owner',
  'admin',
  'manager',
  'member',
]);

export type OrganizationRole = z.infer<typeof organizationRoleSchema>;

// ============================================================================
// RESERVATION STATUS VALIDATORS
// ============================================================================

/**
 * Reservation status enum
 */
export const reservationStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'completed',
]);

export type ReservationStatus = z.infer<typeof reservationStatusSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a schema for array with minimum and maximum items
 */
export function createArraySchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  options: { min?: number; max?: number } = {}
) {
  let schema = z.array(itemSchema);

  if (options.min !== undefined) {
    schema = schema.min(options.min, `At least ${options.min} item(s) required`);
  }

  if (options.max !== undefined) {
    schema = schema.max(options.max, `At most ${options.max} item(s) allowed`);
  }

  return schema;
}

/**
 * Create an optional enum schema
 */
export function createOptionalEnum<T extends [string, ...string[]]>(values: T) {
  return z.enum(values).optional().nullable();
}

/**
 * Validate and parse data with helpful error formatting
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format errors by field
  const errors: Record<string, string[]> = {};
  for (const error of result.error.errors) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  }

  return { success: false, errors };
}
