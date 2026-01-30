import React from 'react';
import { vi } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Mock types matching auth-provider.tsx
 */
export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

export interface Organization {
  id: string;
  legal_name: string;
  commercial_name: string | null;
  ruc: string | null;
  dv: string | null;
  billing_email: string | null;
  logo_url: string | null;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  tier_id: string | null;
  organization: Organization;
}

export interface Subscription {
  id: string;
  organization_id: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'complimentary';
  billing_cycle: 'monthly' | 'yearly' | null;
  seat_limit: number;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  membership: OrganizationMembership | null;
  memberships: OrganizationMembership[];
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated?: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ error: Error | null; confirmEmail?: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setCurrentOrganization: (orgId: string) => void;
}

/**
 * Create mock user
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  ...overrides,
} as User);

/**
 * Create mock profile
 */
export const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  avatar_url: null,
  phone: null,
  ...overrides,
});

/**
 * Create mock organization
 */
export const createMockOrganization = (overrides?: Partial<Organization>): Organization => ({
  id: 'test-org-id',
  legal_name: 'Test Organization',
  commercial_name: 'Test Org',
  ruc: null,
  dv: null,
  billing_email: 'test@example.com',
  logo_url: null,
  ...overrides,
});

/**
 * Create mock membership
 */
export const createMockMember = (overrides?: Partial<OrganizationMembership>): OrganizationMembership => {
  const org = createMockOrganization();
  return {
    id: 'test-membership-id',
    organization_id: org.id,
    role: 'admin',
    tier_id: null,
    organization: org,
    ...overrides,
  };
};

/**
 * Create mock session
 */
export const createMockSession = (overrides?: Partial<Session>): Session => ({
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: createMockUser(),
  ...overrides,
} as Session);

/**
 * Create a complete mock auth context
 */
export const createMockAuthContext = (overrides?: Partial<AuthContextValue>): AuthContextValue => {
  const user = overrides?.user !== undefined ? overrides.user : createMockUser();
  const organization = overrides?.organization !== undefined ? overrides.organization : createMockOrganization();
  const membership = overrides?.membership !== undefined ? overrides.membership : createMockMember();

  return {
    user,
    session: overrides?.session !== undefined ? overrides.session : createMockSession(),
    profile: overrides?.profile !== undefined ? overrides.profile : createMockProfile(),
    organization,
    membership,
    memberships: overrides?.memberships || (membership ? [membership] : []),
    subscription: overrides?.subscription || null,
    isLoading: overrides?.isLoading ?? false,
    isAuthenticated: overrides?.isAuthenticated ?? !!user,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    setCurrentOrganization: vi.fn(),
  };
};

// Create a mock context value that can be modified in tests
let mockAuthContextValue: AuthContextValue = createMockAuthContext();

/**
 * Set the mock auth context value for tests
 */
export const setMockAuthContext = (value: Partial<AuthContextValue>) => {
  mockAuthContextValue = createMockAuthContext(value);
};

/**
 * Reset the mock auth context to defaults
 */
export const resetMockAuthContext = () => {
  mockAuthContextValue = createMockAuthContext();
};

/**
 * Mock useAuth hook
 */
export const mockUseAuth = vi.fn(() => mockAuthContextValue);

/**
 * Mock auth provider component for testing
 * This is used by test-utils.tsx
 */
export function MockAuthProvider({
  children,
  value
}: {
  children: React.ReactNode;
  value: AuthContextValue;
}): React.ReactElement {
  mockUseAuth.mockReturnValue(value);
  return React.createElement(React.Fragment, null, children);
}
