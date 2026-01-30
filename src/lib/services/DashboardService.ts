'use client';

import { BaseService, ServiceContext } from './base';
import { assetRepository, reservationRepository, organizationRepository } from '@/lib/repositories';
import type { ApiResponse } from '@/lib/types/api.types';
import { createSuccessResponse, createErrorResponse } from '@/lib/types/api.types';
import type { Database } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

type AssetSection = Database['public']['Enums']['asset_section'];
type ReservationStatus = Database['public']['Enums']['reservation_status'];

export interface DashboardStats {
  totalAssets: number;
  activeBookings: number;
  totalMembers: number;
  monthlyBookings: number;
  pendingApprovals: number;
}

export interface SectionStats {
  section: AssetSection;
  assetCount: number;
  bookingCount: number;
  utilizationRate: number;
}

export interface RecentBooking {
  id: string;
  title: string | null;
  assetName: string;
  assetSection: AssetSection;
  userName: string;
  userAvatar: string | null;
  startDatetime: string;
  endDatetime: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  sectionStats: SectionStats[];
  recentBookings: RecentBooking[];
  upcomingBookings: RecentBooking[];
}

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export class DashboardService extends BaseService<'assets'> {
  constructor() {
    super(assetRepository, 'DashboardService');
  }

  /**
   * Get all dashboard statistics
   */
  async getDashboardData(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<ApiResponse<DashboardData>> {
    try {
      // Verify access
      if (ctx.organizationId && ctx.organizationId !== organizationId) {
        return this.unauthorized('You do not have access to this organization');
      }

      // Fetch all data in parallel
      const [
        statsResult,
        sectionStatsResult,
        recentResult,
        upcomingResult,
      ] = await Promise.all([
        this.getStats(ctx, organizationId),
        this.getSectionStats(ctx, organizationId),
        this.getRecentBookings(ctx, organizationId, 5),
        this.getUpcomingBookings(ctx, organizationId, 5),
      ]);

      return createSuccessResponse({
        stats: statsResult.success ? statsResult.data! : this.getEmptyStats(),
        sectionStats: sectionStatsResult.success ? sectionStatsResult.data! : [],
        recentBookings: recentResult.success ? recentResult.data! : [],
        upcomingBookings: upcomingResult.success ? upcomingResult.data! : [],
      });
    } catch (error) {
      console.error('[DashboardService] Error fetching dashboard data:', error);
      return createErrorResponse(
        'INTERNAL_ERROR',
        'Failed to fetch dashboard data'
      );
    }
  }

  /**
   * Get aggregated stats for dashboard cards
   */
  async getStats(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<ApiResponse<DashboardStats>> {
    try {
      // Verify access
      if (ctx.organizationId && ctx.organizationId !== organizationId) {
        return this.unauthorized('You do not have access to this organization');
      }

      const supabase = this.getClient();

      // Get total assets count
      const { count: totalAssets, error: assetsError } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .is('deleted_at', null);

      if (assetsError) throw assetsError;

      // Get active bookings count (approved and not ended yet)
      const now = new Date().toISOString();
      const { count: activeBookings, error: activeError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'approved')
        .gte('end_datetime', now);

      if (activeError) throw activeError;

      // Get total members count
      const { count: totalMembers, error: membersError } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (membersError) throw membersError;

      // Get this month's bookings count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyBookings, error: monthlyError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', startOfMonth.toISOString())
        .neq('status', 'canceled');

      if (monthlyError) throw monthlyError;

      // Get pending approvals count
      const { count: pendingApprovals, error: pendingError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      return createSuccessResponse({
        totalAssets: totalAssets || 0,
        activeBookings: activeBookings || 0,
        totalMembers: totalMembers || 0,
        monthlyBookings: monthlyBookings || 0,
        pendingApprovals: pendingApprovals || 0,
      });
    } catch (error) {
      console.error('[DashboardService] Error fetching stats:', error);
      return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch dashboard stats');
    }
  }

  /**
   * Get stats per section (assets, bookings, utilization)
   */
  async getSectionStats(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<ApiResponse<SectionStats[]>> {
    try {
      if (ctx.organizationId && ctx.organizationId !== organizationId) {
        return this.unauthorized('You do not have access to this organization');
      }

      const supabase = this.getClient();
      const sections: AssetSection[] = ['planes', 'helicopters', 'residences', 'watercraft'];
      const stats: SectionStats[] = [];

      // Get counts for each section
      for (const section of sections) {
        // Asset count
        const { count: assetCount } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('section', section)
          .eq('is_active', true)
          .is('deleted_at', null);

        // Booking count (this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: bookingCount } = await supabase
          .from('reservations')
          .select('*, assets!inner(section)', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('assets.section', section)
          .gte('start_datetime', startOfMonth.toISOString())
          .neq('status', 'canceled');

        // Calculate utilization (simplified - % of days with bookings this month)
        const daysInMonth = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0
        ).getDate();
        const utilizationRate = assetCount && assetCount > 0
          ? Math.min(100, Math.round(((bookingCount || 0) / (assetCount * daysInMonth)) * 100))
          : 0;

        stats.push({
          section,
          assetCount: assetCount || 0,
          bookingCount: bookingCount || 0,
          utilizationRate,
        });
      }

      return createSuccessResponse(stats);
    } catch (error) {
      console.error('[DashboardService] Error fetching section stats:', error);
      return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch section stats');
    }
  }

  /**
   * Get recent bookings for the dashboard
   */
  async getRecentBookings(
    ctx: ServiceContext,
    organizationId: string,
    limit = 5
  ): Promise<ApiResponse<RecentBooking[]>> {
    try {
      if (ctx.organizationId && ctx.organizationId !== organizationId) {
        return this.unauthorized('You do not have access to this organization');
      }

      const supabase = this.getClient();

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          title,
          start_datetime,
          end_datetime,
          status,
          created_at,
          assets (
            name,
            section
          ),
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      type BookingRow = {
        id: string;
        title: string | null;
        start_datetime: string;
        end_datetime: string;
        status: ReservationStatus;
        created_at: string;
        assets: { name: string; section: AssetSection } | null;
        profiles: { full_name: string; avatar_url: string | null } | null;
      };

      const bookings: RecentBooking[] = ((data || []) as BookingRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        assetName: row.assets?.name || 'Unknown Asset',
        assetSection: row.assets?.section || 'planes',
        userName: row.profiles?.full_name || 'Unknown User',
        userAvatar: row.profiles?.avatar_url || null,
        startDatetime: row.start_datetime,
        endDatetime: row.end_datetime,
        status: row.status,
        createdAt: row.created_at,
      }));

      return createSuccessResponse(bookings);
    } catch (error) {
      console.error('[DashboardService] Error fetching recent bookings:', error);
      return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch recent bookings');
    }
  }

  /**
   * Get upcoming bookings for the dashboard
   */
  async getUpcomingBookings(
    ctx: ServiceContext,
    organizationId: string,
    limit = 5
  ): Promise<ApiResponse<RecentBooking[]>> {
    try {
      if (ctx.organizationId && ctx.organizationId !== organizationId) {
        return this.unauthorized('You do not have access to this organization');
      }

      const supabase = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          title,
          start_datetime,
          end_datetime,
          status,
          created_at,
          assets (
            name,
            section
          ),
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId)
        .in('status', ['approved', 'pending'])
        .gte('start_datetime', now)
        .order('start_datetime', { ascending: true })
        .limit(limit);

      if (error) throw error;

      type BookingRow = {
        id: string;
        title: string | null;
        start_datetime: string;
        end_datetime: string;
        status: ReservationStatus;
        created_at: string;
        assets: { name: string; section: AssetSection } | null;
        profiles: { full_name: string; avatar_url: string | null } | null;
      };

      const bookings: RecentBooking[] = ((data || []) as BookingRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        assetName: row.assets?.name || 'Unknown Asset',
        assetSection: row.assets?.section || 'planes',
        userName: row.profiles?.full_name || 'Unknown User',
        userAvatar: row.profiles?.avatar_url || null,
        startDatetime: row.start_datetime,
        endDatetime: row.end_datetime,
        status: row.status,
        createdAt: row.created_at,
      }));

      return createSuccessResponse(bookings);
    } catch (error) {
      console.error('[DashboardService] Error fetching upcoming bookings:', error);
      return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch upcoming bookings');
    }
  }

  /**
   * Get pending approvals for admin dashboard
   */
  async getPendingApprovals(
    ctx: ServiceContext,
    organizationId: string,
    limit = 10
  ): Promise<ApiResponse<RecentBooking[]>> {
    try {
      if (ctx.organizationId && ctx.organizationId !== organizationId) {
        return this.unauthorized('You do not have access to this organization');
      }

      const supabase = this.getClient();

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          title,
          start_datetime,
          end_datetime,
          status,
          created_at,
          assets (
            name,
            section
          ),
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      type BookingRow = {
        id: string;
        title: string | null;
        start_datetime: string;
        end_datetime: string;
        status: ReservationStatus;
        created_at: string;
        assets: { name: string; section: AssetSection } | null;
        profiles: { full_name: string; avatar_url: string | null } | null;
      };

      const bookings: RecentBooking[] = ((data || []) as BookingRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        assetName: row.assets?.name || 'Unknown Asset',
        assetSection: row.assets?.section || 'planes',
        userName: row.profiles?.full_name || 'Unknown User',
        userAvatar: row.profiles?.avatar_url || null,
        startDatetime: row.start_datetime,
        endDatetime: row.end_datetime,
        status: row.status,
        createdAt: row.created_at,
      }));

      return createSuccessResponse(bookings);
    } catch (error) {
      console.error('[DashboardService] Error fetching pending approvals:', error);
      return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch pending approvals');
    }
  }

  /**
   * Get empty stats object
   */
  private getEmptyStats(): DashboardStats {
    return {
      totalAssets: 0,
      activeBookings: 0,
      totalMembers: 0,
      monthlyBookings: 0,
      pendingApprovals: 0,
    };
  }

  /**
   * Get Supabase client for direct queries
   */
  private getClient() {
    // Import dynamically to avoid SSR issues
    const { getClient } = require('@/lib/supabase/client');
    return getClient();
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
