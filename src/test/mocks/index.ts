/**
 * Test Mocks Index
 *
 * Re-export all mock utilities for easy imports in tests
 */

// Supabase mocks
export {
  createMockSupabaseClient,
  createMockQueryBuilder,
  mockSupabaseResponse,
  mockSupabaseClient,
  mockGetClient,
} from './supabase';

// Auth mocks
export {
  createMockUser,
  createMockOrganization,
  createMockAuthContext,
  createMockMember,
  createMockProfile,
  createMockSession,
  MockAuthProvider,
  mockUseAuth,
  setMockAuthContext,
  resetMockAuthContext,
} from './auth';
export type { AuthContextValue, Profile, Organization, OrganizationMembership, Subscription } from './auth';

// Data mocks
export {
  createMockAsset,
  createMockAssets,
  createMockReservation,
  createMockReservations,
  createMockDashboardStats,
  createMockSectionStats,
  createMockRecentBooking,
  createMockRecentBookings,
  createMockAirport,
  createMockAirports,
  createMockHeliport,
  createMockHeliports,
} from './data';
