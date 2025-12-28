'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Profile, Organization, Subscription, Entitlement, MemberRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  organizationId: string | null;
  subscription: Subscription | null;
  entitlements: Entitlement[];
  memberRole: MemberRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  organization: null,
  organizationId: null,
  subscription: null,
  entitlements: [],
  memberRole: null,
  loading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [memberRole, setMemberRole] = useState<MemberRole | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchUserData = async (userId: string, accessToken: string) => {
    try {
      // Fetch profile
      const profileRes = await fetch(`/api/auth/profile?userId=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      // Fetch organization membership
      const memberRes = await fetch(`/api/auth/membership?userId=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (memberRes.ok) {
        const memberData = await memberRes.json();
        if (memberData.organization_id) {
          setOrganizationId(memberData.organization_id);
          setMemberRole(memberData.role);

          // Fetch organization details
          const orgRes = await fetch(`/api/organizations/${memberData.organization_id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            setOrganization(orgData);
          }

          // Fetch subscription
          const subRes = await fetch(`/api/subscriptions?organizationId=${memberData.organization_id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            setSubscription(subData.subscription);
            setEntitlements(subData.entitlements || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshAuth = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      await fetchUserData(currentSession.user.id, currentSession.access_token);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchUserData(initialSession.user.id, initialSession.access_token);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession) {
          await fetchUserData(newSession.user.id, newSession.access_token);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setOrganization(null);
          setOrganizationId(null);
          setSubscription(null);
          setEntitlements([]);
          setMemberRole(null);
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        organizationId,
        subscription,
        entitlements,
        memberRole,
        loading,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
