import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMockDashboardStats,
  createMockSectionStats,
  createMockRecentBookings,
} from '@/test/mocks/data';
import {
  createMockAuthContext,
  createMockUser,
  createMockOrganization,
} from '@/test/mocks/auth';

// Mock the auth provider before importing hooks
const mockAuthValue = createMockAuthContext();

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the dashboard service
vi.mock('@/lib/services/DashboardService', () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
    getStats: vi.fn(),
    getSectionStats: vi.fn(),
    getRecentBookings: vi.fn(),
    getUpcomingBookings: vi.fn(),
    getPendingApprovals: vi.fn(),
  },
  DashboardService: vi.fn(),
}));

// Now import the hooks after mocking
import {
  useDashboard,
  useDashboardStats,
  useSectionStats,
  useRecentBookings,
  useUpcomingBookings,
  usePendingApprovals,
  dashboardKeys,
} from '../useDashboard';
import { dashboardService } from '@/lib/services/DashboardService';

// Helper to create a test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Create wrapper for hooks
function createWrapper(authOverrides?: Partial<typeof mockAuthValue>) {
  const queryClient = createTestQueryClient();

  // Update mock auth value
  if (authOverrides) {
    Object.assign(mockAuthValue, authOverrides);
  }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('Dashboard Hooks', () => {
  const mockOrgId = 'test-org-id';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default authenticated state
    Object.assign(mockAuthValue, createMockAuthContext());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('dashboardKeys', () => {
    it('should generate correct query keys', () => {
      expect(dashboardKeys.all).toEqual(['dashboard']);
      expect(dashboardKeys.stats('org-1')).toEqual(['dashboard', 'stats', 'org-1']);
      expect(dashboardKeys.sectionStats('org-1')).toEqual(['dashboard', 'section-stats', 'org-1']);
      expect(dashboardKeys.recentBookings('org-1')).toEqual(['dashboard', 'recent-bookings', 'org-1']);
      expect(dashboardKeys.upcomingBookings('org-1')).toEqual(['dashboard', 'upcoming-bookings', 'org-1']);
      expect(dashboardKeys.pendingApprovals('org-1')).toEqual(['dashboard', 'pending-approvals', 'org-1']);
      expect(dashboardKeys.full('org-1')).toEqual(['dashboard', 'full', 'org-1']);
    });
  });

  describe('useDashboard', () => {
    it('should not fetch when not authenticated', async () => {
      // Update mock to unauthenticated state
      Object.assign(mockAuthValue, {
        user: null,
        organization: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      // Query should be disabled
      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should fetch dashboard data when authenticated', async () => {
      const mockData = {
        stats: createMockDashboardStats(),
        sectionStats: createMockSectionStats(),
        recentBookings: createMockRecentBookings(5),
        upcomingBookings: createMockRecentBookings(5),
      };

      vi.mocked(dashboardService.getDashboardData).mockResolvedValue({
        success: true,
        data: mockData,
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(dashboardService.getDashboardData).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      vi.mocked(dashboardService.getDashboardData).mockResolvedValue({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch' },
      });

      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useDashboardStats', () => {
    it('should fetch stats when authenticated', async () => {
      const mockStats = createMockDashboardStats();

      vi.mocked(dashboardService.getStats).mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
    });
  });

  describe('useSectionStats', () => {
    it('should fetch section stats when authenticated', async () => {
      const mockStats = createMockSectionStats();

      vi.mocked(dashboardService.getSectionStats).mockResolvedValue({
        success: true,
        data: mockStats,
      });

      const { result } = renderHook(() => useSectionStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
    });

    it('should not fetch when not authenticated', async () => {
      Object.assign(mockAuthValue, {
        user: null,
        organization: null,
      });

      const { result } = renderHook(() => useSectionStats(), {
        wrapper: createWrapper(),
      });

      // Query should be disabled, data undefined
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useRecentBookings', () => {
    it('should fetch recent bookings with default limit', async () => {
      const mockBookings = createMockRecentBookings(5);

      vi.mocked(dashboardService.getRecentBookings).mockResolvedValue({
        success: true,
        data: mockBookings,
      });

      const { result } = renderHook(() => useRecentBookings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getRecentBookings).toHaveBeenCalledWith(
        expect.anything(),
        mockOrgId,
        5 // default limit
      );
    });

    it('should respect custom limit', async () => {
      vi.mocked(dashboardService.getRecentBookings).mockResolvedValue({
        success: true,
        data: createMockRecentBookings(3),
      });

      renderHook(() => useRecentBookings(3), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(dashboardService.getRecentBookings).toHaveBeenCalledWith(
          expect.anything(),
          mockOrgId,
          3
        );
      });
    });
  });

  describe('useUpcomingBookings', () => {
    it('should fetch upcoming bookings', async () => {
      const mockBookings = createMockRecentBookings(5);

      vi.mocked(dashboardService.getUpcomingBookings).mockResolvedValue({
        success: true,
        data: mockBookings,
      });

      const { result } = renderHook(() => useUpcomingBookings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockBookings);
    });
  });

  describe('usePendingApprovals', () => {
    it('should fetch pending approvals with default limit', async () => {
      const mockBookings = createMockRecentBookings(10);

      vi.mocked(dashboardService.getPendingApprovals).mockResolvedValue({
        success: true,
        data: mockBookings,
      });

      const { result } = renderHook(() => usePendingApprovals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(dashboardService.getPendingApprovals).toHaveBeenCalledWith(
        expect.anything(),
        mockOrgId,
        10 // default limit
      );
    });

    it('should handle empty result', async () => {
      vi.mocked(dashboardService.getPendingApprovals).mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => usePendingApprovals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });
});
