/**
 * API Response Types
 *
 * Standardized response wrappers for all API operations.
 * Provides consistent error handling and response structure.
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Base API response structure
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Pagination input parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * API Error structure
 */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Standard API error codes
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST';

/**
 * Error code to HTTP status mapping
 */
export const ErrorCodeToStatus: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  NETWORK_ERROR: 503,
};

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration
 */
export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

/**
 * Base query options for list operations
 */
export interface QueryOptions<T> {
  pagination?: PaginationParams;
  sort?: SortConfig<T>;
  filters?: Partial<T>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract the data type from an ApiResponse
 */
export type ExtractData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Timestamp fields common to all entities
 */
export interface TimestampFields {
  created_at: string;
  updated_at?: string;
}

/**
 * Soft delete fields
 */
export interface SoftDeleteFields {
  deleted_at: string | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
    success: true,
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse<T = null>(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<T> {
  return {
    data: null,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
    success: false,
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta
): PaginatedResponse<T> {
  return {
    data,
    error: null,
    success: true,
    pagination,
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  totalCount: number
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { data: T; error: null } {
  return response.success && response.data !== null;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { data: null; error: ApiError } {
  return !response.success && response.error !== null;
}
