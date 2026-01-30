'use client';

import { z } from 'zod';
import type { ApiResponse, PaginatedResponse, ApiErrorCode } from '@/lib/types/api.types';
import { createErrorResponse, createSuccessResponse } from '@/lib/types/api.types';
import { BaseRepository, FilterCondition, RepositoryQueryOptions } from '@/lib/repositories/base/BaseRepository';
import type { Database } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

/**
 * Service operation context for auditing and permissions
 */
export interface ServiceContext {
  userId?: string;
  organizationId?: string;
  role?: string;
  ipAddress?: string;
}

/**
 * Service operation result with optional metadata
 */
export interface ServiceResult<T> extends ApiResponse<T> {
  metadata?: {
    operationId?: string;
    timestamp: string;
    duration?: number;
  };
}

// ============================================================================
// BASE SERVICE CLASS
// ============================================================================

/**
 * Base Service class providing business logic layer between API and Repository
 *
 * Services handle:
 * - Input validation
 * - Business rule enforcement
 * - Authorization checks
 * - Cross-entity operations
 * - Audit logging
 *
 * @example
 * ```typescript
 * class AssetService extends BaseService<'assets'> {
 *   constructor() {
 *     super(new AssetRepository());
 *   }
 *
 *   async createAsset(input: CreateAssetInput, ctx: ServiceContext) {
 *     // Validate input
 *     const validated = this.validate(createAssetSchema, input);
 *     if (!validated.success) return validated;
 *
 *     // Check permissions
 *     const hasPermission = await this.checkPermission(ctx, 'create');
 *     if (!hasPermission) return this.unauthorized();
 *
 *     // Create asset
 *     return this.repository.create(validated.data);
 *   }
 * }
 * ```
 */
export abstract class BaseService<T extends TableName> {
  protected repository: BaseRepository<T>;
  protected serviceName: string;

  constructor(repository: BaseRepository<T>, serviceName?: string) {
    this.repository = repository;
    this.serviceName = serviceName || this.constructor.name;
  }

  // --------------------------------------------------------------------------
  // VALIDATION HELPERS
  // --------------------------------------------------------------------------

  /**
   * Validate input against a Zod schema
   */
  protected validate<Schema extends z.ZodSchema>(
    schema: Schema,
    input: unknown
  ): ApiResponse<z.infer<Schema>> {
    const result = schema.safeParse(input);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      return createErrorResponse(
        'VALIDATION_ERROR',
        'Validation failed',
        { errors }
      );
    }

    return createSuccessResponse(result.data);
  }

  /**
   * Validate multiple inputs at once
   */
  protected validateMany<Schema extends z.ZodSchema>(
    schema: Schema,
    inputs: unknown[]
  ): ApiResponse<z.infer<Schema>[]> {
    const results: z.infer<Schema>[] = [];
    const errors: Array<{ index: number; errors: unknown[] }> = [];

    inputs.forEach((input, index) => {
      const result = schema.safeParse(input);
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({
          index,
          errors: result.error.errors,
        });
      }
    });

    if (errors.length > 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        `Validation failed for ${errors.length} item(s)`,
        { errors }
      );
    }

    return createSuccessResponse(results);
  }

  // --------------------------------------------------------------------------
  // AUTHORIZATION HELPERS
  // --------------------------------------------------------------------------

  /**
   * Check if the context user has required permission
   * Override in subclasses for specific permission logic
   */
  protected async checkPermission(
    ctx: ServiceContext,
    action: string,
    resourceId?: string
  ): Promise<boolean> {
    // Default implementation - allow if user is authenticated
    return !!ctx.userId;
  }

  /**
   * Check if user belongs to organization
   */
  protected async checkOrganizationMembership(
    ctx: ServiceContext,
    organizationId: string
  ): Promise<boolean> {
    // This should be implemented with actual membership check
    return ctx.organizationId === organizationId;
  }

  /**
   * Create unauthorized response
   */
  protected unauthorized(message = 'You are not authorized to perform this action'): ApiResponse<never> {
    return createErrorResponse('FORBIDDEN', message);
  }

  /**
   * Create not found response
   */
  protected notFound(entityName = 'Resource'): ApiResponse<never> {
    return createErrorResponse('NOT_FOUND', `${entityName} not found`);
  }

  // --------------------------------------------------------------------------
  // CRUD OPERATIONS WITH CONTEXT
  // --------------------------------------------------------------------------

  /**
   * Find by ID with context validation
   */
  async findById(
    id: string,
    ctx: ServiceContext,
    options?: { select?: string }
  ): Promise<ApiResponse<TableRow<T>>> {
    const startTime = Date.now();

    const result = await this.repository.findById(id, options);

    if (result.success) {
      this.logOperation(ctx, 'findById', id, Date.now() - startTime);
    }

    return result;
  }

  /**
   * Find many with context validation
   */
  async findMany(
    ctx: ServiceContext,
    options?: RepositoryQueryOptions<TableRow<T>>
  ): Promise<PaginatedResponse<TableRow<T>>> {
    const startTime = Date.now();

    const result = await this.repository.findMany(options);

    this.logOperation(ctx, 'findMany', undefined, Date.now() - startTime);

    return result;
  }

  /**
   * Create with validation and context
   */
  async create(
    data: TableInsert<T>,
    ctx: ServiceContext
  ): Promise<ApiResponse<TableRow<T>>> {
    const startTime = Date.now();

    const result = await this.repository.create(data);

    if (result.success) {
      this.logOperation(ctx, 'create', (result.data as { id?: string })?.id, Date.now() - startTime);
    }

    return result;
  }

  /**
   * Update with validation and context
   */
  async update(
    id: string,
    data: TableUpdate<T>,
    ctx: ServiceContext
  ): Promise<ApiResponse<TableRow<T>>> {
    const startTime = Date.now();

    // Check if record exists
    const exists = await this.repository.exists(id);
    if (!exists) {
      return this.notFound();
    }

    const result = await this.repository.update(id, data);

    if (result.success) {
      this.logOperation(ctx, 'update', id, Date.now() - startTime);
    }

    return result;
  }

  /**
   * Delete with context (soft delete by default)
   */
  async delete(
    id: string,
    ctx: ServiceContext,
    options?: { hard?: boolean }
  ): Promise<ApiResponse<void>> {
    const startTime = Date.now();

    // Check if record exists
    const exists = await this.repository.exists(id);
    if (!exists) {
      return this.notFound();
    }

    let result: ApiResponse<void | TableRow<T>>;
    if (options?.hard) {
      result = await this.repository.delete(id);
    } else {
      result = await this.repository.softDelete(id);
    }

    if (result.success) {
      this.logOperation(ctx, options?.hard ? 'hardDelete' : 'softDelete', id, Date.now() - startTime);
    }

    return result as ApiResponse<void>;
  }

  // --------------------------------------------------------------------------
  // LOGGING & MONITORING
  // --------------------------------------------------------------------------

  /**
   * Log service operation
   * Override for custom logging implementation
   */
  protected logOperation(
    ctx: ServiceContext,
    operation: string,
    resourceId?: string,
    durationMs?: number
  ): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[${this.serviceName}] ${operation}`,
        {
          userId: ctx.userId,
          organizationId: ctx.organizationId,
          resourceId,
          durationMs,
        }
      );
    }
  }

  /**
   * Log error
   */
  protected logError(
    ctx: ServiceContext,
    operation: string,
    error: unknown
  ): void {
    console.error(
      `[${this.serviceName}] Error in ${operation}:`,
      {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        error: error instanceof Error ? error.message : error,
      }
    );
  }

  // --------------------------------------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------------------------------------

  /**
   * Execute a transaction-like operation
   * Note: Supabase doesn't support true client-side transactions,
   * but this provides a pattern for grouped operations
   */
  protected async executeGrouped<R>(
    operations: Array<() => Promise<ApiResponse<unknown>>>,
    rollbackOn: ApiErrorCode[] = ['DATABASE_ERROR', 'INTERNAL_ERROR']
  ): Promise<ApiResponse<R[]>> {
    const results: unknown[] = [];
    const completedOps: number[] = [];

    for (let i = 0; i < operations.length; i++) {
      const result = await operations[i]();

      if (!result.success && rollbackOn.includes(result.error?.code as ApiErrorCode)) {
        // Operation failed - in a real transaction we'd rollback
        // Here we can only log and return the error
        return createErrorResponse(
          result.error?.code || 'INTERNAL_ERROR',
          `Operation ${i + 1} failed: ${result.error?.message}`,
          {
            completedOperations: completedOps,
            failedOperationIndex: i,
          }
        );
      }

      results.push(result.data);
      completedOps.push(i);
    }

    return createSuccessResponse(results as R[]);
  }

  /**
   * Retry an operation with exponential backoff
   */
  protected async retry<R>(
    operation: () => Promise<ApiResponse<R>>,
    options: {
      maxAttempts?: number;
      initialDelayMs?: number;
      maxDelayMs?: number;
    } = {}
  ): Promise<ApiResponse<R>> {
    const { maxAttempts = 3, initialDelayMs = 100, maxDelayMs = 5000 } = options;

    let lastError: ApiResponse<R> | null = null;
    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await operation();

      if (result.success) {
        return result;
      }

      // Don't retry on validation or auth errors
      if (
        result.error?.code === 'VALIDATION_ERROR' ||
        result.error?.code === 'UNAUTHORIZED' ||
        result.error?.code === 'FORBIDDEN'
      ) {
        return result;
      }

      lastError = result;

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, maxDelayMs);
      }
    }

    return lastError || createErrorResponse('INTERNAL_ERROR', 'Operation failed after retries');
  }
}
