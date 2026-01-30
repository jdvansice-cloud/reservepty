import { vi } from 'vitest';

/**
 * Mock Supabase client for testing
 */

// Mock query builder chain
export const createMockQueryBuilder = () => {
  const builder: Record<string, unknown> = {};

  // Chain methods
  const chainMethods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'is',
    'in',
    'contains',
    'containedBy',
    'range',
    'overlaps',
    'textSearch',
    'match',
    'not',
    'or',
    'filter',
    'order',
    'limit',
    'offset',
    'single',
    'maybeSingle',
    'csv',
    'geojson',
    'explain',
  ];

  chainMethods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });

  // Terminal methods - return data
  builder.then = vi.fn();

  return builder;
};

// Mock response helper
export const mockSupabaseResponse = <T>(
  data: T | null,
  error: { message: string; code?: string } | null = null
) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : data ? 1 : 0,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
});

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const queryBuilder = createMockQueryBuilder();

  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockResolvedValue(mockSupabaseResponse(null)),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  };
};

// Export a pre-created mock client
export const mockSupabaseClient = createMockSupabaseClient();

// Mock getClient function
export const mockGetClient = vi.fn().mockReturnValue(mockSupabaseClient);
