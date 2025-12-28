'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Types
interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface OrganizationMembership {
  id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  tier_id: string | null;
  organization: {
    id: string;
    legal_name: string;
    commercial_name: string | null;
    logo_url: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  memberships: OrganizationMembership[];
  currentOrganization: OrganizationMembership | null;
  loading: boolean;
  isDevMode: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  setCurrentOrganization: (orgId: string) => void;
  refreshMemberships: () => Promise<void>;
  devModeLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dev mode mock data
const DEV_USER: User = {
  id: 'dev-user-001',
  email: 'dev@reservepty.com',
  app_metadata: {},
  user_metadata: { first_name: 'Development', last_name: 'User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const DEV_PROFILE: Profile = {
  id: 'dev-user-001',
  email: 'dev@reservepty.com',
  first_name: 'Development',
  last_name: 'User',
  avatar_url: null,
  phone: null,
};

const DEV_MEMBERSHIPS: OrganizationMembership[] = [
  {
    id: 'dev-membership-001',
    organization_id: 'dev-org-001',
    role: 'owner',
    tier_id: null,
    organization: {
      id: 'dev-org-001',
      legal_name: 'Demo Family Office',
      commercial_name: 'Demo Family',
      logo_url: null,
    },
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [currentOrganization, setCurrentOrgState] = useState<OrganizationMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  // Load profile and memberships
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch memberships with organization details
      const { data: membershipData } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          role,
          tier_id,
          organization:organizations (
            id,
            legal_name,
            commercial_name,
            logo_url
          )
        `)
        .eq('user_id', userId);

      if (membershipData) {
        const formattedMemberships = membershipData.map((m: any) => ({
          id: m.id,
          organization_id: m.organization_id,
          role: m.role,
          tier_id: m.tier_id,
          organization: m.organization,
        }));
        setMemberships(formattedMemberships);

        // Set current org from localStorage or first membership
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const currentMembership = formattedMemberships.find(
          (m: OrganizationMembership) => m.organization_id === savedOrgId
        ) || formattedMemberships[0];
        
        if (currentMembership) {
          setCurrentOrgState(currentMembership);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    // Check for dev mode
    const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
                    localStorage.getItem('devMode') === 'true';
    setIsDevMode(devMode);

    // Check for dev mode session
    if (devMode && localStorage.getItem('devModeActive') === 'true') {
      setUser(DEV_USER);
      setProfile(DEV_PROFILE);
      setMemberships(DEV_MEMBERSHIPS);
      setCurrentOrgState(DEV_MEMBERSHIPS[0]);
      setLoading(false);
      return;
    }

    // Real Supabase auth
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSession(session);
          setUser(session.user);
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setProfile(null);
          setMemberships([]);
          setCurrentOrgState(null);
        }

        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('currentOrganizationId');
          localStorage.removeItem('devModeActive');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadUserData]);

  // Sign up
  const signUp = async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<{ error: AuthError | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (!error && data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        first_name: firstName || null,
        last_name: lastName || null,
      });
    }

    return { error };
  };

  // Sign in
  const signIn = async (
    email: string, 
    password: string
  ): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentOrganizationId');
    localStorage.removeItem('devModeActive');
    setUser(null);
    setSession(null);
    setProfile(null);
    setMemberships([]);
    setCurrentOrgState(null);
    router.push('/login');
  };

  // Reset password
  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  // Update profile
  const updateProfile = async (data: Partial<Profile>): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...data });
    }

    return { error };
  };

  // Set current organization
  const setCurrentOrganization = (orgId: string) => {
    const membership = memberships.find(m => m.organization_id === orgId);
    if (membership) {
      setCurrentOrgState(membership);
      localStorage.setItem('currentOrganizationId', orgId);
    }
  };

  // Refresh memberships
  const refreshMemberships = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  // Dev mode login
  const devModeLogin = () => {
    localStorage.setItem('devModeActive', 'true');
    setUser(DEV_USER);
    setProfile(DEV_PROFILE);
    setMemberships(DEV_MEMBERSHIPS);
    setCurrentOrgState(DEV_MEMBERSHIPS[0]);
    router.push('/dashboard');
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    memberships,
    currentOrganization,
    loading,
    isDevMode,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    setCurrentOrganization,
    refreshMemberships,
    devModeLogin,
  };

  return (
    <AuthContext.Provider value={value}>
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

export function useCurrentOrganization() {
  const { currentOrganization, setCurrentOrganization, memberships } = useAuth();
  return { currentOrganization, setCurrentOrganization, memberships };
}

export function useIsOwnerOrAdmin() {
  const { currentOrganization } = useAuth();
  return currentOrganization?.role === 'owner' || currentOrganization?.role === 'admin';
}
