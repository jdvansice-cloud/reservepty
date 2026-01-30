'use client';

import { BaseRepository, FilterCondition } from './base';
import type { Database } from '@/types/database';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api.types';
import { createSuccessResponse, createErrorResponse } from '@/lib/types/api.types';

// ============================================================================
// TYPES
// ============================================================================

type Asset = Database['public']['Tables']['assets']['Row'];
type AssetInsert = Database['public']['Tables']['assets']['Insert'];
type AssetUpdate = Database['public']['Tables']['assets']['Update'];
type AssetSection = Database['public']['Enums']['asset_section'];
type AssetPhoto = Database['public']['Tables']['asset_photos']['Row'];

export interface AssetWithPhotos extends Asset {
  photos?: AssetPhoto[];
}

export interface AssetQueryOptions {
  organizationId: string;
  section?: AssetSection;
  isActive?: boolean;
  includeDeleted?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchAssetsResult {
  id: string;
  name: string;
  description: string | null;
  section: AssetSection;
  primary_photo_url: string | null;
  details: unknown;
  is_active: boolean;
  created_at: string;
  rank: number;
}

// ============================================================================
// ASSET REPOSITORY
// ============================================================================

export class AssetRepository extends BaseRepository<'assets'> {
  constructor() {
    super('assets');
  }

  /**
   * Find assets by organization with optional filters
   */
  async findByOrganization(
    options: AssetQueryOptions
  ): Promise<PaginatedResponse<Asset>> {
    const filters: FilterCondition<Asset>[] = [
      { field: 'organization_id', operator: 'eq', value: options.organizationId },
    ];

    if (options.section) {
      filters.push({ field: 'section', operator: 'eq', value: options.section });
    }

    if (options.isActive !== undefined) {
      filters.push({ field: 'is_active', operator: 'eq', value: options.isActive });
    }

    if (!options.includeDeleted) {
      filters.push({ field: 'deleted_at', operator: 'is', value: null });
    }

    return this.findMany({
      filters,
      pagination: {
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      },
      orderBy: {
        column: 'name',
        ascending: true,
      },
    });
  }

  /**
   * Find asset with photos
   */
  async findByIdWithPhotos(id: string): Promise<ApiResponse<AssetWithPhotos>> {
    try {
      const { data, error } = await this.supabase
        .from('assets')
        .select('*, photos:asset_photos(*)')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('NOT_FOUND', 'Asset not found');
        }
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse(data as unknown as AssetWithPhotos);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Search assets using full-text search (calls database function)
   */
  async search(
    organizationId: string,
    searchQuery?: string,
    section?: AssetSection,
    limit = 20,
    offset = 0
  ): Promise<ApiResponse<SearchAssetsResult[]>> {
    try {
      const { data, error } = await this.supabase.rpc('search_assets', {
        p_organization_id: organizationId,
        p_search_query: searchQuery || null,
        p_section: section || null,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse((data || []) as SearchAssetsResult[]);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Get asset count by section
   */
  async countBySection(organizationId: string): Promise<ApiResponse<Record<AssetSection, number>>> {
    try {
      const { data, error } = await this.supabase
        .from('assets')
        .select('section')
        .eq('organization_id', organizationId)
        .is('deleted_at', null);

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      const counts: Record<AssetSection, number> = {
        planes: 0,
        helicopters: 0,
        residences: 0,
        watercraft: 0,
      };

      (data || []).forEach((asset) => {
        const section = asset.section as AssetSection;
        if (section in counts) {
          counts[section]++;
        }
      });

      return createSuccessResponse(counts);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Check if asset belongs to organization
   */
  async belongsToOrganization(assetId: string, organizationId: string): Promise<boolean> {
    const { count } = await this.supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('id', assetId)
      .eq('organization_id', organizationId);

    return (count || 0) > 0;
  }

  /**
   * Get photos for an asset
   */
  async getPhotos(assetId: string): Promise<ApiResponse<AssetPhoto[]>> {
    try {
      const { data, error } = await this.supabase
        .from('asset_photos')
        .select('*')
        .eq('asset_id', assetId)
        .order('display_order', { ascending: true });

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse((data || []) as AssetPhoto[]);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Add a photo to an asset
   */
  async addPhoto(
    assetId: string,
    url: string,
    caption?: string,
    displayOrder?: number
  ): Promise<ApiResponse<AssetPhoto>> {
    try {
      // Get max order if not provided
      let order = displayOrder;
      if (order === undefined) {
        const { data: existing } = await this.supabase
          .from('asset_photos')
          .select('display_order')
          .eq('asset_id', assetId)
          .order('display_order', { ascending: false })
          .limit(1);

        order = (existing?.[0]?.display_order ?? -1) + 1;
      }

      const { data, error } = await this.supabase
        .from('asset_photos')
        .insert({
          asset_id: assetId,
          url,
          caption,
          display_order: order,
        })
        .select()
        .single();

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse(data as AssetPhoto);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Remove a photo
   */
  async removePhoto(photoId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('asset_photos')
        .delete()
        .eq('id', photoId);

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse(undefined);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }
}

// Export singleton instance
export const assetRepository = new AssetRepository();
