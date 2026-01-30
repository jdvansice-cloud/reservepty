'use client';

import { BaseRepository, FilterCondition } from './base';
import type { Database } from '@/types/database';
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api.types';
import { createSuccessResponse, createErrorResponse } from '@/lib/types/api.types';

// ============================================================================
// TYPES
// ============================================================================

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];
type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
type MemberRole = Database['public']['Enums']['organization_role'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface OrganizationWithSubscription extends Organization {
  subscription?: Subscription;
}

export interface MemberWithProfile extends OrganizationMember {
  profile?: Profile;
  tier?: {
    id: string;
    name: string;
    color: string;
    priority: number;
  };
}

export interface DetailedMember {
  member_id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: MemberRole;
  tier_id: string | null;
  tier_name: string | null;
  tier_color: string | null;
  joined_at: string;
  reservation_count: number;
}

export interface OrganizationStats {
  member_count: number;
  asset_count: number;
  assets_by_section: Record<string, number>;
  upcoming_reservations: number;
  pending_approvals: number;
  completed_this_month: number;
  utilization_rate: number;
}

export interface UserPermissions {
  is_member: boolean;
  role: MemberRole | null;
  tier_id: string | null;
  tier_name: string | null;
  tier_priority: number | null;
  can_manage_assets: boolean;
  can_manage_members: boolean;
  can_approve_reservations: boolean;
  can_manage_tiers: boolean;
  can_view_audit_logs: boolean;
}

// ============================================================================
// ORGANIZATION REPOSITORY
// ============================================================================

export class OrganizationRepository extends BaseRepository<'organizations'> {
  constructor() {
    super('organizations');
  }

  /**
   * Find organization with subscription details
   */
  async findByIdWithSubscription(id: string): Promise<ApiResponse<OrganizationWithSubscription>> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          *,
          subscription:subscriptions(*)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse('NOT_FOUND', 'Organization not found');
        }
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      // Handle subscription as array from join
      const org = data as unknown as OrganizationWithSubscription & { subscription: Subscription[] | Subscription };
      if (Array.isArray(org.subscription)) {
        (org as OrganizationWithSubscription).subscription = org.subscription[0] || undefined;
      }

      return createSuccessResponse(org as OrganizationWithSubscription);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Get organizations for a user
   */
  async findByUserId(userId: string): Promise<ApiResponse<Organization[]>> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select(`
          *,
          organization_members!inner(user_id)
        `)
        .eq('organization_members.user_id', userId)
        .is('deleted_at', null)
        .order('legal_name', { ascending: true });

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse((data || []) as unknown as Organization[]);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Get organization statistics (calls database function)
   */
  async getStats(organizationId: string): Promise<ApiResponse<OrganizationStats>> {
    try {
      const { data, error } = await this.supabase.rpc('get_organization_stats', {
        p_organization_id: organizationId,
      });

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      const result = Array.isArray(data) ? data[0] : data;
      return createSuccessResponse(result as OrganizationStats);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Get user's permissions for organization (calls database function)
   */
  async getUserPermissions(
    userId: string,
    organizationId: string
  ): Promise<ApiResponse<UserPermissions>> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_permissions', {
        p_user_id: userId,
        p_organization_id: organizationId,
      });

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      const result = Array.isArray(data) ? data[0] : data;

      // If no result, user is not a member
      if (!result) {
        return createSuccessResponse({
          is_member: false,
          role: null,
          tier_id: null,
          tier_name: null,
          tier_priority: null,
          can_manage_assets: false,
          can_manage_members: false,
          can_approve_reservations: false,
          can_manage_tiers: false,
          can_view_audit_logs: false,
        });
      }

      return createSuccessResponse(result as UserPermissions);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Get members with detailed info (calls database function)
   */
  async getMembersDetailed(organizationId: string): Promise<ApiResponse<DetailedMember[]>> {
    try {
      const { data, error } = await this.supabase.rpc('get_organization_members_detailed', {
        p_organization_id: organizationId,
      });

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse((data || []) as DetailedMember[]);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Get members with profiles
   */
  async getMembers(
    organizationId: string,
    options?: { page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<MemberWithProfile>> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      const [countResult, dataResult] = await Promise.all([
        this.supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        this.supabase
          .from('organization_members')
          .select(`
            *,
            profile:profiles(*),
            tier:tiers(id, name, color, priority)
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1),
      ]);

      if (dataResult.error) {
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: dataResult.error.message,
            timestamp: new Date().toISOString(),
          },
          success: false,
          pagination: {
            page,
            pageSize,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      const totalCount = countResult.count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: (dataResult.data || []) as unknown as MemberWithProfile[],
        error: null,
        success: true,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
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
  }

  /**
   * Add a member to organization
   */
  async addMember(
    organizationId: string,
    userId: string,
    role: MemberRole = 'member',
    tierId?: string
  ): Promise<ApiResponse<OrganizationMember>> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role,
          tier_id: tierId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return createErrorResponse('CONFLICT', 'User is already a member');
        }
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse(data as OrganizationMember);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Update member role or tier
   */
  async updateMember(
    memberId: string,
    updates: { role?: MemberRole; tier_id?: string | null }
  ): Promise<ApiResponse<OrganizationMember>> {
    try {
      const { data, error } = await this.supabase
        .from('organization_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        return createErrorResponse('DATABASE_ERROR', error.message);
      }

      return createSuccessResponse(data as OrganizationMember);
    } catch (err) {
      return createErrorResponse(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * Remove a member from organization
   */
  async removeMember(memberId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

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

  /**
   * Check if user is a member
   */
  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const { count } = await this.supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    return (count || 0) > 0;
  }

  /**
   * Get user's role in organization
   */
  async getUserRole(
    organizationId: string,
    userId: string
  ): Promise<MemberRole | null> {
    const { data } = await this.supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    return data?.role || null;
  }
}

// Export singleton instance
export const organizationRepository = new OrganizationRepository();
