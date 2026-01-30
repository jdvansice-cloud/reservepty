import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockAsset, createMockAssets } from '@/test/mocks/data';
import { createMockAuthContext } from '@/test/mocks/auth';

// Mock the auth provider before importing hooks
const mockAuthValue = createMockAuthContext();

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the asset service
vi.mock('@/lib/services/AssetService', () => ({
  assetService: {
    getAssets: vi.fn(),
    getAssetWithPhotos: vi.fn(),
    getAssetCounts: vi.fn(),
    createAsset: vi.fn(),
    updateAsset: vi.fn(),
    deleteAsset: vi.fn(),
  },
  AssetService: vi.fn(),
}));

// Now import the hooks after mocking
import {
  useAssets,
  useAsset,
  useAssetsBySection,
  useAssetCounts,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useToggleAssetStatus,
  assetKeys,
} from '../useAssets';
import { assetService } from '@/lib/services/AssetService';

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
function createWrapper() {
  const queryClient = createTestQueryClient();

  return {
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
    queryClient,
  };
}

describe('Asset Hooks', () => {
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

  describe('assetKeys', () => {
    it('should generate correct query keys', () => {
      expect(assetKeys.all).toEqual(['assets']);
      expect(assetKeys.lists()).toEqual(['assets', 'list']);
      expect(assetKeys.list('org-1')).toEqual(['assets', 'list', 'org-1', undefined]);
      expect(assetKeys.list('org-1', { section: 'planes' })).toEqual([
        'assets',
        'list',
        'org-1',
        { section: 'planes' },
      ]);
      expect(assetKeys.details()).toEqual(['assets', 'detail']);
      expect(assetKeys.detail('asset-1')).toEqual(['assets', 'detail', 'asset-1']);
      expect(assetKeys.bySection('org-1', 'planes')).toEqual([
        'assets',
        'list',
        'org-1',
        'section',
        'planes',
      ]);
      expect(assetKeys.counts('org-1')).toEqual(['assets', 'counts', 'org-1']);
    });
  });

  describe('useAssets', () => {
    it('should not fetch when not authenticated', async () => {
      Object.assign(mockAuthValue, {
        user: null,
        organization: null,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAssets(), { wrapper });

      // Query should be disabled
      expect(result.current.isFetching).toBe(false);
    });

    it('should fetch assets when authenticated', async () => {
      const mockAssets = createMockAssets(3);

      vi.mocked(assetService.getAssets).mockResolvedValue({
        success: true,
        data: mockAssets,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAssets(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAssets);
      expect(assetService.getAssets).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          organizationId: mockOrgId,
        }),
        expect.objectContaining({
          organizationId: mockOrgId,
        })
      );
    });

    it('should filter by section', async () => {
      const mockAssets = createMockAssets(2, 'planes');

      vi.mocked(assetService.getAssets).mockResolvedValue({
        success: true,
        data: mockAssets,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAssets({ section: 'planes' }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(assetService.getAssets).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          section: 'planes',
        })
      );
    });

    it('should handle errors', async () => {
      vi.mocked(assetService.getAssets).mockResolvedValue({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch' },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAssets(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAsset', () => {
    it('should fetch a single asset by ID', async () => {
      const mockAsset = createMockAsset({ id: 'asset-1' });

      vi.mocked(assetService.getAssetWithPhotos).mockResolvedValue({
        success: true,
        data: { asset: mockAsset, photos: [] },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAsset('asset-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(assetService.getAssetWithPhotos).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          organizationId: mockOrgId,
        }),
        'asset-1'
      );
    });

    it('should not fetch when assetId is empty', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAsset(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(assetService.getAssetWithPhotos).not.toHaveBeenCalled();
    });
  });

  describe('useAssetsBySection', () => {
    it('should fetch assets by section', async () => {
      const mockAssets = createMockAssets(2, 'helicopters');

      vi.mocked(assetService.getAssets).mockResolvedValue({
        success: true,
        data: mockAssets,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAssetsBySection('helicopters'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(assetService.getAssets).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          section: 'helicopters',
        })
      );
    });
  });

  describe('useAssetCounts', () => {
    it('should fetch asset counts', async () => {
      const mockCounts = {
        planes: 3,
        helicopters: 2,
        residences: 5,
        watercraft: 1,
      };

      vi.mocked(assetService.getAssetCounts).mockResolvedValue({
        success: true,
        data: mockCounts,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAssetCounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCounts);
    });
  });

  describe('useCreateAsset', () => {
    it('should create a new asset', async () => {
      const newAsset = createMockAsset({
        name: 'New Plane',
        section: 'planes',
      });

      vi.mocked(assetService.createAsset).mockResolvedValue({
        success: true,
        data: newAsset,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateAsset(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'New Plane',
          section: 'planes',
        });
      });

      expect(assetService.createAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          organizationId: mockOrgId,
        }),
        expect.objectContaining({
          name: 'New Plane',
          section: 'planes',
          organization_id: mockOrgId,
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      Object.assign(mockAuthValue, {
        user: null,
        organization: null,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateAsset(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({
            name: 'Test',
            section: 'planes',
          });
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('useUpdateAsset', () => {
    it('should update an asset', async () => {
      const updatedAsset = createMockAsset({
        id: 'asset-1',
        name: 'Updated Plane',
      });

      vi.mocked(assetService.updateAsset).mockResolvedValue({
        success: true,
        data: updatedAsset,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAsset(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'asset-1',
          data: { name: 'Updated Plane' },
        });
      });

      expect(assetService.updateAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          organizationId: mockOrgId,
        }),
        'asset-1',
        { name: 'Updated Plane' }
      );
    });

    it('should handle update errors', async () => {
      vi.mocked(assetService.updateAsset).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Asset not found' },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAsset(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({
            id: 'nonexistent',
            data: { name: 'Test' },
          });
        })
      ).rejects.toThrow('Asset not found');
    });
  });

  describe('useDeleteAsset', () => {
    it('should soft delete an asset', async () => {
      vi.mocked(assetService.deleteAsset).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAsset(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('asset-1');
      });

      expect(assetService.deleteAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          organizationId: mockOrgId,
        }),
        'asset-1'
      );
    });
  });

  describe('useToggleAssetStatus', () => {
    it('should toggle asset active status', async () => {
      const updatedAsset = createMockAsset({
        id: 'asset-1',
        is_active: false,
      });

      vi.mocked(assetService.updateAsset).mockResolvedValue({
        success: true,
        data: updatedAsset,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAssetStatus(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          assetId: 'asset-1',
          isActive: false,
        });
      });

      expect(assetService.updateAsset).toHaveBeenCalledWith(
        expect.anything(),
        'asset-1',
        { is_active: false }
      );
    });
  });
});
