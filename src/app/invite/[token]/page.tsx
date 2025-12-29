'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Mail, 
  Shield, 
  Eye, 
  EyeOff,
  User,
  Lock,
  AlertCircle,
} from 'lucide-react';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  tier_id: string | null;
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
  const router = useRouter();
  const { toast } = useToast();
  const token = typeof params?.token === 'string' ? params.token : '';
  
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

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

  // Check if user is logged in
  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      try {
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

  const isGmailAccount = invitation?.email?.toLowerCase().endsWith('@gmail.com');

  const handleGoogleSignIn = async () => {
    if (!invitation) return;
    
    try {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?invite=${token}`,
          queryParams: {
            login_hint: invitation.email,
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Could not sign in with Google',
        variant: 'error',
      });
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    setFormError(null);

    // Validation
    if (!firstName.trim()) {
      setFormError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setFormError('Last name is required');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Sign up with email and password
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?invite=${token}`,
        },
      });

      if (signUpError) throw signUpError;

      // Check if email confirmation is required
      if (signUpData.user && !signUpData.session) {
        // Email confirmation required
        toast({
          title: 'Check your email',
          description: 'Please verify your email to complete registration.',
        });
        setSuccess(true);
        return;
      }

      // If we have a session, accept the invitation immediately
      if (signUpData.session) {
        setAccessToken(signUpData.session.access_token);
        
        // Update profile with name
        await supabase
          .from('profiles')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          })
          .eq('id', signUpData.user?.id);

        // Accept the invitation
        const acceptResponse = await fetch(`/api/invitations/${token}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${signUpData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!acceptResponse.ok) {
          const errorData = await acceptResponse.json();
          throw new Error(errorData.error || 'Failed to accept invitation');
        }

        setSuccess(true);
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error creating account:', err);
      setFormError(err.message || 'Error creating account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptExisting = async () => {
    if (!invitation || !accessToken) return;

    if (currentUser?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      setFormError(`This invitation is for ${invitation.email}. Please sign in with that account.`);
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
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (err: any) {
      setFormError(err.message || 'Error accepting invitation');
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

  // Show loading
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

  // Show error
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

  // Show success
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

  // If user is already logged in
  if (currentUser) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-navy-800 border-navy-700">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
                <span className="text-navy-950 font-bold text-xl">R</span>
              </div>
              <span className="text-2xl font-semibold text-white">
                Reserve<span className="text-gold-500">PTY</span>
              </span>
            </div>

            {/* Organization info */}
            <div className="text-center mb-6">
              {invitation.organizations?.logo_url ? (
                <img 
                  src={invitation.organizations.logo_url} 
                  alt={getOrgName()}
                  className="w-16 h-16 rounded-xl object-cover mx-auto mb-3"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gold-500/10 mx-auto mb-3 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gold-500" />
                </div>
              )}
              <h1 className="text-lg font-semibold text-white mb-1">
                Join {getOrgName()}
              </h1>
              <p className="text-sm text-gray-400">
                as {roleLabels[invitation.role] || invitation.role}
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{formError}</p>
              </div>
            )}

            {currentUser.email?.toLowerCase() === invitation.email.toLowerCase() ? (
              <Button 
                className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950" 
                onClick={handleAcceptExisting}
                disabled={isAccepting}
              >
                {isAccepting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Accept Invitation
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-amber-400 mb-4">
                  You&apos;re signed in as <span className="font-medium">{currentUser.email}</span>
                  <br />
                  This invitation is for <span className="font-medium">{invitation.email}</span>
                </p>
                <Link href="/login">
                  <Button variant="secondary" className="w-full">
                    Switch Account
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show signup form for new users
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-navy-800 border-navy-700">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-navy-950 font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-semibold text-white">
              Reserve<span className="text-gold-500">PTY</span>
            </span>
          </div>

          {/* Organization info */}
          <div className="text-center mb-6">
            {invitation.organizations?.logo_url ? (
              <img 
                src={invitation.organizations.logo_url} 
                alt={getOrgName()}
                className="w-16 h-16 rounded-xl object-cover mx-auto mb-3"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gold-500/10 mx-auto mb-3 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-gold-500" />
              </div>
            )}
            <h1 className="text-lg font-semibold text-white mb-1">
              Join {getOrgName()}
            </h1>
            <p className="text-sm text-gray-400">
              Create your account to join as {roleLabels[invitation.role] || invitation.role}
            </p>
          </div>

          {/* Google Sign In (for Gmail accounts) */}
          {isGmailAccount && (
            <>
              <Button
                type="button"
                variant="secondary"
                className="w-full mb-4 border-navy-600 text-white hover:bg-navy-700"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-navy-600" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-navy-800 text-gray-500">or create with email</span>
                </div>
              </div>
            </>
          )}

          {/* Error message */}
          {formError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{formError}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleCreateAccount} className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <Label className="text-gray-400">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="email"
                  value={invitation.email}
                  disabled
                  className="pl-10 bg-navy-900 border-navy-600 text-gray-400"
                />
              </div>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="pl-10 bg-navy-900 border-navy-600 text-white placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Last Name</Label>
                <Input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="bg-navy-900 border-navy-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label className="text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-navy-900 border-navy-600 text-white placeholder:text-gray-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="text-gray-300">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-navy-900 border-navy-600 text-white placeholder:text-gray-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Account & Join
            </Button>
          </form>

          {/* Already have account */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link 
                href={`/login?redirect=/invite/${token}`}
                className="text-gold-500 hover:text-gold-400"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Expiry notice */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Invitation expires {new Date(invitation.expires_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
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
