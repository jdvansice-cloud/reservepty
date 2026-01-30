import { z } from 'zod';
import {
  nonEmptyString,
  optionalString,
  positiveNumber,
  nonNegativeNumber,
  uuidSchema,
  assetSectionSchema,
  urlSchema,
  timeSchema,
} from './common';

// ============================================================================
// PLANE DETAILS SCHEMA
// ============================================================================

export const planeDetailsSchema = z.object({
  manufacturer: optionalString,
  model: optionalString,
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  tail_number: optionalString,
  cruise_speed_knots: positiveNumber.optional().nullable(),
  range_nm: positiveNumber.optional().nullable(),
  passenger_capacity: z.number().int().positive().optional().nullable(),
  home_airport: optionalString,
  turnaround_minutes: z.number().int().min(0).optional().nullable(),
  current_location: optionalString,
});

export type PlaneDetailsInput = z.infer<typeof planeDetailsSchema>;

// ============================================================================
// HELICOPTER DETAILS SCHEMA
// ============================================================================

export const helicopterDetailsSchema = z.object({
  manufacturer: optionalString,
  model: optionalString,
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  registration: optionalString,
  passenger_capacity: z.number().int().positive().optional().nullable(),
  home_helipad: optionalString,
  turnaround_minutes: z.number().int().min(0).optional().nullable(),
  current_location: optionalString,
});

export type HelicopterDetailsInput = z.infer<typeof helicopterDetailsSchema>;

// ============================================================================
// RESIDENCE DETAILS SCHEMA
// ============================================================================

export const residenceDetailsSchema = z.object({
  address: optionalString,
  city: optionalString,
  country: optionalString,
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().min(0).optional().nullable(),
  square_feet: positiveNumber.optional().nullable(),
  max_guests: z.number().int().positive().optional().nullable(),
  check_in_time: timeSchema.optional().nullable(),
  check_out_time: timeSchema.optional().nullable(),
  cleaning_buffer_hours: nonNegativeNumber.optional().nullable(),
  amenities: z.array(z.string()).optional().nullable(),
});

export type ResidenceDetailsInput = z.infer<typeof residenceDetailsSchema>;

// ============================================================================
// BOAT DETAILS SCHEMA
// ============================================================================

export const boatDetailsSchema = z.object({
  manufacturer: optionalString,
  model: optionalString,
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  length_feet: positiveNumber.optional().nullable(),
  beam_feet: positiveNumber.optional().nullable(),
  draft_feet: positiveNumber.optional().nullable(),
  cabins: z.number().int().min(0).optional().nullable(),
  passenger_capacity: z.number().int().positive().optional().nullable(),
  crew_capacity: z.number().int().min(0).optional().nullable(),
  home_port: optionalString,
  current_location: optionalString,
});

export type BoatDetailsInput = z.infer<typeof boatDetailsSchema>;

// ============================================================================
// ASSET DETAILS UNION
// ============================================================================

export const assetDetailsSchema = z.union([
  planeDetailsSchema,
  helicopterDetailsSchema,
  residenceDetailsSchema,
  boatDetailsSchema,
]);

export type AssetDetailsInput = z.infer<typeof assetDetailsSchema>;

// ============================================================================
// CREATE ASSET SCHEMA
// ============================================================================

export const createAssetSchema = z.object({
  organization_id: uuidSchema,
  section: assetSectionSchema,
  name: nonEmptyString.max(100, 'Name must be 100 characters or less'),
  description: optionalString.transform((val) => val?.slice(0, 500)),
  details: assetDetailsSchema.optional().nullable(),
  primary_photo_url: urlSchema,
  is_active: z.boolean().default(true),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

// ============================================================================
// UPDATE ASSET SCHEMA
// ============================================================================

export const updateAssetSchema = z.object({
  name: nonEmptyString.max(100).optional(),
  description: optionalString,
  details: assetDetailsSchema.optional().nullable(),
  primary_photo_url: urlSchema,
  is_active: z.boolean().optional(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

// ============================================================================
// ASSET QUERY SCHEMA
// ============================================================================

export const assetQuerySchema = z.object({
  organization_id: uuidSchema.optional(),
  section: assetSectionSchema.optional(),
  is_active: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  page_size: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['name', 'created_at', 'section']).default('created_at'),
  sort_direction: z.enum(['asc', 'desc']).default('desc'),
});

export type AssetQueryInput = z.infer<typeof assetQuerySchema>;

// ============================================================================
// ASSET PHOTO SCHEMAS
// ============================================================================

export const addAssetPhotoSchema = z.object({
  asset_id: uuidSchema,
  url: z.string().url('Invalid photo URL'),
  caption: optionalString.transform((val) => val?.slice(0, 200)),
  order: nonNegativeNumber.optional(),
});

export type AddAssetPhotoInput = z.infer<typeof addAssetPhotoSchema>;

export const reorderPhotosSchema = z.object({
  asset_id: uuidSchema,
  photo_ids: z.array(uuidSchema).min(1, 'At least one photo ID required'),
});

export type ReorderPhotosInput = z.infer<typeof reorderPhotosSchema>;

// ============================================================================
// SECTION-SPECIFIC VALIDATION HELPERS
// ============================================================================

/**
 * Get the appropriate details schema for a section
 */
export function getDetailsSchemaForSection(section: string) {
  switch (section) {
    case 'planes':
      return planeDetailsSchema;
    case 'helicopters':
      return helicopterDetailsSchema;
    case 'residences':
      return residenceDetailsSchema;
    case 'watercraft':
      return boatDetailsSchema;
    default:
      return z.object({});
  }
}

/**
 * Validate asset creation with section-specific details
 */
export function validateAssetWithDetails(data: unknown) {
  // First validate base structure
  const baseResult = createAssetSchema.safeParse(data);
  if (!baseResult.success) {
    return { success: false as const, errors: baseResult.error.errors };
  }

  // Then validate section-specific details
  const detailsSchema = getDetailsSchemaForSection(baseResult.data.section);
  if (baseResult.data.details) {
    const detailsResult = detailsSchema.safeParse(baseResult.data.details);
    if (!detailsResult.success) {
      return { success: false as const, errors: detailsResult.error.errors };
    }
  }

  return { success: true as const, data: baseResult.data };
}
