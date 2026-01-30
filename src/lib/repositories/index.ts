/**
 * Repositories Index
 *
 * Re-export all repositories for easy imports
 */

// Base repository
export { BaseRepository } from './base';
export type {
  FilterOperator,
  FilterCondition,
  RepositoryQueryOptions,
} from './base';

// Asset repository
export { AssetRepository, assetRepository } from './AssetRepository';
export type {
  AssetWithPhotos,
  AssetQueryOptions,
  SearchAssetsResult,
} from './AssetRepository';

// Reservation repository
export { ReservationRepository, reservationRepository } from './ReservationRepository';
export type {
  ReservationWithDetails,
  ReservationQueryOptions,
  CalendarEvent,
  AvailabilityResult,
  ValidationResult,
} from './ReservationRepository';

// Organization repository
export { OrganizationRepository, organizationRepository } from './OrganizationRepository';
export type {
  OrganizationWithSubscription,
  MemberWithProfile,
  DetailedMember,
  OrganizationStats,
  UserPermissions,
} from './OrganizationRepository';
