'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Building2, Mail, Shield } from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  organizations?: {
    id: string;
    commercial_name: string | null;
    legal_name: string;
    logo_url: string | null;
  } | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

function InviteContent() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';
  
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch invitation data
  useEffect(() => {
    if (!mounted || !token) return;

    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${token}`);
        const data = await response.json();

        if (!response.ok || !data.invitation) {
          setError(data.error || 'Invitation not found or invalid');
          setIsLoading(false);
          return;
        }

        const inv = data.invitation;

        // Check if already accepted
        if (inv.accepted_at) {
          setError('This invitation has already been accepted');
          setIsLoading(false);
          return;
        }

        // Check if expired
        if (new Date(inv.expires_at) < new Date()) {
          setError('This invitation has expired');
          setIsLoading(false);
          return;
        }

        setInvitation(inv);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Error loading invitation');
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [mounted, token]);

  // Check if user is logged in (check for auth cookies)
  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      try {
        // Try to get user info from Supabase client
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          setCurrentUser({ email: session.user.email });
          setAccessToken(session.access_token);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }
    };

    checkAuth();
  }, [mounted]);

  const handleAccept = async () => {
    if (!invitation || !accessToken) return;

    if (currentUser?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      setError(`This invitation is for ${invitation.email}. Please sign in with that account.`);
      return;
    }

    setIsAccepting(true);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Error accepting invitation');
      setIsAccepting(false);
    }
  };

  const getOrgName = () => {
    if (!invitation?.organizations) return 'Organization';
    return invitation.organizations.commercial_name || invitation.organizations.legal_name || 'Organization';
  };

  const getInviterName = () => {
    if (!invitation?.profiles) return 'A team member';
    const first = invitation.profiles.first_name || '';
    const last = invitation.profiles.last_name || '';
    const fullName = `${first} ${last}`.trim();
    return fullName || 'A team member';
  };

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    member: 'Member',
    viewer: 'Viewer',
  };

  // Show loading while not mounted or still loading
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-navy-800 border-navy-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Invalid Invitation</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link href="/login">
              <Button className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-navy-800 border-navy-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Welcome!</h1>
            <p className="text-gray-400 mb-4">You&apos;ve joined {getOrgName()}</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-navy-800 border-navy-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Invitation Not Found</h1>
            <p className="text-gray-400 mb-6">We could not find this invitation.</p>
            <Link href="/login">
              <Button className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-navy-800 border-navy-700">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-navy-950 font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-semibold text-white">
              Reserve<span className="text-gold-500">PTY</span>
            </span>
          </div>

          {/* Organization info */}
          <div className="text-center mb-8">
            {invitation.organizations?.logo_url ? (
              <img 
                src={invitation.organizations.logo_url} 
                alt={getOrgName()}
                className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gold-500/10 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-gold-500" />
              </div>
            )}
            <h1 className="text-xl font-semibold text-white mb-2">
              You&apos;ve been invited to join
            </h1>
            <p className="text-lg text-gold-500 font-medium">
              {getOrgName()}
            </p>
          </div>

          {/* Invitation details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-navy-900 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Invited by</p>
                <p className="text-sm text-white">{getInviterName()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-navy-900 rounded-lg">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Your role will be</p>
                <p className="text-sm text-white capitalize">
                  {roleLabels[invitation.role] || invitation.role}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {currentUser ? (
            <div className="space-y-3">
              {currentUser.email?.toLowerCase() === invitation.email.toLowerCase() ? (
                <Button 
                  className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950" 
                  onClick={handleAccept}
                  disabled={isAccepting}
                >
                  {isAccepting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Accept Invitation
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-amber-400 mb-4">
                    You&apos;re signed in as {currentUser.email}. This invitation is for {invitation.email}.
                  </p>
                  <Link href="/login">
                    <Button variant="secondary" className="w-full">
                      Switch Account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Link href={`/signup?email=${encodeURIComponent(invitation.email)}&invite=${token}`}>
                <Button className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950">
                  Create Account & Join
                </Button>
              </Link>
              <Link href={`/login?redirect=/invite/${token}`}>
                <Button variant="secondary" className="w-full border-navy-600 text-white hover:bg-navy-700">
                  I already have an account
                </Button>
              </Link>
            </div>
          )}

          {/* Expiry notice */}
          <p className="text-xs text-gray-500 text-center mt-6">
            This invitation expires on {new Date(invitation.expires_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap in Suspense for safety
export default function InviteAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
