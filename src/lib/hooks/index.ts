/**
 * Custom Hooks Index
 *
 * Re-export all custom hooks for easy imports
 */

// Async operations
export { useAsync, useAsyncCallback } from './useAsync';
export type { AsyncState, UseAsyncOptions, UseAsyncReturn } from './useAsync';

// Debouncing
export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedState,
} from './useDebounce';

// Asset hooks (React Query)
export {
  useAssets,
  useAsset,
  useAssetsBySection,
  useAssetCounts,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useToggleAssetStatus,
  assetKeys,
} from './useAssets';
export type { AssetFilters } from './useAssets';

// Booking hooks (React Query)
export {
  useCalendarEvents,
  useBooking,
  useUpcomingBookings,
  usePendingCount,
  useAvailability,
  useCreateBooking,
  useUpdateBooking,
  useCancelBooking,
  useApproveBooking,
  useRejectBooking,
  bookingKeys,
} from './useBookings';
export type { BookingFilters, CalendarDateRange } from './useBookings';

// Realtime hooks
export {
  useRealtime,
  useCalendarRealtime,
  useAssetRealtime,
  useMemberRealtime,
  useAppRealtime,
  usePresence,
} from './useRealtime';

// Dashboard hooks (React Query)
export {
  useDashboard,
  useDashboardStats,
  useSectionStats,
  useRecentBookings,
  useUpcomingBookings as useDashboardUpcoming,
  usePendingApprovals,
  dashboardKeys,
} from './useDashboard';
export type {
  DashboardStats,
  SectionStats,
  RecentBooking,
  DashboardData,
} from './useDashboard';
