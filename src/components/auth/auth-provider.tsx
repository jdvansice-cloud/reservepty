'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      setProfile(profileData);

      // Fetch ALL user's organizations
      const { data: membershipData } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          role,
          tier_id,
          organization:organizations(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (membershipData && membershipData.length > 0) {
        const formattedMemberships = membershipData.map((m: any) => ({
          id: m.id,
          organization_id: m.organization_id,
          role: m.role,
          tier_id: m.tier_id,
          organization: m.organization,
        }));
        
        setMemberships(formattedMemberships);

        // Restore saved organization or use first
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const currentMembership = formattedMemberships.find(
          (m: OrganizationMembership) => m.organization_id === savedOrgId
        ) || formattedMemberships[0];
        
        setMembership(currentMembership);
        setOrganization(currentMembership.organization);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Check for dev mode session first
    if (typeof window !== 'undefined' && localStorage.getItem('devModeActive') === 'true') {
      setUser(DEV_USER);
      setProfile(DEV_PROFILE);
      setOrganization(DEV_ORGANIZATION);
      setMembership(DEV_MEMBERSHIP);
      setMemberships([DEV_MEMBERSHIP]);
      setIsLoading(false);
      return;
    }

    // Add a timeout to ensure loading state doesn't hang indefinitely
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 second max loading time

    // Real Supabase auth
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setIsLoading(false);
        clearTimeout(timeoutId);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          clearTimeout(timeoutId);
        });
      } else {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    }).catch((err) => {
      console.error('Auth session error:', err);
      setIsLoading(false);
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setOrganization(null);
        setMembership(null);
        setMemberships([]);
        setIsLoading(false);
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('currentOrganizationId');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [supabase, fetchProfile]);

  const refreshProfile = async () => {
    if (user && user.id !== 'dev-user-001') {
      await fetchProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
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

    // Create profile after successful signup
    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        first_name: metadata?.firstName || null,
        last_name: metadata?.lastName || null,
      });
    }

    return { error };
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
    localStorage.removeItem('currentOrganizationId');
    localStorage.removeItem('devModeActive');
    
    // If in dev mode, just clear state
    if (user?.id === 'dev-user-001') {
      setUser(null);
      setSession(null);
      setProfile(null);
      setOrganization(null);
      setMembership(null);
      setMemberships([]);
      router.push('/login');
      return;
    }
    
    await supabase.auth.signOut();
    setProfile(null);
    setOrganization(null);
    setMembership(null);
    setMemberships([]);
    router.push('/login');
  };

  const setCurrentOrganization = (orgId: string) => {
    const newMembership = memberships.find(m => m.organization_id === orgId);
    if (newMembership) {
      setMembership(newMembership);
      setOrganization(newMembership.organization);
      localStorage.setItem('currentOrganizationId', orgId);
    }
  };

  // Dev mode bypass - for development/testing
  const devModeLogin = () => {
    localStorage.setItem('devModeActive', 'true');
    setUser(DEV_USER);
    setProfile(DEV_PROFILE);
    setOrganization(DEV_ORGANIZATION);
    setMembership(DEV_MEMBERSHIP);
    setMemberships([DEV_MEMBERSHIP]);
    router.push('/dashboard');
  };

  const devModeLogout = () => {
    localStorage.removeItem('devModeActive');
    setUser(null);
    setSession(null);
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

// Convenience hooks
export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useProfile() {
  const { profile } = useAuth();
  return profile;
}

export function useOrganization() {
  const { organization, membership, memberships, setCurrentOrganization } = useAuth();
  return { organization, membership, memberships, setCurrentOrganization };
}

export function useIsOwnerOrAdmin() {
  const { membership } = useAuth();
  return membership?.role === 'owner' || membership?.role === 'admin';
}
