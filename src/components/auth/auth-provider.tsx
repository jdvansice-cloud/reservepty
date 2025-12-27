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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  membership: OrganizationMembership | null;
  memberships: OrganizationMembership[];
  isLoading: boolean;
  isDevMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ error: AuthError | Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setCurrentOrganization: (orgId: string) => void;
  devModeLogin: () => void;
  devModeLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dev mode mock data for development bypass
const DEV_USER: User = {
  id: 'dev-user-001',
  email: 'dev@reservepty.com',
  app_metadata: {},
  user_metadata: { first_name: 'Development', last_name: 'User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

const DEV_PROFILE: Profile = {
  id: 'dev-user-001',
  email: 'dev@reservepty.com',
  first_name: 'Development',
  last_name: 'User',
  avatar_url: null,
  phone: '+507 6000-0000',
};

const DEV_ORGANIZATION: Organization = {
  id: 'dev-org-001',
  legal_name: 'Demo Family Office, S.A.',
  commercial_name: 'Demo Family Office',
  ruc: '155701234-2-2023',
  dv: '23',
  billing_email: 'billing@demofamily.com',
  logo_url: null,
};

const DEV_MEMBERSHIP: OrganizationMembership = {
  id: 'dev-membership-001',
  organization_id: 'dev-org-001',
  role: 'owner',
  tier_id: null,
  organization: DEV_ORGANIZATION,
};

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
      console.log('No auth token cookies found');
      return null;
    }
    
    let combinedValue = '';
    for (const key of chunkKeys) {
      combinedValue += authTokenParts[key];
    }
    
    console.log('Combined cookie value length:', combinedValue.length);
    
    // URL decode
    const decoded = decodeURIComponent(combinedValue);
    console.log('Decoded cookie starts with:', decoded.substring(0, 50));
    
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
    
    console.log('Session data keys:', Object.keys(sessionData));
    
    if (sessionData.access_token && sessionData.user) {
      return {
        accessToken: sessionData.access_token,
        refreshToken: sessionData.refresh_token || '',
        user: sessionData.user,
      };
    }
    
    console.log('Session data missing access_token or user');
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
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
             localStorage.getItem('devMode') === 'true';
    }
    return false;
  });

  const router = useRouter();
  
  // Create supabase client for auth operations only
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProfileWithFetch = useCallback(async (userId: string, accessToken: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('fetchProfileWithFetch called for user:', userId);
    
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
      
      console.log('Profile fetch status:', profileRes.status);
      
      if (profileRes.ok) {
        const profiles = await profileRes.json();
        console.log('Profiles:', profiles);
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

      console.log('Membership fetch status:', membershipRes.status);

      if (membershipRes.ok) {
        const membershipData = await membershipRes.json();
        console.log('Memberships:', membershipData);
        
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
          console.log('Set organization:', currentMembership.organization);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('AuthProvider useEffect running');
    
    // Check for dev mode session first
    if (typeof window !== 'undefined' && localStorage.getItem('devModeActive') === 'true') {
      console.log('Dev mode active');
      setUser(DEV_USER);
      setProfile(DEV_PROFILE);
      setOrganization(DEV_ORGANIZATION);
      setMembership(DEV_MEMBERSHIP);
      setMemberships([DEV_MEMBERSHIP]);
      setIsLoading(false);
      return;
    }

    // Try to get session from cookies directly
    const cookieSession = getSessionFromCookies();
    console.log('Cookie session:', cookieSession ? 'found' : 'not found');
    
    if (cookieSession) {
      console.log('Found session in cookies, user:', cookieSession.user.email);
      setUser(cookieSession.user);
      setSession({ 
        access_token: cookieSession.accessToken,
        refresh_token: cookieSession.refreshToken,
      } as Session);
      fetchProfileWithFetch(cookieSession.user.id, cookieSession.accessToken);
    } else {
      console.log('No session found in cookies, setting loading to false');
      setIsLoading(false);
    }
  }, [fetchProfileWithFetch]);

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
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) return { error };

      // Create profile for new user
      if (data.user) {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        await fetch(`${baseUrl}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${data.session?.access_token || apiKey}`,
          },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            first_name: metadata?.firstName || null,
            last_name: metadata?.lastName || null,
          }),
        });
      }

      return { error: null };
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
    localStorage.removeItem('currentOrganizationId');
    router.push('/login');
  };

  const refreshProfile = async () => {
    if (user && session?.access_token) {
      await fetchProfileWithFetch(user.id, session.access_token);
    }
  };

  const setCurrentOrganization = (orgId: string) => {
    const selected = memberships.find((m) => m.organization_id === orgId);
    if (selected) {
      setMembership(selected);
      setOrganization(selected.organization);
      localStorage.setItem('currentOrganizationId', orgId);
    }
  };

  const devModeLogin = () => {
    if (isDevMode) {
      localStorage.setItem('devModeActive', 'true');
      setUser(DEV_USER);
      setProfile(DEV_PROFILE);
      setOrganization(DEV_ORGANIZATION);
      setMembership(DEV_MEMBERSHIP);
      setMemberships([DEV_MEMBERSHIP]);
      setIsLoading(false);
    }
  };

  const devModeLogout = () => {
    localStorage.removeItem('devModeActive');
    setUser(null);
    setProfile(null);
    setOrganization(null);
    setMembership(null);
    setMemberships([]);
    router.push('/login');
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
        isLoading,
        isDevMode,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
        setCurrentOrganization,
        devModeLogin,
        devModeLogout,
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
