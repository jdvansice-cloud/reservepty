'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import { assetService } from '@/lib/services/AssetService';
import type { Database } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

type Asset = Database['public']['Tables']['assets']['Row'];
type AssetSection = Database['public']['Enums']['asset_section'];

export interface AssetFilters {
  section?: AssetSection;
  search?: string;
  isActive?: boolean;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (orgId: string, filters?: AssetFilters) =>
    [...assetKeys.lists(), orgId, filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  bySection: (orgId: string, section: AssetSection) =>
    [...assetKeys.lists(), orgId, 'section', section] as const,
  counts: (orgId: string) => [...assetKeys.all, 'counts', orgId] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all assets for an organization with optional filters
 */
export function useAssets(filters?: AssetFilters) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: assetKeys.list(organization?.id || '', filters),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return [];
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await assetService.getAssets(ctx, {
        organizationId: organization.id,
        section: filters?.section,
        search: filters?.search,
        isActive: filters?.isActive,
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch assets');
      }

      return result.data || [];
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a single asset by ID
 */
export function useAsset(assetId: string) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return null;
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await assetService.getAssetWithPhotos(ctx, assetId);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch asset');
      }

      return result.data;
    },
    enabled: !!assetId && !!organization?.id && !!user?.id,
  });
}

/**
 * Hook to fetch assets by section
 */
export function useAssetsBySection(section: AssetSection) {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: assetKeys.bySection(organization?.id || '', section),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return [];
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await assetService.getAssets(ctx, {
        organizationId: organization.id,
        section,
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch assets');
      }

      return result.data || [];
    },
    enabled: !!organization?.id && !!user?.id && !!section,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch asset counts by section
 */
export function useAssetCounts() {
  const { organization, user } = useAuth();

  return useQuery({
    queryKey: assetKeys.counts(organization?.id || ''),
    queryFn: async () => {
      if (!organization?.id || !user?.id) {
        return null;
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await assetService.getAssetCounts(ctx, organization.id);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch asset counts');
      }

      return result.data;
    },
    enabled: !!organization?.id && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new asset
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      section: AssetSection;
      description?: string;
      details?: Record<string, unknown>;
      photos?: Array<{ url: string; caption?: string; order: number }>;
    }) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Not authenticated');
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
      };

      const result = await assetService.createAsset(ctx, {
        organization_id: organization.id,
        section: input.section,
        name: input.name,
        description: input.description,
        details: input.details,
        is_active: true,
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create asset');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch assets list
      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(),
      });
      // Invalidate counts
      queryClient.invalidateQueries({
        queryKey: assetKeys.counts(organization?.id || ''),
      });
    },
  });
}

/**
 * Hook to update an asset
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        description: string | null;
        details: Record<string, unknown>;
        is_active: boolean;
      }>;
    }) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Not authenticated');
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
        role: 'admin' as const,
      };

      const result = await assetService.updateAsset(ctx, id, data);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update asset');
      }

      return result.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: assetKeys.detail(id) });

      // Snapshot previous value
      const previousAsset = queryClient.getQueryData<Asset>(assetKeys.detail(id));

      // Optimistically update
      if (previousAsset) {
        queryClient.setQueryData<Asset>(assetKeys.detail(id), {
          ...previousAsset,
          name: data.name ?? previousAsset.name,
          description: data.description ?? previousAsset.description,
          is_active: data.is_active ?? previousAsset.is_active,
        });
      }

      return { previousAsset };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousAsset) {
        queryClient.setQueryData(assetKeys.detail(id), context.previousAsset);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

/**
 * Hook to soft delete an asset
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async (assetId: string) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Not authenticated');
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
        role: 'admin' as const,
      };

      const result = await assetService.deleteAsset(ctx, assetId);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete asset');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: assetKeys.counts(organization?.id || ''),
      });
    },
  });
}

/**
 * Hook to toggle asset active status
 */
export function useToggleAssetStatus() {
  const queryClient = useQueryClient();
  const { organization, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      assetId,
      isActive,
    }: {
      assetId: string;
      isActive: boolean;
    }) => {
      if (!organization?.id || !user?.id) {
        throw new Error('Not authenticated');
      }

      const ctx = {
        userId: user.id,
        organizationId: organization.id,
        role: 'admin' as const,
      };

      const result = await assetService.updateAsset(ctx, assetId, { is_active: isActive });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update asset status');
      }

      return result.data;
    },
    onSuccess: (_data, { assetId }) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}
