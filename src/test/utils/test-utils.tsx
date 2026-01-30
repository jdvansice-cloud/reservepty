'use client';

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import {
  MockAuthProvider,
  createMockAuthContext,
  mockUseAuth,
  type AuthContextValue,
} from '../mocks/auth';

// ============================================================================
// MOCK THE AUTH PROVIDER
// ============================================================================

// Mock the useAuth hook at module level
vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================================
// QUERY CLIENT FOR TESTING
// ============================================================================

/**
 * Creates a fresh QueryClient configured for testing
 * - Disables retries for predictable test behavior
 * - Disables garbage collection during tests
 * - Logs errors to console in test environment
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// TEST WRAPPER COMPONENT
// ============================================================================

interface TestWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
  authContext?: Partial<AuthContextValue>;
}

/**
 * Wrapper component that provides all necessary context providers for testing
 * - QueryClientProvider for React Query
 * - AuthProvider with mock context
 */
export function TestWrapper({
  children,
  queryClient,
  authContext,
}: TestWrapperProps): ReactElement {
  const client = queryClient || createTestQueryClient();
  const mockAuth = createMockAuthContext(authContext);

  // Update the mock to return the new auth context
  mockUseAuth.mockReturnValue(mockAuth);

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================================================
// CUSTOM RENDER FUNCTION
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  authContext?: Partial<AuthContextValue>;
}

/**
 * Custom render function that wraps component with all necessary providers
 * Use this instead of @testing-library/react's render for component tests
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), authContext, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestWrapper queryClient={queryClient} authContext={authContext}>
      {children}
    </TestWrapper>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// ============================================================================
// HOOK TESTING UTILITIES
// ============================================================================

interface WrapperOptions {
  queryClient?: QueryClient;
  authContext?: Partial<AuthContextValue>;
}

/**
 * Creates a wrapper function for testing hooks with renderHook
 *
 * @example
 * const { result } = renderHook(() => useAssets(), {
 *   wrapper: createHookWrapper({ authContext: { isAuthenticated: true } }),
 * });
 */
export function createHookWrapper(options: WrapperOptions = {}) {
  const { queryClient = createTestQueryClient(), authContext } = options;

  return function HookWrapper({ children }: { children: ReactNode }) {
    return (
      <TestWrapper queryClient={queryClient} authContext={authContext}>
        {children}
      </TestWrapper>
    );
  };
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wait for a specific amount of time (useful for testing async operations)
 */
export function waitForMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flush all pending promises
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Re-export auth mock utilities
export { mockUseAuth, createMockAuthContext } from '../mocks/auth';
export type { AuthContextValue } from '../mocks/auth';
