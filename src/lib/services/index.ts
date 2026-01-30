/**
 * Services Index
 *
 * Re-export all services for easy imports
 */

// Base service
export { BaseService } from './base';
export type {
  ServiceContext,
  ServiceResult,
} from './base';

// Asset service
export { AssetService, assetService } from './AssetService';

// Booking service
export { BookingService, bookingService } from './BookingService';
export type { BookingRequest, BookingResult } from './BookingService';

// Organization service
export { OrganizationService, organizationService } from './OrganizationService';

// Dashboard service
export { DashboardService, dashboardService } from './DashboardService';
export type {
  DashboardStats,
  SectionStats,
  RecentBooking,
  DashboardData,
} from './DashboardService';
