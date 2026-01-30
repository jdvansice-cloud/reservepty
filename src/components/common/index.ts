/**
 * Common Components Index
 *
 * Re-export all common/shared components for easy imports
 */

// Error boundary
export { ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';

// Loading states
export {
  LoadingState,
  LoadingSpinner,
  LoadingOverlay,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonButton,
} from './LoadingState';

// Empty states
export {
  EmptyState,
  NoSearchResults,
  NoAssets,
  NoReservations,
  NoPendingApprovals,
  NoMembers,
  NoUpcomingTrips,
  LoadError,
} from './EmptyState';
