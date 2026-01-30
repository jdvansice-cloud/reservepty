'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import {
  dashboardService,
  DashboardStats,
  SectionStats,
  RecentBooking,
  DashboardData,
} from '@/lib/services/DashboardService';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (orgId: string) => [...dashboardKeys.all, 'stats', orgId] as const,
  sectionStats: (orgId: string) => [...dashboardKeys.all, 'section-stats', orgId] as const,
  recentBookings: (orgId: string) => [...dashboardKeys.all, 'recent-bookings', orgId] as const,
  upcomingBookings: (orgId: string) => [...dashboardKeys.all, 'upcoming-bookings', orgId] as const,
  pendingApprovals: (orgId: string) => [...dashboardKeys.all, 'pending-approvals', orgId] as const,
  full: (orgId: string) => [...dashboardKeys.all, 'full', orgId] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all dashboard data at once
 */
export function useDashboard() {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.full(organization?.id || ''),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return null;
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await dashboardService.getDashboardData(ctx, organization.id);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch dashboard data');
      }

      return result.data;
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute - dashboard data should be fairly fresh
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch dashboard stats only
 */
export function useDashboardStats() {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.stats(organization?.id || ''),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return null;
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await dashboardService.getStats(ctx, organization.id);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch dashboard stats');
      }

      return result.data;
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to fetch section-specific stats
 */
export function useSectionStats() {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.sectionStats(organization?.id || ''),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return [];
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await dashboardService.getSectionStats(ctx, organization.id);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch section stats');
      }

      return result.data || [];
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch recent bookings
 */
export function useRecentBookings(limit = 5) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.recentBookings(organization?.id || ''),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return [];
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await dashboardService.getRecentBookings(ctx, organization.id, limit);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch recent bookings');
      }

      return result.data || [];
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds - bookings change frequently
  });
}

/**
 * Hook to fetch upcoming bookings
 */
export function useUpcomingBookings(limit = 5) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.upcomingBookings(organization?.id || ''),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return [];
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await dashboardService.getUpcomingBookings(ctx, organization.id, limit);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch upcoming bookings');
      }

      return result.data || [];
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch pending approvals (for admins)
 */
export function usePendingApprovals(limit = 10) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.pendingApprovals(organization?.id || ''),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return [];
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await dashboardService.getPendingApprovals(ctx, organization.id, limit);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch pending approvals');
      }

      return result.data || [];
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 30 * 1000,
  });
}

// Re-export types for convenience
export type { DashboardStats, SectionStats, RecentBooking, DashboardData };
