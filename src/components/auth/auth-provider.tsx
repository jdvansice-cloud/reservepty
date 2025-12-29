'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Types
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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  membership: OrganizationMembership | null;
  memberships: OrganizationMembership[];
  subscription: Subscription | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ error: AuthError | Error | null; confirmEmail?: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setCurrentOrganization: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get session from cookies
function getSessionFromCookies(): { accessToken: string; refreshToken: string; user: User } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    
    // Find all auth token cookie parts and combine them
    const authTokenParts: { [key: string]: string } = {};
    
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      
      // Look for chunked auth token cookies (e.g., sb-xxx-auth-token.0, sb-xxx-auth-token.1)
      if (trimmed.includes('auth-token')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > -1) {
          const name = trimmed.substring(0, eqIndex);
          const value = trimmed.substring(eqIndex + 1);
          
          // Extract the chunk number if present
          const chunkMatch = name.match(/auth-token\.?(\d*)$/);
          const chunkNum = chunkMatch ? (chunkMatch[1] || '0') : '0';
          authTokenParts[chunkNum] = value;
        }
      }
    }
    
    // Combine chunks in order
    const chunkKeys = Object.keys(authTokenParts).sort((a, b) => parseInt(a) - parseInt(b));
    if (chunkKeys.length === 0) {
      return null;
    }
    
    let combinedValue = '';
    for (const key of chunkKeys) {
      combinedValue += authTokenParts[key];
    }
    
    // URL decode
    const decoded = decodeURIComponent(combinedValue);
    
    // Parse JSON
    let sessionData: any;
    
    if (decoded.startsWith('base64-')) {
      // Handle base64 encoded
      const base64 = decoded.replace('base64-', '');
      const json = atob(base64);
      sessionData = JSON.parse(json);
    } else {
      // Direct JSON
      sessionData = JSON.parse(decoded);
    }
    
    if (sessionData.access_token && sessionData.user) {
      return {
        accessToken: sessionData.access_token,
        refreshToken: sessionData.refresh_token || '',
        user: sessionData.user,
      };
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing session from cookies:', e);
  }
  
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMembership | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  
  // Create supabase client for auth operations only
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch subscription for an organization
  const fetchSubscription = useCallback(async (orgId: string, accessToken: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    try {
      const subRes = await fetch(
        `${baseUrl}/rest/v1/subscriptions?organization_id=eq.${orgId}&select=*`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (subRes.ok) {
        const subs = await subRes.json();
        if (subs.length > 0) {
          setSubscription(subs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }, []);

  const fetchProfileWithFetch = useCallback(async (userId: string, accessToken: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    try {
      // Fetch profile
      const profileRes = await fetch(
        `${baseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (profileRes.ok) {
        const profiles = await profileRes.json();
        if (profiles.length > 0) {
          setProfile(profiles[0]);
        }
      }

      // Fetch memberships with organization data
      const membershipRes = await fetch(
        `${baseUrl}/rest/v1/organization_members?user_id=eq.${userId}&select=id,organization_id,role,tier_id,organization:organizations(*)`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (membershipRes.ok) {
        const membershipData = await membershipRes.json();
        
        if (membershipData && membershipData.length > 0) {
          const formattedMemberships = membershipData.map((m: any) => ({
            id: m.id,
            organization_id: m.organization_id,
            role: m.role,
            tier_id: m.tier_id,
            organization: Array.isArray(m.organization) ? m.organization[0] : m.organization,
          }));
          
          setMemberships(formattedMemberships);

          // Restore saved organization or use first
          const savedOrgId = localStorage.getItem('currentOrganizationId');
          const currentMembership = formattedMemberships.find(
            (m: OrganizationMembership) => m.organization_id === savedOrgId
          ) || formattedMemberships[0];
          
          setMembership(currentMembership);
          setOrganization(currentMembership.organization);
          
          // Fetch subscription for the current organization
          await fetchSubscription(currentMembership.organization_id, accessToken);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscription]);

  // Helper to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  // Helper to delete cookie
  const deleteCookie = (name: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; max-age=0`;
  };

  // Check and accept pending invitation from cookie
  const checkPendingInvitation = useCallback(async (userId: string, userEmail: string, accessToken: string) => {
    if (typeof window === 'undefined') return;
    
    const pendingToken = getCookie('pendingInviteToken');
    if (!pendingToken) return;
    
    try {
      console.log('Found pending invitation token in cookie, attempting to accept...');
      
      const response = await fetch(`/api/invitations/${pendingToken}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('Pending invitation accepted successfully');
        // Clear the cookie
        deleteCookie('pendingInviteToken');
        // Refresh profile to get new organization membership
        await fetchProfileWithFetch(userId, accessToken);
      } else {
        const data = await response.json();
        console.error('Failed to accept pending invitation:', data.error);
        // Clear invalid token
        deleteCookie('pendingInviteToken');
      }
    } catch (error) {
      console.error('Error accepting pending invitation:', error);
      deleteCookie('pendingInviteToken');
    }
  }, [fetchProfileWithFetch]);

  useEffect(() => {
    // Try to get session from cookies directly
    const cookieSession = getSessionFromCookies();
    
    if (cookieSession) {
      setUser(cookieSession.user);
      setSession({ 
        access_token: cookieSession.accessToken,
        refresh_token: cookieSession.refreshToken,
      } as Session);
      
      // Fetch profile and then check for pending invitations
      fetchProfileWithFetch(cookieSession.user.id, cookieSession.accessToken).then(() => {
        // Check for pending invitation after profile is loaded (fallback if server didn't catch it)
        if (cookieSession.user.email) {
          checkPendingInvitation(cookieSession.user.id, cookieSession.user.email, cookieSession.accessToken);
        }
      });
    } else {
      setIsLoading(false);
    }
  }, [fetchProfileWithFetch, checkPendingInvitation]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        await fetchProfileWithFetch(data.user.id, data.session.access_token);
        
        // Check for pending invitation after login
        if (data.user.email) {
          await checkPendingInvitation(data.user.id, data.user.email, data.session.access_token);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata?.firstName,
            last_name: metadata?.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) return { error };

      // Note: Profile creation happens after email verification in the callback
      // But we still try to create it here for faster onboarding if email is auto-confirmed
      if (data.user && data.session) {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        await fetch(`${baseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${data.session?.access_token || apiKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            first_name: metadata?.firstName || null,
            last_name: metadata?.lastName || null,
          }),
        }).catch(() => {
          // Ignore profile creation errors - will be handled in callback
        });
      }

      // Return user data to check if email confirmation is required
      return { 
        error: null, 
        user: data.user,
        session: data.session,
        confirmEmail: !data.session // If no session, email confirmation is required
      };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOrganization(null);
    setMembership(null);
    setMemberships([]);
    setSubscription(null);
    localStorage.removeItem('currentOrganizationId');
    // Use window.location for reliable redirect after clearing auth state
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    if (user && session?.access_token) {
      await fetchProfileWithFetch(user.id, session.access_token);
    }
  };

  const setCurrentOrganization = async (orgId: string) => {
    const selected = memberships.find((m) => m.organization_id === orgId);
    if (selected) {
      setMembership(selected);
      setOrganization(selected.organization);
      localStorage.setItem('currentOrganizationId', orgId);
      
      // Fetch subscription for new organization
      if (session?.access_token) {
        await fetchSubscription(orgId, session.access_token);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        membership,
        memberships,
        subscription,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
        setCurrentOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
