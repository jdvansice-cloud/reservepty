# ReservePTY Implementation Plan & Proposed Improvements

**Document Version:** 1.0
**Created:** January 2025
**Author:** Digital Process Engineer
**Current Platform Version:** v0.47.0
**Target Version:** v1.0.0

---

## Executive Summary

This document outlines a comprehensive implementation plan to elevate ReservePTY from its current MVP state (v0.47.0) to a production-ready, scalable enterprise platform (v1.0.0). The plan addresses technical debt, introduces architectural improvements, and adds critical features for operational excellence.

### Key Objectives
1. **Reliability**: Implement robust error handling, monitoring, and testing
2. **Scalability**: Optimize database queries, introduce caching, and prepare for growth
3. **Security**: Harden authentication, implement rate limiting, and enhance audit trails
4. **User Experience**: Real-time updates, offline resilience, and performance optimization
5. **Maintainability**: Reduce code duplication, improve type safety, and establish patterns

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Architecture Improvements](#2-architecture-improvements)
3. [Database Optimizations](#3-database-optimizations)
4. [API Layer Refactoring](#4-api-layer-refactoring)
5. [Frontend Enhancements](#5-frontend-enhancements)
6. [Security Hardening](#6-security-hardening)
7. [Testing Strategy](#7-testing-strategy)
8. [DevOps & Monitoring](#8-devops--monitoring)
9. [Feature Roadmap](#9-feature-roadmap)
10. [Implementation Phases](#10-implementation-phases)
11. [Risk Assessment](#11-risk-assessment)
12. [Success Metrics](#12-success-metrics)

---

## 1. Current State Assessment

### Strengths
| Area | Assessment |
|------|------------|
| **Tech Stack** | Modern (Next.js 14, Supabase, TypeScript) |
| **Multi-tenancy** | Solid RLS implementation |
| **Booking Rules** | Comprehensive rule engine |
| **i18n** | Complete EN/ES support |
| **UI/UX** | Luxury design system established |

### Technical Debt Identified

| Category | Issue | Severity | Impact |
|----------|-------|----------|--------|
| **Type Safety** | Heavy use of `as unknown as Type` casting | High | Runtime errors, maintenance burden |
| **Error Handling** | Inconsistent patterns, silent failures | High | Poor UX, debugging difficulty |
| **Code Duplication** | Repeated Supabase patterns across services | Medium | Maintenance overhead |
| **Performance** | No query optimization, N+1 potential | Medium | Slow load times at scale |
| **Testing** | Zero test coverage | Critical | Regression risk |
| **Monitoring** | No observability infrastructure | High | Blind to production issues |
| **State Management** | Underutilized React Query | Medium | Unnecessary re-renders |

### Architecture Gaps

```
Current Architecture Issues:
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Components call Supabase directly (no abstraction)       │   │
│  │ No error boundaries                                      │   │
│  │ No loading state management pattern                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ API Layer (src/lib/api/)                                 │   │
│  │ • Direct Supabase queries                                │   │
│  │ • No caching layer                                       │   │
│  │ • No retry logic                                         │   │
│  │ • Inconsistent error responses                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Supabase (PostgreSQL + Auth + Realtime)                  │   │
│  │ • RLS configured but no query optimization               │   │
│  │ • No connection pooling strategy                         │   │
│  │ • Missing indexes for common queries                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Improvements

### 2.1 Proposed Architecture

```
Target Architecture:
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14)                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │ Error Boundary │  │ Suspense       │  │ React Query     │   │
│  │ + Fallback UI  │  │ + Skeleton     │  │ Cache Layer     │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
│           │                   │                   │             │
│           └───────────────────┼───────────────────┘             │
│                               ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Service Layer (NEW)                                      │   │
│  │ • Repository pattern                                     │   │
│  │ • Type-safe queries                                      │   │
│  │ • Automatic retry with exponential backoff               │   │
│  │ • Request/Response DTOs                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                               │                                 │
│           ┌───────────────────┼───────────────────┐             │
│           ▼                   ▼                   ▼             │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │ Query Cache  │   │ Rate Limiter │   │ Audit Middleware  │   │
│  │ (React Query)│   │ (Upstash)    │   │ (Logging)         │   │
│  └──────────────┘   └──────────────┘   └───────────────────┘   │
│                               │                                 │
│                               ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Supabase                                                 │   │
│  │ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────────┐  │   │
│  │ │PostgreSQL│ │ Auth   │ │ Storage  │ │ Realtime      │  │   │
│  │ │+ Indexes │ │+ MFA   │ │+ CDN     │ │ Subscriptions │  │   │
│  │ └─────────┘ └─────────┘ └──────────┘ └───────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 New Directory Structure

```
src/
├── app/                          # Next.js App Router (unchanged)
├── components/
│   ├── ui/                       # Base UI components
│   ├── features/                 # NEW: Feature-specific components
│   │   ├── assets/
│   │   ├── bookings/
│   │   ├── calendar/
│   │   └── members/
│   ├── layouts/                  # NEW: Extracted layout components
│   └── common/                   # NEW: Shared components
│       ├── ErrorBoundary.tsx
│       ├── LoadingState.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── api/                      # Existing API layer
│   ├── services/                 # NEW: Business logic services
│   │   ├── AssetService.ts
│   │   ├── BookingService.ts
│   │   ├── OrganizationService.ts
│   │   └── NotificationService.ts
│   ├── repositories/             # NEW: Data access layer
│   │   ├── base/
│   │   │   └── BaseRepository.ts
│   │   ├── AssetRepository.ts
│   │   ├── BookingRepository.ts
│   │   └── UserRepository.ts
│   ├── hooks/                    # NEW: Custom React hooks
│   │   ├── useAssets.ts
│   │   ├── useBookings.ts
│   │   ├── useRealtime.ts
│   │   └── useOptimisticUpdate.ts
│   ├── utils/                    # NEW: Utility functions
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   └── formatting.ts
│   └── types/                    # NEW: Centralized type definitions
│       ├── api.types.ts
│       ├── domain.types.ts
│       └── dto.types.ts
├── middleware/                   # NEW: Middleware functions
│   ├── withAuth.ts
│   ├── withRateLimit.ts
│   └── withAudit.ts
└── __tests__/                    # NEW: Test directory
    ├── unit/
    ├── integration/
    └── e2e/
```

### 2.3 Repository Pattern Implementation

```typescript
// src/lib/repositories/base/BaseRepository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface QueryResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export abstract class BaseRepository<T extends { id: string }> {
  protected client: SupabaseClient<Database>;
  protected tableName: string;
  protected organizationId?: string;

  constructor(
    client: SupabaseClient<Database>,
    tableName: string,
    organizationId?: string
  ) {
    this.client = client;
    this.tableName = tableName;
    this.organizationId = organizationId;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new RepositoryError(error.message, 'FIND_BY_ID', error);
    return data as T;
  }

  async findAll(options?: QueryOptions): Promise<QueryResult<T>> {
    let query = this.client.from(this.tableName).select('*', { count: 'exact' });

    if (this.organizationId) {
      query = query.eq('organization_id', this.organizationId);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw new RepositoryError(error.message, 'FIND_ALL', error);

    return {
      data: data as T[],
      count: count || 0,
      hasMore: (count || 0) > (options?.offset || 0) + (data?.length || 0),
    };
  }

  async create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(entity)
      .select()
      .single();

    if (error) throw new RepositoryError(error.message, 'CREATE', error);
    return data as T;
  }

  async update(id: string, entity: Partial<T>): Promise<T> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ ...entity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new RepositoryError(error.message, 'UPDATE', error);
    return data as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new RepositoryError(error.message, 'DELETE', error);
  }
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    public operation: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
```

---

## 3. Database Optimizations

### 3.1 Index Strategy

```sql
-- Migration: 006_performance_indexes.sql

-- High-frequency query indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_asset_date
ON reservations (asset_id, start_date, end_date)
WHERE status != 'canceled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_user_status
ON reservations (user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_org_section
ON assets (organization_id, section)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_members_user
ON organization_members (user_id, organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_org_time
ON audit_logs (organization_id, created_at DESC);

-- Full-text search index for assets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_search
ON assets USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- JSON index for asset details
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_details
ON assets USING gin(details);

-- Composite index for calendar queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_calendar
ON reservations (asset_id, start_date, end_date, status)
INCLUDE (user_id, title);
```

### 3.2 Query Optimization Functions

```sql
-- Migration: 007_optimized_functions.sql

-- Optimized calendar availability check
CREATE OR REPLACE FUNCTION check_availability(
  p_asset_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_available BOOLEAN,
  conflicting_reservations JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH conflicts AS (
    SELECT
      r.id,
      r.title,
      r.start_date,
      r.end_date,
      r.status,
      p.first_name || ' ' || p.last_name as booked_by
    FROM reservations r
    JOIN profiles p ON r.user_id = p.id
    WHERE r.asset_id = p_asset_id
      AND r.status IN ('approved', 'pending')
      AND r.id != COALESCE(p_exclude_reservation_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND (r.start_date, r.end_date) OVERLAPS (p_start_date, p_end_date)
  )
  SELECT
    NOT EXISTS (SELECT 1 FROM conflicts) as is_available,
    COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb) as conflicting_reservations
  FROM conflicts c;
END;
$$ LANGUAGE plpgsql STABLE;

-- Dashboard statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_organization_stats AS
SELECT
  o.id as organization_id,
  COUNT(DISTINCT m.user_id) as member_count,
  COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL) as asset_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'approved' AND r.start_date > NOW()) as upcoming_bookings,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'pending') as pending_approvals,
  jsonb_object_agg(
    COALESCE(a.section::text, 'none'),
    COUNT(DISTINCT a.id)
  ) FILTER (WHERE a.section IS NOT NULL) as assets_by_section
FROM organizations o
LEFT JOIN organization_members m ON o.id = m.organization_id
LEFT JOIN assets a ON o.id = a.organization_id
LEFT JOIN reservations r ON o.id = r.organization_id
GROUP BY o.id;

CREATE UNIQUE INDEX ON mv_organization_stats (organization_id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_organization_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_organization_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to refresh stats
CREATE TRIGGER refresh_stats_on_member_change
AFTER INSERT OR UPDATE OR DELETE ON organization_members
FOR EACH STATEMENT EXECUTE FUNCTION refresh_organization_stats();

CREATE TRIGGER refresh_stats_on_asset_change
AFTER INSERT OR UPDATE OR DELETE ON assets
FOR EACH STATEMENT EXECUTE FUNCTION refresh_organization_stats();
```

### 3.3 Connection Pooling Configuration

```typescript
// src/lib/supabase/pooled-client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// For high-frequency operations, use pooled connection
export const createPooledClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only
    {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-connection-pool': 'transaction', // Use transaction pooler
        },
      },
    }
  );
};
```

---

## 4. API Layer Refactoring

### 4.1 Type-Safe API Response Wrapper

```typescript
// src/lib/types/api.types.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ResponseMetadata {
  requestId: string;
  duration: number;
  cached?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// src/lib/utils/api-response.ts
export function successResponse<T>(
  data: T,
  metadata?: Partial<ResponseMetadata>
): ApiResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      requestId: generateRequestId(),
      duration: 0,
      ...metadata,
    },
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}
```

### 4.2 Service Layer with Retry Logic

```typescript
// src/lib/services/base/BaseService.ts

import { ApiResponse, errorResponse } from '@/lib/types/api.types';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'],
};

export abstract class BaseService {
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<ApiResponse<T>> {
    const { maxRetries, baseDelay, maxDelay, retryableErrors } = {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          metadata: {
            requestId: generateRequestId(),
            duration: 0,
          },
        };
      } catch (error) {
        lastError = error as Error;
        const errorCode = this.getErrorCode(error);

        if (!retryableErrors.includes(errorCode) || attempt === maxRetries) {
          break;
        }

        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );

        await this.sleep(delay);
      }
    }

    return errorResponse(
      this.getErrorCode(lastError),
      lastError?.message || 'Unknown error occurred'
    );
  }

  private getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('network')) return 'NETWORK_ERROR';
      if (error.message.includes('timeout')) return 'TIMEOUT';
    }
    return 'UNKNOWN_ERROR';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4.3 Booking Service Example

```typescript
// src/lib/services/BookingService.ts

import { BaseService } from './base/BaseService';
import { BookingRepository } from '@/lib/repositories/BookingRepository';
import { checkBookingRules, createApprovalRequests } from '@/lib/booking-rules';
import { ApiResponse, PaginatedResponse } from '@/lib/types/api.types';
import {
  Reservation,
  CreateReservationDTO,
  ReservationFilters
} from '@/lib/types/domain.types';

export class BookingService extends BaseService {
  constructor(private repository: BookingRepository) {
    super();
  }

  async createReservation(
    dto: CreateReservationDTO,
    userId: string
  ): Promise<ApiResponse<Reservation>> {
    return this.executeWithRetry(async () => {
      // 1. Check availability
      const availability = await this.repository.checkAvailability(
        dto.assetId,
        dto.startDate,
        dto.endDate
      );

      if (!availability.isAvailable) {
        throw new BookingError(
          'CONFLICT',
          'Time slot not available',
          { conflicts: availability.conflicts }
        );
      }

      // 2. Validate booking rules
      const ruleValidation = await checkBookingRules({
        userId,
        assetId: dto.assetId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        organizationId: dto.organizationId,
      });

      // 3. Create reservation with appropriate status
      const reservation = await this.repository.create({
        ...dto,
        user_id: userId,
        status: ruleValidation.requiresApproval ? 'pending' : 'approved',
      });

      // 4. Create approval requests if needed
      if (ruleValidation.requiresApproval) {
        await createApprovalRequests(
          reservation.id,
          ruleValidation.triggeredRules
        );
      }

      // 5. Send notifications
      await this.notifyRelevantParties(reservation, ruleValidation);

      return reservation;
    });
  }

  async getReservations(
    filters: ReservationFilters,
    pagination: { page: number; pageSize: number }
  ): Promise<PaginatedResponse<Reservation>> {
    const { page, pageSize } = pagination;
    const offset = (page - 1) * pageSize;

    const result = await this.repository.findWithFilters(filters, {
      limit: pageSize,
      offset,
      orderBy: 'start_date',
      orderDirection: 'asc',
    });

    return {
      success: true,
      data: result.data,
      pagination: {
        page,
        pageSize,
        totalItems: result.count,
        totalPages: Math.ceil(result.count / pageSize),
        hasNext: result.hasMore,
        hasPrevious: page > 1,
      },
    };
  }

  async cancelReservation(
    reservationId: string,
    userId: string,
    reason?: string
  ): Promise<ApiResponse<Reservation>> {
    return this.executeWithRetry(async () => {
      const reservation = await this.repository.findById(reservationId);

      if (!reservation) {
        throw new BookingError('NOT_FOUND', 'Reservation not found');
      }

      if (reservation.user_id !== userId) {
        // Check if user has permission to cancel others' reservations
        const canCancel = await this.checkCancelPermission(userId, reservation);
        if (!canCancel) {
          throw new BookingError('FORBIDDEN', 'Not authorized to cancel');
        }
      }

      const updated = await this.repository.update(reservationId, {
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        cancellation_reason: reason,
      });

      await this.notifyCancellation(updated);

      return updated;
    });
  }

  private async notifyRelevantParties(
    reservation: Reservation,
    ruleValidation: RuleValidationResult
  ): Promise<void> {
    // Implementation for email/push notifications
  }

  private async notifyCancellation(reservation: Reservation): Promise<void> {
    // Implementation for cancellation notifications
  }

  private async checkCancelPermission(
    userId: string,
    reservation: Reservation
  ): Promise<boolean> {
    // Check if user is admin/owner of organization
    return true; // Implement actual logic
  }
}

class BookingError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BookingError';
  }
}
```

---

## 5. Frontend Enhancements

### 5.1 Error Boundary Implementation

```typescript
// src/components/common/ErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service
    if (typeof window !== 'undefined') {
      // Example: Sentry.captureException(error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-stone-600 mb-6 max-w-md">
            We encountered an unexpected error. Please try again or contact support
            if the problem persists.
          </p>
          <Button onClick={this.handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 5.2 Custom Hooks with React Query

```typescript
// src/lib/hooks/useAssets.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import { AssetService } from '@/lib/services/AssetService';
import { Asset, CreateAssetDTO, AssetFilters } from '@/lib/types/domain.types';

const QUERY_KEYS = {
  assets: (orgId: string) => ['assets', orgId] as const,
  asset: (id: string) => ['asset', id] as const,
  assetsBySection: (orgId: string, section: string) =>
    ['assets', orgId, section] as const,
};

export function useAssets(filters?: AssetFilters) {
  const { organization } = useAuth();
  const service = new AssetService();

  return useQuery({
    queryKey: [...QUERY_KEYS.assets(organization?.id || ''), filters],
    queryFn: () => service.getAssets(organization!.id, filters),
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

export function useAsset(assetId: string) {
  const service = new AssetService();

  return useQuery({
    queryKey: QUERY_KEYS.asset(assetId),
    queryFn: () => service.getAsset(assetId),
    enabled: !!assetId,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const service = new AssetService();

  return useMutation({
    mutationFn: (dto: CreateAssetDTO) =>
      service.createAsset(organization!.id, dto),
    onSuccess: () => {
      // Invalidate and refetch assets list
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.assets(organization!.id),
      });
    },
    onError: (error) => {
      console.error('Failed to create asset:', error);
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const service = new AssetService();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Asset> }) =>
      service.updateAsset(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.asset(id) });

      // Snapshot previous value
      const previousAsset = queryClient.getQueryData(QUERY_KEYS.asset(id));

      // Optimistically update
      queryClient.setQueryData(QUERY_KEYS.asset(id), (old: Asset | undefined) =>
        old ? { ...old, ...data } : old
      );

      return { previousAsset };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousAsset) {
        queryClient.setQueryData(QUERY_KEYS.asset(id), context.previousAsset);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.asset(id) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.assets(organization!.id),
      });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const service = new AssetService();

  return useMutation({
    mutationFn: (assetId: string) => service.deleteAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.assets(organization!.id),
      });
    },
  });
}
```

### 5.3 Realtime Subscriptions Hook

```typescript
// src/lib/hooks/useRealtime.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeConfig {
  table: string;
  schema?: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  invalidateKeys?: readonly unknown[][];
}

export function useRealtime(config: RealtimeConfig) {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  const handleChange = useCallback(
    (eventType: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
      switch (eventType) {
        case 'INSERT':
          config.onInsert?.(payload);
          break;
        case 'UPDATE':
          config.onUpdate?.(payload);
          break;
        case 'DELETE':
          config.onDelete?.(payload);
          break;
      }

      // Invalidate related queries
      if (config.invalidateKeys) {
        config.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
    [config, queryClient]
  );

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(`${config.table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          handleChange(payload.eventType as any, payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.table, config.schema, config.filter, handleChange, supabase]);
}

// Example usage in calendar component
export function useCalendarRealtime(organizationId: string) {
  useRealtime({
    table: 'reservations',
    filter: `organization_id=eq.${organizationId}`,
    invalidateKeys: [
      ['reservations', organizationId],
      ['calendar', organizationId],
    ],
    onInsert: (payload) => {
      console.log('New reservation:', payload.new);
      // Could show toast notification
    },
    onUpdate: (payload) => {
      console.log('Reservation updated:', payload.new);
    },
    onDelete: (payload) => {
      console.log('Reservation deleted:', payload.old);
    },
  });
}
```

---

## 6. Security Hardening

### 6.1 Rate Limiting Implementation

```typescript
// src/middleware/withRateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limits for different endpoints
const rateLimiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: 'ratelimit:api',
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 auth attempts per minute
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
  booking: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 booking operations per minute
    analytics: true,
    prefix: 'ratelimit:booking',
  }),
};

type RateLimitType = keyof typeof rateLimiters;

export async function withRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<NextResponse | null> {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  const identifier = `${type}:${ip}`;

  const { success, limit, remaining, reset } = await rateLimiters[type].limit(
    identifier
  );

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // Continue to route handler
}
```

### 6.2 Enhanced Audit Logging

```typescript
// src/middleware/withAudit.ts
import { createPooledClient } from '@/lib/supabase/pooled-client';
import { NextRequest } from 'next/server';

interface AuditLogEntry {
  user_id?: string;
  organization_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_method: string;
  request_path: string;
  request_body?: Record<string, unknown>;
  response_status: number;
  error_message?: string;
  duration_ms: number;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const supabase = createPooledClient();

  try {
    await supabase.from('audit_logs').insert({
      ...entry,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log to backup system (e.g., CloudWatch, Datadog)
    console.error('Failed to write audit log:', error);
  }
}

export function createAuditContext(request: NextRequest) {
  const startTime = Date.now();

  return {
    ip_address: request.ip ?? request.headers.get('x-forwarded-for') ?? undefined,
    user_agent: request.headers.get('user-agent') ?? undefined,
    request_method: request.method,
    request_path: request.nextUrl.pathname,
    startTime,
    getDuration: () => Date.now() - startTime,
  };
}
```

### 6.3 Input Validation Schemas

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

// Common validators
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email();
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);

// Asset validation
export const createAssetSchema = z.object({
  name: z.string().min(1).max(200),
  section: z.enum(['planes', 'helicopters', 'residences', 'watercraft']),
  description: z.string().max(2000).optional(),
  details: z.record(z.unknown()).optional(),
  photos: z.array(z.object({
    url: z.string().url(),
    caption: z.string().max(500).optional(),
    order: z.number().int().min(0),
  })).max(20).optional(),
});

// Reservation validation
export const createReservationSchema = z.object({
  asset_id: uuidSchema,
  title: z.string().min(1).max(200),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  guests: z.array(z.object({
    name: z.string().min(1).max(100),
    email: emailSchema.optional(),
  })).max(50).optional(),
}).refine(
  (data) => new Date(data.start_date) < new Date(data.end_date),
  { message: 'End date must be after start date' }
);

// Organization validation
export const createOrganizationSchema = z.object({
  legal_name: z.string().min(1).max(200),
  commercial_name: z.string().max(200).optional(),
  ruc: z.string().max(50).optional(),
  billing_email: emailSchema,
  phone: phoneSchema.optional(),
  address: z.object({
    street: z.string().max(200),
    city: z.string().max(100),
    state: z.string().max(100).optional(),
    country: z.string().max(100),
    postal_code: z.string().max(20).optional(),
  }).optional(),
});

// Member invitation validation
export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'manager', 'member', 'viewer']),
  tier_id: uuidSchema.optional(),
  message: z.string().max(500).optional(),
});

// Validation helper
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
```

---

## 7. Testing Strategy

### 7.1 Test Infrastructure Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  })),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

### 7.2 Unit Test Examples

```typescript
// src/__tests__/unit/booking-rules.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkDateRangeRule,
  checkConsecutiveBookingRule,
  checkLeadTimeRule,
  checkBookingRules,
} from '@/lib/booking-rules';

describe('Booking Rules Engine', () => {
  describe('checkDateRangeRule', () => {
    it('should detect overlap with blocked date range', () => {
      const rule = {
        id: '1',
        type: 'date_range',
        conditions: {
          start_date: '2025-03-15',
          end_date: '2025-03-20',
        },
      };

      const result = checkDateRangeRule(
        rule,
        new Date('2025-03-18'),
        new Date('2025-03-22')
      );

      expect(result.triggered).toBe(true);
      expect(result.reason).toContain('overlaps');
    });

    it('should not trigger for dates outside range', () => {
      const rule = {
        id: '1',
        type: 'date_range',
        conditions: {
          start_date: '2025-03-15',
          end_date: '2025-03-20',
        },
      };

      const result = checkDateRangeRule(
        rule,
        new Date('2025-03-25'),
        new Date('2025-03-30')
      );

      expect(result.triggered).toBe(false);
    });

    it('should handle year boundary correctly', () => {
      const rule = {
        id: '1',
        type: 'date_range',
        conditions: {
          start_date: '2024-12-20',
          end_date: '2025-01-05',
        },
      };

      const result = checkDateRangeRule(
        rule,
        new Date('2024-12-31'),
        new Date('2025-01-02')
      );

      expect(result.triggered).toBe(true);
    });
  });

  describe('checkLeadTimeRule', () => {
    it('should trigger when booking too close to start date', () => {
      const rule = {
        id: '1',
        type: 'lead_time',
        conditions: {
          min_hours: 48,
        },
      };

      const now = new Date();
      const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      const result = checkLeadTimeRule(rule, startDate);

      expect(result.triggered).toBe(true);
      expect(result.reason).toContain('48 hours');
    });

    it('should pass when sufficient lead time provided', () => {
      const rule = {
        id: '1',
        type: 'lead_time',
        conditions: {
          min_hours: 48,
        },
      };

      const now = new Date();
      const startDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now

      const result = checkLeadTimeRule(rule, startDate);

      expect(result.triggered).toBe(false);
    });
  });
});

// src/__tests__/unit/services/BookingService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingService } from '@/lib/services/BookingService';
import { BookingRepository } from '@/lib/repositories/BookingRepository';

describe('BookingService', () => {
  let service: BookingService;
  let mockRepository: jest.Mocked<BookingRepository>;

  beforeEach(() => {
    mockRepository = {
      checkAvailability: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
    } as any;

    service = new BookingService(mockRepository);
  });

  describe('createReservation', () => {
    it('should create reservation when slot is available', async () => {
      mockRepository.checkAvailability.mockResolvedValue({
        isAvailable: true,
        conflicts: [],
      });

      mockRepository.create.mockResolvedValue({
        id: 'res-1',
        status: 'approved',
        asset_id: 'asset-1',
        user_id: 'user-1',
        start_date: '2025-04-01T10:00:00Z',
        end_date: '2025-04-01T12:00:00Z',
      });

      const result = await service.createReservation(
        {
          assetId: 'asset-1',
          startDate: '2025-04-01T10:00:00Z',
          endDate: '2025-04-01T12:00:00Z',
          organizationId: 'org-1',
          title: 'Test Booking',
        },
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('approved');
    });

    it('should return error when slot is not available', async () => {
      mockRepository.checkAvailability.mockResolvedValue({
        isAvailable: false,
        conflicts: [{ id: 'existing-res', title: 'Existing Booking' }],
      });

      const result = await service.createReservation(
        {
          assetId: 'asset-1',
          startDate: '2025-04-01T10:00:00Z',
          endDate: '2025-04-01T12:00:00Z',
          organizationId: 'org-1',
          title: 'Test Booking',
        },
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONFLICT');
    });
  });
});
```

### 7.3 Integration Test Examples

```typescript
// src/__tests__/integration/api/reservations.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_KEY!
);

describe('Reservations API Integration', () => {
  let testOrganization: any;
  let testUser: any;
  let testAsset: any;

  beforeAll(async () => {
    // Create test data
    const { data: org } = await supabase
      .from('organizations')
      .insert({ legal_name: 'Test Org', billing_email: 'test@example.com' })
      .select()
      .single();
    testOrganization = org;

    const { data: user } = await supabase.auth.admin.createUser({
      email: 'testuser@example.com',
      password: 'testpassword123',
    });
    testUser = user.user;

    const { data: asset } = await supabase
      .from('assets')
      .insert({
        organization_id: testOrganization.id,
        name: 'Test Plane',
        section: 'planes',
      })
      .select()
      .single();
    testAsset = asset;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('reservations').delete().eq('asset_id', testAsset.id);
    await supabase.from('assets').delete().eq('id', testAsset.id);
    await supabase.from('organizations').delete().eq('id', testOrganization.id);
    await supabase.auth.admin.deleteUser(testUser.id);
  });

  it('should create a reservation successfully', async () => {
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        organization_id: testOrganization.id,
        asset_id: testAsset.id,
        user_id: testUser.id,
        title: 'Integration Test Booking',
        start_date: '2025-05-01T10:00:00Z',
        end_date: '2025-05-01T14:00:00Z',
        status: 'pending',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.title).toBe('Integration Test Booking');
    expect(data.status).toBe('pending');
  });

  it('should enforce RLS policies', async () => {
    // Create client with different user context
    const anonClient = createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_ANON_KEY!
    );

    const { data, error } = await anonClient
      .from('reservations')
      .select('*')
      .eq('organization_id', testOrganization.id);

    // Should return empty due to RLS
    expect(data).toHaveLength(0);
  });
});
```

---

## 8. DevOps & Monitoring

### 8.1 Monitoring Stack

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    ports:
      - "3001:3000"
    depends_on:
      - prometheus

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki-config.yml:/etc/loki/local-config.yml

# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'reservepty'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/api/metrics'
```

### 8.2 Application Metrics Endpoint

```typescript
// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Define metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  registers: [register],
});

const bookingOperations = new Counter({
  name: 'booking_operations_total',
  help: 'Total booking operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': register.contentType,
    },
  });
}

// Export for use in other parts of the app
export { httpRequestsTotal, httpRequestDuration, activeUsers, bookingOperations };
```

### 8.3 Error Tracking Integration

```typescript
// src/lib/monitoring/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

export function initErrorTracking() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV || 'development',
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // Scrub sensitive data
        if (event.request?.data) {
          delete event.request.data.password;
          delete event.request.data.token;
        }
        return event;
      },
    });
  }
}

export function captureError(
  error: Error,
  context?: Record<string, unknown>
) {
  console.error('Error captured:', error);

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

export function setUserContext(user: { id: string; email?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
}
```

### 8.4 Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createPooledClient } from '@/lib/supabase/pooled-client';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: CheckResult;
    auth: CheckResult;
    cache?: CheckResult;
  };
}

interface CheckResult {
  status: 'pass' | 'fail';
  latency?: number;
  message?: string;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = createPooledClient();
    await supabase.from('organizations').select('count').limit(1);
    return {
      status: 'pass',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database check failed',
    };
  }
}

async function checkAuth(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = createPooledClient();
    await supabase.auth.getSession();
    return {
      status: 'pass',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Auth check failed',
    };
  }
}

export async function GET() {
  const [database, auth] = await Promise.all([
    checkDatabase(),
    checkAuth(),
  ]);

  const checks = { database, auth };
  const allPassing = Object.values(checks).every((c) => c.status === 'pass');

  const health: HealthStatus = {
    status: allPassing ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.47.0',
    checks,
  };

  return NextResponse.json(health, {
    status: allPassing ? 200 : 503,
  });
}
```

---

## 9. Feature Roadmap

### 9.1 Priority Features Matrix

| Feature | Priority | Effort | Impact | Phase |
|---------|----------|--------|--------|-------|
| Real-time calendar updates | High | Medium | High | 1 |
| Bulk asset operations | Medium | Low | Medium | 1 |
| Advanced search/filtering | High | Medium | High | 1 |
| Mobile app (React Native) | Medium | High | High | 3 |
| API webhooks | Medium | Medium | Medium | 2 |
| Data export (CSV/PDF) | Medium | Low | Medium | 1 |
| Custom reporting dashboard | Low | High | Medium | 3 |
| Third-party calendar sync | Medium | Medium | High | 2 |
| Multi-factor authentication | High | Low | High | 1 |
| Recurring bookings | Medium | Medium | Medium | 2 |
| Waitlist system | Low | Medium | Low | 3 |
| Asset maintenance tracking | Low | High | Medium | 3 |

### 9.2 Feature Specifications

#### Real-time Calendar Updates

```typescript
// Feature: Live calendar synchronization

// Implementation approach:
// 1. Use Supabase Realtime for reservation changes
// 2. Optimistic UI updates for immediate feedback
// 3. Conflict resolution for simultaneous edits

interface CalendarUpdate {
  type: 'reservation_created' | 'reservation_updated' | 'reservation_canceled';
  payload: {
    reservation: Reservation;
    previousState?: Reservation;
  };
  timestamp: string;
  sourceUserId: string;
}

// Component integration
function useCalendarSync(organizationId: string) {
  const queryClient = useQueryClient();

  useRealtime({
    table: 'reservations',
    filter: `organization_id=eq.${organizationId}`,
    onInsert: (payload) => {
      // Add to calendar without full refetch
      queryClient.setQueryData(
        ['calendar', organizationId],
        (old: CalendarEvent[] | undefined) => {
          if (!old) return [payload.new];
          return [...old, mapReservationToEvent(payload.new)];
        }
      );

      // Show notification
      toast.info(`New booking: ${payload.new.title}`);
    },
    onUpdate: (payload) => {
      queryClient.setQueryData(
        ['calendar', organizationId],
        (old: CalendarEvent[] | undefined) => {
          if (!old) return old;
          return old.map((event) =>
            event.id === payload.new.id
              ? mapReservationToEvent(payload.new)
              : event
          );
        }
      );
    },
    onDelete: (payload) => {
      queryClient.setQueryData(
        ['calendar', organizationId],
        (old: CalendarEvent[] | undefined) => {
          if (!old) return old;
          return old.filter((event) => event.id !== payload.old.id);
        }
      );
    },
  });
}
```

#### Multi-Factor Authentication

```typescript
// Feature: MFA implementation using Supabase

// 1. Enable TOTP in user settings
async function enableMFA(userId: string) {
  const supabase = createBrowserClient();

  // Generate TOTP secret
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator App',
  });

  if (error) throw error;

  return {
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    factorId: data.id,
  };
}

// 2. Verify and activate MFA
async function verifyMFA(factorId: string, code: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });

  if (error) throw error;
  return data;
}

// 3. MFA challenge during login
async function handleMFAChallenge(factorId: string, code: string) {
  const supabase = createBrowserClient();

  const { data: challenge } = await supabase.auth.mfa.challenge({
    factorId,
  });

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });

  if (error) throw error;
  return data;
}
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Objectives:**
- Establish testing infrastructure
- Implement core architectural improvements
- Add critical security features

**Deliverables:**
| Week | Tasks | Owner |
|------|-------|-------|
| 1 | Set up Vitest, write first 20 unit tests | Dev |
| 1 | Implement ErrorBoundary component | Dev |
| 2 | Create BaseRepository pattern | Dev |
| 2 | Add database indexes | DBA |
| 3 | Implement rate limiting | Dev |
| 3 | Add MFA support | Dev |
| 4 | Integration testing setup | Dev |
| 4 | Health check endpoint | Dev |

**Success Criteria:**
- [ ] 50% test coverage for booking rules
- [ ] Error boundary implemented in all route groups
- [ ] Rate limiting active on all API routes
- [ ] MFA available in user settings

### Phase 2: Optimization (Weeks 5-8)

**Objectives:**
- Optimize database performance
- Implement caching strategy
- Add real-time features

**Deliverables:**
| Week | Tasks | Owner |
|------|-------|-------|
| 5 | Implement React Query caching strategy | Dev |
| 5 | Create materialized views | DBA |
| 6 | Add Supabase Realtime subscriptions | Dev |
| 6 | Implement optimistic updates | Dev |
| 7 | Build custom hooks library | Dev |
| 7 | Performance audit and fixes | Dev |
| 8 | Load testing | QA |
| 8 | Documentation update | Dev |

**Success Criteria:**
- [ ] 50% reduction in database queries
- [ ] Real-time calendar updates working
- [ ] P95 response time under 200ms
- [ ] 80% test coverage

### Phase 3: Features (Weeks 9-12)

**Objectives:**
- Add high-priority features
- Polish user experience
- Prepare for v1.0 release

**Deliverables:**
| Week | Tasks | Owner |
|------|-------|-------|
| 9 | Advanced search implementation | Dev |
| 9 | Bulk operations UI | Dev |
| 10 | Data export (CSV/PDF) | Dev |
| 10 | Third-party calendar sync | Dev |
| 11 | Mobile responsiveness audit | Design |
| 11 | Accessibility improvements | Dev |
| 12 | Final QA and bug fixes | QA |
| 12 | v1.0 release preparation | Team |

**Success Criteria:**
- [ ] All P1 features implemented
- [ ] WCAG 2.1 AA compliance
- [ ] Performance benchmarks met
- [ ] Documentation complete

### Phase 4: Scale (Weeks 13-16)

**Objectives:**
- Monitoring and observability
- Production hardening
- Growth preparation

**Deliverables:**
| Week | Tasks | Owner |
|------|-------|-------|
| 13 | Set up Prometheus/Grafana | DevOps |
| 13 | Implement error tracking (Sentry) | Dev |
| 14 | Create runbooks for common issues | DevOps |
| 14 | Disaster recovery testing | DevOps |
| 15 | Security audit | Security |
| 15 | Performance optimization round 2 | Dev |
| 16 | Go-live checklist completion | Team |
| 16 | v1.0.0 release | Team |

---

## 11. Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database migration failures | Medium | High | Staged rollout, rollback scripts |
| Breaking changes in refactoring | High | Medium | Comprehensive test coverage |
| Performance regression | Medium | High | Load testing, monitoring |
| Third-party API changes | Low | Medium | Version pinning, abstraction layer |
| Security vulnerabilities | Medium | Critical | Regular audits, dependency updates |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Deployment failures | Medium | High | Blue-green deployments, rollback plan |
| Data loss | Low | Critical | Regular backups, replication |
| Service outage | Low | High | Health checks, auto-scaling |
| Team knowledge gaps | Medium | Medium | Documentation, pair programming |

### Mitigation Strategies

1. **Feature Flags**: Roll out changes gradually
2. **Canary Deployments**: Test with subset of users first
3. **Circuit Breakers**: Prevent cascade failures
4. **Automated Rollbacks**: Quick recovery from issues
5. **Incident Response Plan**: Clear escalation paths

---

## 12. Success Metrics

### Performance KPIs

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Page Load Time (P50) | ~2.5s | <1.5s | Vercel Analytics |
| API Response Time (P95) | ~500ms | <200ms | Custom metrics |
| Error Rate | Unknown | <0.1% | Sentry |
| Uptime | Unknown | 99.9% | Health checks |

### Quality KPIs

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Test Coverage | 0% | 80% | Vitest coverage |
| Type Coverage | ~70% | 95% | TypeScript strict |
| Code Duplication | High | <5% | SonarQube |
| Technical Debt | Unknown | Low | Code review |

### Business KPIs

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Booking Success Rate | Unknown | >95% | Analytics |
| User Satisfaction | Unknown | >4.5/5 | Surveys |
| Feature Adoption | Unknown | >70% | Usage tracking |
| Support Tickets | Unknown | <10/week | Help desk |

---

## Appendix A: Migration Scripts

### A.1 Database Migrations Checklist

```sql
-- Pre-migration checklist
-- [ ] Backup database
-- [ ] Notify users of maintenance window
-- [ ] Disable cron jobs
-- [ ] Scale down to single instance

-- Post-migration checklist
-- [ ] Verify all tables exist
-- [ ] Verify RLS policies active
-- [ ] Run smoke tests
-- [ ] Scale back up
-- [ ] Monitor error rates
```

### A.2 Rollback Procedures

```sql
-- Rollback script template
BEGIN;

-- Drop new objects
DROP INDEX IF EXISTS idx_new_index;
DROP FUNCTION IF EXISTS new_function();

-- Restore previous state
-- (specific to each migration)

COMMIT;
```

---

## Appendix B: Environment Configuration

### B.1 Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Error Tracking (Sentry)
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Email Service
RESEND_API_KEY=
SENDGRID_API_KEY=

# Feature Flags
NEXT_PUBLIC_ENABLE_MFA=true
NEXT_PUBLIC_ENABLE_REALTIME=true

# Monitoring
PROMETHEUS_PUSH_GATEWAY=
```

---

*This implementation plan is a living document and should be updated as the project evolves.*

**Document Control:**
- Created: January 2025
- Last Review: -
- Next Review: February 2025
- Status: Draft
