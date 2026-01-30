'use client';

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  ApiErrorCode,
  createSuccessResponse,
  createErrorResponse,
  calculatePagination,
} from '@/lib/types/api.types';
import {
  createSuccessResponse as success,
  createErrorResponse as error,
  calculatePagination as calcPagination,
} from '@/lib/types/api.types';

// ============================================================================
// TYPES
// ============================================================================

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

/**
 * Filter operators for query building
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

/**
 * Filter condition
 */
export interface FilterCondition<T> {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Repository query options
 */
export interface RepositoryQueryOptions<T> {
  pagination?: PaginationParams;
  orderBy?: {
    column: keyof T;
    ascending?: boolean;
  };
  filters?: FilterCondition<T>[];
  select?: string;
}

// ============================================================================
// BASE REPOSITORY
// ============================================================================

/**
 * Base Repository class providing common CRUD operations
 *
 * @template T - The table name in the database
 *
 * @example
 * ```typescript
 * class AssetRepository extends BaseRepository<'assets'> {
 *   constructor() {
 *     super('assets');
 *   }
 *
 *   async getByOrganization(orgId: string) {
 *     return this.findMany({
 *       filters: [{ field: 'organization_id', operator: 'eq', value: orgId }]
 *     });
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<T extends TableName> {
  protected tableName: T;
  protected supabase = createClient();

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Find a single record by ID
   */
  async findById(
    id: string,
    options?: { select?: string }
  ): Promise<ApiResponse<TableRow<T>>> {
    try {
      const query = this.supabase
        .from(this.tableName)
        .select(options?.select || '*')
        .eq('id', id)
        .single();

      const { data, error: dbError } = await query;

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          return error('NOT_FOUND', `${this.tableName} not found`);
        }
        return this.handleDatabaseError(dbError);
      }

      return success(data as unknown as TableRow<T>);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }

  /**
   * Find multiple records with optional filtering and pagination
   */
  async findMany(
    options?: RepositoryQueryOptions<TableRow<T>>
  ): Promise<PaginatedResponse<TableRow<T>>> {
    try {
      const page = options?.pagination?.page || 1;
      const pageSize = options?.pagination?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      // Build count query
      let countQuery = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Build data query
      let dataQuery = this.supabase
        .from(this.tableName)
        .select(options?.select || '*');

      // Apply filters to both queries
      if (options?.filters) {
        for (const filter of options.filters) {
          const column = filter.field as string;
          countQuery = this.applyFilter(countQuery, column, filter.operator, filter.value);
          dataQuery = this.applyFilter(dataQuery, column, filter.operator, filter.value);
        }
      }

      // Apply ordering
      if (options?.orderBy) {
        dataQuery = dataQuery.order(options.orderBy.column as string, {
          ascending: options.orderBy.ascending ?? true,
        });
      } else {
        dataQuery = dataQuery.order('created_at', { ascending: false });
      }

      // Apply pagination
      dataQuery = dataQuery.range(offset, offset + pageSize - 1);

      // Execute queries
      const [{ count }, { data, error: dbError }] = await Promise.all([
        countQuery,
        dataQuery,
      ]);

      if (dbError) {
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: dbError.message,
            timestamp: new Date().toISOString(),
          },
          success: false,
          pagination: calcPagination(page, pageSize, 0),
        };
      }

      const totalCount = count || 0;

      return {
        data: (data || []) as unknown as TableRow<T>[],
        error: null,
        success: true,
        pagination: calcPagination(page, pageSize, totalCount),
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
        pagination: calcPagination(1, 20, 0),
      };
    }
  }

  /**
   * Find first record matching filters
   */
  async findFirst(
    filters: FilterCondition<TableRow<T>>[],
    options?: { select?: string }
  ): Promise<ApiResponse<TableRow<T>>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(options?.select || '*');

      for (const filter of filters) {
        query = this.applyFilter(query, filter.field as string, filter.operator, filter.value);
      }

      const { data, error: dbError } = await query.limit(1).single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          return error('NOT_FOUND', 'Record not found');
        }
        return this.handleDatabaseError(dbError);
      }

      return success(data as unknown as TableRow<T>);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    const { count } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id', id);

    return (count || 0) > 0;
  }

  /**
   * Count records matching filters
   */
  async count(filters?: FilterCondition<TableRow<T>>[]): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters) {
      for (const filter of filters) {
        query = this.applyFilter(query, filter.field as string, filter.operator, filter.value);
      }
    }

    const { count } = await query;
    return count || 0;
  }

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Create a new record
   */
  async create(data: TableInsert<T>): Promise<ApiResponse<TableRow<T>>> {
    try {
      const { data: created, error: dbError } = await this.supabase
        .from(this.tableName)
        .insert(data as Record<string, unknown>)
        .select()
        .single();

      if (dbError) {
        return this.handleDatabaseError(dbError);
      }

      return success(created as TableRow<T>);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }

  /**
   * Create multiple records
   */
  async createMany(data: TableInsert<T>[]): Promise<ApiResponse<TableRow<T>[]>> {
    try {
      const { data: created, error: dbError } = await this.supabase
        .from(this.tableName)
        .insert(data as Record<string, unknown>[])
        .select();

      if (dbError) {
        return this.handleDatabaseError(dbError);
      }

      return success((created || []) as unknown as TableRow<T>[]);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string,
    data: TableUpdate<T>
  ): Promise<ApiResponse<TableRow<T>>> {
    try {
      const { data: updated, error: dbError } = await this.supabase
        .from(this.tableName)
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          return error('NOT_FOUND', `${this.tableName} not found`);
        }
        return this.handleDatabaseError(dbError);
      }

      return success(updated as TableRow<T>);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }

  /**
   * Update multiple records matching filters
   */
  async updateMany(
    filters: FilterCondition<TableRow<T>>[],
    data: TableUpdate<T>
  ): Promise<ApiResponse<TableRow<T>[]>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .update(data as Record<string, unknown>);

      for (const filter of filters) {
        query = this.applyFilter(query, filter.field as string, filter.operator, filter.value);
      }

      const { data: updated, error: dbError } = await query.select();

      if (dbError) {
        return this.handleDatabaseError(dbError);
      }

      return success((updated || []) as unknown as TableRow<T>[]);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }

  /**
   * Delete a record by ID (hard delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error: dbError } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (dbError) {
        return this.handleDatabaseError(dbError);
      }

      return success(undefined as void);
    } catch (err) {
      return this.handleUnexpectedError(err);
    }
  }

  /**
   * Soft delete a record (sets deleted_at)
   */
  async softDelete(id: string): Promise<ApiResponse<TableRow<T>>> {
    return this.update(id, {
      deleted_at: new Date().toISOString(),
    } as TableUpdate<T>);
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Apply a filter to a query
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected applyFilter(query: any, column: string, operator: FilterOperator, value: unknown): any {
    switch (operator) {
      case 'eq':
        return query.eq(column, value);
      case 'neq':
        return query.neq(column, value);
      case 'gt':
        return query.gt(column, value);
      case 'gte':
        return query.gte(column, value);
      case 'lt':
        return query.lt(column, value);
      case 'lte':
        return query.lte(column, value);
      case 'like':
        return query.like(column, value);
      case 'ilike':
        return query.ilike(column, value);
      case 'in':
        return query.in(column, value as unknown[]);
      case 'is':
        return query.is(column, value);
      default:
        return query;
    }
  }

  /**
   * Handle database errors
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected handleDatabaseError(dbError: any): ApiResponse<any> {
    let code: ApiErrorCode = 'DATABASE_ERROR';
    let message = dbError.message || 'Database error';

    // Map common Postgres error codes
    if (dbError.code === '23505') {
      code = 'CONFLICT';
      message = 'A record with this value already exists';
    } else if (dbError.code === '23503') {
      code = 'BAD_REQUEST';
      message = 'Referenced record does not exist';
    } else if (dbError.code === '42501') {
      code = 'FORBIDDEN';
      message = 'Insufficient permissions';
    }

    return error(code, message, { originalError: dbError });
  }

  /**
   * Handle unexpected errors
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected handleUnexpectedError(err: unknown): ApiResponse<any> {
    console.error(`[${this.tableName}Repository] Unexpected error:`, err);
    return error(
      'INTERNAL_ERROR',
      err instanceof Error ? err.message : 'An unexpected error occurred'
    );
  }
}
