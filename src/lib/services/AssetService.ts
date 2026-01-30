'use client';

import { BaseService, ServiceContext } from './base';
import {
  AssetRepository,
  assetRepository,
  AssetWithPhotos,
  AssetQueryOptions,
  SearchAssetsResult,
} from '@/lib/repositories';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api.types';
import { createErrorResponse, createSuccessResponse } from '@/lib/types/api.types';
import {
  createAssetSchema,
  updateAssetSchema,
  CreateAssetInput,
  UpdateAssetInput,
} from '@/lib/validations';
import type { Database } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

type Asset = Database['public']['Tables']['assets']['Row'];
type AssetSection = Database['public']['Enums']['asset_section'];
type AssetPhoto = Database['public']['Tables']['asset_photos']['Row'];

// ============================================================================
// ASSET SERVICE
// ============================================================================

export class AssetService extends BaseService<'assets'> {
  private assetRepo: AssetRepository;

  constructor() {
    super(assetRepository, 'AssetService');
    this.assetRepo = assetRepository;
  }

  /**
   * Get assets for an organization
   */
  async getAssets(
    ctx: ServiceContext,
    options: AssetQueryOptions
  ): Promise<PaginatedResponse<Asset>> {
    // Verify user has access to organization
    if (ctx.organizationId && ctx.organizationId !== options.organizationId) {
      return {
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this organization',
          timestamp: new Date().toISOString(),
        },
        success: false,
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    return this.assetRepo.findByOrganization(options);
  }

  /**
   * Get single asset with photos
   */
  async getAssetWithPhotos(
    ctx: ServiceContext,
    assetId: string
  ): Promise<ApiResponse<AssetWithPhotos>> {
    const result = await this.assetRepo.findByIdWithPhotos(assetId);

    if (!result.success) {
      return result;
    }

    // Verify user has access
    if (ctx.organizationId && result.data?.organization_id !== ctx.organizationId) {
      return this.unauthorized('You do not have access to this asset');
    }

    return result;
  }

  /**
   * Create a new asset
   */
  async createAsset(
    ctx: ServiceContext,
    input: CreateAssetInput
  ): Promise<ApiResponse<Asset>> {
    // Validate input
    const validation = this.validate(createAssetSchema, input);
    if (!validation.success) {
      return validation as ApiResponse<Asset>;
    }

    // Verify user can create assets in this organization
    if (ctx.organizationId && ctx.organizationId !== input.organization_id) {
      return this.unauthorized('You cannot create assets in this organization');
    }

    // Check permission (must be admin or higher)
    const hasPermission = await this.checkAssetPermission(ctx, input.organization_id);
    if (!hasPermission) {
      return this.unauthorized('You do not have permission to create assets');
    }

    return this.assetRepo.create({
      organization_id: input.organization_id,
      section: input.section,
      name: input.name,
      description: input.description,
      details: input.details as Database['public']['Tables']['assets']['Insert']['details'],
      primary_photo_url: input.primary_photo_url,
      is_active: input.is_active,
    });
  }

  /**
   * Update an asset
   */
  async updateAsset(
    ctx: ServiceContext,
    assetId: string,
    input: UpdateAssetInput
  ): Promise<ApiResponse<Asset>> {
    // Validate input
    const validation = this.validate(updateAssetSchema, input);
    if (!validation.success) {
      return validation as ApiResponse<Asset>;
    }

    // Get existing asset
    const existing = await this.assetRepo.findById(assetId);
    if (!existing.success || !existing.data) {
      return this.notFound('Asset');
    }

    // Verify access
    if (ctx.organizationId && existing.data.organization_id !== ctx.organizationId) {
      return this.unauthorized('You do not have access to this asset');
    }

    // Check permission
    const hasPermission = await this.checkAssetPermission(ctx, existing.data.organization_id);
    if (!hasPermission) {
      return this.unauthorized('You do not have permission to update assets');
    }

    return this.assetRepo.update(assetId, {
      name: input.name,
      description: input.description,
      details: input.details as Database['public']['Tables']['assets']['Update']['details'],
      primary_photo_url: input.primary_photo_url,
      is_active: input.is_active,
    });
  }

  /**
   * Delete an asset (soft delete)
   */
  async deleteAsset(
    ctx: ServiceContext,
    assetId: string
  ): Promise<ApiResponse<void>> {
    // Get existing asset
    const existing = await this.assetRepo.findById(assetId);
    if (!existing.success || !existing.data) {
      return this.notFound('Asset');
    }

    // Verify access
    if (ctx.organizationId && existing.data.organization_id !== ctx.organizationId) {
      return this.unauthorized('You do not have access to this asset');
    }

    // Check permission
    const hasPermission = await this.checkAssetPermission(ctx, existing.data.organization_id);
    if (!hasPermission) {
      return this.unauthorized('You do not have permission to delete assets');
    }

    const result = await this.assetRepo.softDelete(assetId);
    if (!result.success) {
      return result as unknown as ApiResponse<void>;
    }

    return createSuccessResponse(undefined);
  }

  /**
   * Search assets
   */
  async searchAssets(
    ctx: ServiceContext,
    organizationId: string,
    query?: string,
    section?: AssetSection,
    limit = 20,
    offset = 0
  ): Promise<ApiResponse<SearchAssetsResult[]>> {
    // Verify access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
      return this.unauthorized('You do not have access to this organization');
    }

    return this.assetRepo.search(organizationId, query, section, limit, offset);
  }

  /**
   * Get asset counts by section
   */
  async getAssetCounts(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<ApiResponse<Record<AssetSection, number>>> {
    // Verify access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
      return this.unauthorized('You do not have access to this organization');
    }

    return this.assetRepo.countBySection(organizationId);
  }

  /**
   * Add photo to asset
   */
  async addPhoto(
    ctx: ServiceContext,
    assetId: string,
    url: string,
    caption?: string
  ): Promise<ApiResponse<AssetPhoto>> {
    // Get existing asset
    const existing = await this.assetRepo.findById(assetId);
    if (!existing.success || !existing.data) {
      return this.notFound('Asset');
    }

    // Verify access and permission
    if (ctx.organizationId && existing.data.organization_id !== ctx.organizationId) {
      return this.unauthorized('You do not have access to this asset');
    }

    const hasPermission = await this.checkAssetPermission(ctx, existing.data.organization_id);
    if (!hasPermission) {
      return this.unauthorized('You do not have permission to modify assets');
    }

    return this.assetRepo.addPhoto(assetId, url, caption);
  }

  /**
   * Remove photo from asset
   */
  async removePhoto(
    ctx: ServiceContext,
    assetId: string,
    photoId: string
  ): Promise<ApiResponse<void>> {
    // Get existing asset to verify access
    const existing = await this.assetRepo.findById(assetId);
    if (!existing.success || !existing.data) {
      return this.notFound('Asset');
    }

    if (ctx.organizationId && existing.data.organization_id !== ctx.organizationId) {
      return this.unauthorized('You do not have access to this asset');
    }

    const hasPermission = await this.checkAssetPermission(ctx, existing.data.organization_id);
    if (!hasPermission) {
      return this.unauthorized('You do not have permission to modify assets');
    }

    return this.assetRepo.removePhoto(photoId);
  }

  /**
   * Check if user has permission to manage assets
   */
  private async checkAssetPermission(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<boolean> {
    if (!ctx.userId) return false;

    // In production, check actual role from database
    // For now, allow if role is admin or owner
    return ctx.role === 'admin' || ctx.role === 'owner';
  }
}

// Export singleton instance
export const assetService = new AssetService();
