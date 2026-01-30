'use client';

import { BaseService, ServiceContext } from './base';
import {
  OrganizationRepository,
  organizationRepository,
  OrganizationWithSubscription,
  DetailedMember,
  OrganizationStats,
  UserPermissions,
  MemberWithProfile,
} from '@/lib/repositories';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api.types';
import { createErrorResponse, createSuccessResponse } from '@/lib/types/api.types';
import type { Database } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type MemberRole = Database['public']['Enums']['organization_role'];

// ============================================================================
// ORGANIZATION SERVICE
// ============================================================================

export class OrganizationService extends BaseService<'organizations'> {
  private orgRepo: OrganizationRepository;

  constructor() {
    super(organizationRepository, 'OrganizationService');
    this.orgRepo = organizationRepository;
  }

  /**
   * Get organization with subscription details
   */
  async getOrganization(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<ApiResponse<OrganizationWithSubscription>> {
    // Verify access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
      return this.unauthorized('You do not have access to this organization');
    }

    return this.orgRepo.findByIdWithSubscription(organizationId);
  }

  /**
   * Get all organizations for a user
   */
  async getUserOrganizations(
    ctx: ServiceContext
  ): Promise<ApiResponse<Organization[]>> {
    if (!ctx.userId) {
      return createErrorResponse('UNAUTHORIZED', 'You must be logged in');
    }

    return this.orgRepo.findByUserId(ctx.userId);
  }

  /**
   * Create a new organization
   */
  async createOrganization(
    ctx: ServiceContext,
    input: {
      legalName: string;
      commercialName?: string;
      ruc?: string;
      dv?: string;
      billingEmail?: string;
      logoUrl?: string;
    }
  ): Promise<ApiResponse<Organization>> {
    if (!ctx.userId) {
      return createErrorResponse('UNAUTHORIZED', 'You must be logged in');
    }

    // Validate required fields
    if (!input.legalName || input.legalName.trim().length === 0) {
      return createErrorResponse('VALIDATION_ERROR', 'Legal name is required');
    }

    // Create organization
    const orgResult = await this.orgRepo.create({
      legal_name: input.legalName.trim(),
      commercial_name: input.commercialName?.trim() || null,
      ruc: input.ruc?.trim() || null,
      dv: input.dv?.trim() || null,
      billing_email: input.billingEmail?.trim() || null,
      logo_url: input.logoUrl || null,
    });

    if (!orgResult.success || !orgResult.data) {
      return orgResult;
    }

    // Add creator as owner
    const memberResult = await this.orgRepo.addMember(
      orgResult.data.id,
      ctx.userId,
      'owner'
    );

    if (!memberResult.success) {
      // Rollback organization creation
      await this.orgRepo.delete(orgResult.data.id);
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to add you as organization owner'
      );
    }

    return orgResult;
  }

  /**
   * Update organization details
   */
  async updateOrganization(
    ctx: ServiceContext,
    organizationId: string,
    input: Partial<{
      legalName: string;
      commercialName: string;
      ruc: string;
      dv: string;
      billingEmail: string;
      logoUrl: string;
    }>
  ): Promise<ApiResponse<Organization>> {
    // Verify access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
      return this.unauthorized('You do not have access to this organization');
    }

    // Check permission (admin or owner)
    const canUpdate = ctx.role === 'admin' || ctx.role === 'owner';
    if (!canUpdate) {
      return this.unauthorized('You do not have permission to update this organization');
    }

    return this.orgRepo.update(organizationId, {
      legal_name: input.legalName?.trim(),
      commercial_name: input.commercialName?.trim(),
      ruc: input.ruc?.trim(),
      dv: input.dv?.trim(),
      billing_email: input.billingEmail?.trim(),
      logo_url: input.logoUrl,
    });
  }

  /**
   * Get organization statistics
   */
  async getStats(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<ApiResponse<OrganizationStats>> {
    // Verify access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
      return this.unauthorized('You do not have access to this organization');
    }

    return this.orgRepo.getStats(organizationId);
  }

  /**
   * Get user's permissions in organization
   */
  async getUserPermissions(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<ApiResponse<UserPermissions>> {
    if (!ctx.userId) {
      return createErrorResponse('UNAUTHORIZED', 'You must be logged in');
    }

    return this.orgRepo.getUserPermissions(ctx.userId, organizationId);
  }

  /**
   * Get members with detailed information
   */
  async getMembers(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<ApiResponse<DetailedMember[]>> {
    // Verify access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
      return this.unauthorized('You do not have access to this organization');
    }

    return this.orgRepo.getMembersDetailed(organizationId);
  }

  /**
   * Get members with pagination
   */
  async getMembersPaginated(
    ctx: ServiceContext,
    organizationId: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<MemberWithProfile>> {
    // Verify access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
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

    return this.orgRepo.getMembers(organizationId, { page, pageSize });
  }

  /**
   * Add a member to organization
   */
  async addMember(
    ctx: ServiceContext,
    organizationId: string,
    userId: string,
    role: MemberRole = 'member',
    tierId?: string
  ): Promise<ApiResponse<Database['public']['Tables']['organization_members']['Row']>> {
    // Verify access
    if (ctx.organizationId && ctx.organizationId !== organizationId) {
      return this.unauthorized('You do not have access to this organization');
    }

    // Check permission (admin or owner)
    const canAdd = ctx.role === 'admin' || ctx.role === 'owner';
    if (!canAdd) {
      return this.unauthorized('You do not have permission to add members');
    }

    // Prevent adding owner role (only one owner allowed)
    if (role === 'owner') {
      return createErrorResponse('BAD_REQUEST', 'Cannot add another owner to the organization');
    }

    return this.orgRepo.addMember(organizationId, userId, role, tierId);
  }

  /**
   * Update a member's role or tier
   */
  async updateMember(
    ctx: ServiceContext,
    memberId: string,
    updates: { role?: MemberRole; tierId?: string | null }
  ): Promise<ApiResponse<Database['public']['Tables']['organization_members']['Row']>> {
    // Check permission
    const canUpdate = ctx.role === 'admin' || ctx.role === 'owner';
    if (!canUpdate) {
      return this.unauthorized('You do not have permission to update members');
    }

    // Prevent changing to owner role
    if (updates.role === 'owner') {
      return createErrorResponse('BAD_REQUEST', 'Cannot change role to owner');
    }

    return this.orgRepo.updateMember(memberId, {
      role: updates.role,
      tier_id: updates.tierId,
    });
  }

  /**
   * Remove a member from organization
   */
  async removeMember(
    ctx: ServiceContext,
    memberId: string
  ): Promise<ApiResponse<void>> {
    // Check permission
    const canRemove = ctx.role === 'admin' || ctx.role === 'owner';
    if (!canRemove) {
      return this.unauthorized('You do not have permission to remove members');
    }

    return this.orgRepo.removeMember(memberId);
  }

  /**
   * Check if user is a member of organization
   */
  async isMember(
    ctx: ServiceContext,
    organizationId: string,
    userId?: string
  ): Promise<boolean> {
    const userToCheck = userId || ctx.userId;
    if (!userToCheck) return false;

    return this.orgRepo.isMember(organizationId, userToCheck);
  }

  /**
   * Get user's role in organization
   */
  async getUserRole(
    ctx: ServiceContext,
    organizationId: string,
    userId?: string
  ): Promise<MemberRole | null> {
    const userToCheck = userId || ctx.userId;
    if (!userToCheck) return null;

    return this.orgRepo.getUserRole(organizationId, userToCheck);
  }
}

// Export singleton instance
export const organizationService = new OrganizationService();
