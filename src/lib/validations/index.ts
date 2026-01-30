/**
 * Validation Schemas Index
 *
 * Re-export all validation schemas for easy imports
 */

// Common validators
export {
  uuidSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  nonEmptyString,
  optionalString,
  positiveNumber,
  nonNegativeNumber,
  percentageSchema,
  isoDateSchema,
  isoDateTimeSchema,
  timeSchema,
  futureDateSchema,
  dateRangeSchema,
  paginationSchema,
  sortDirectionSchema,
  assetSectionSchema,
  organizationRoleSchema,
  reservationStatusSchema,
  createArraySchema,
  createOptionalEnum,
  validateData,
} from './common';

export type {
  PaginationInput,
  SortDirection,
  AssetSection,
  OrganizationRole,
  ReservationStatus,
} from './common';

// Asset validators
export {
  planeDetailsSchema,
  helicopterDetailsSchema,
  residenceDetailsSchema,
  boatDetailsSchema,
  assetDetailsSchema,
  createAssetSchema,
  updateAssetSchema,
  assetQuerySchema,
  addAssetPhotoSchema,
  reorderPhotosSchema,
  getDetailsSchemaForSection,
  validateAssetWithDetails,
} from './assets';

export type {
  PlaneDetailsInput,
  HelicopterDetailsInput,
  ResidenceDetailsInput,
  BoatDetailsInput,
  AssetDetailsInput,
  CreateAssetInput,
  UpdateAssetInput,
  AssetQueryInput,
  AddAssetPhotoInput,
  ReorderPhotosInput,
} from './assets';

// Reservation validators
export {
  createReservationSchema,
  updateReservationSchema,
  reservationQuerySchema,
  checkAvailabilitySchema,
  approveReservationSchema,
  rejectReservationSchema,
  calendarViewSchema,
  recurringPatternSchema,
  createRecurringReservationSchema,
  validateReservationDuration,
  validateAdvanceBooking,
  validateMinimumNotice,
} from './reservations';

export type {
  CreateReservationInput,
  UpdateReservationInput,
  ReservationQueryInput,
  CheckAvailabilityInput,
  ApproveReservationInput,
  RejectReservationInput,
  CalendarViewInput,
  CreateRecurringReservationInput,
} from './reservations';
