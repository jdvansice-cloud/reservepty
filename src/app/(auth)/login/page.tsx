'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { signIn, isDevMode, devModeLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'error',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have been signed in successfully.',
          variant: 'success',
        });
        router.push(redirectTo);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevModeLogin = () => {
    devModeLogin();
    toast({
      title: 'Dev Mode Active',
      description: 'Logged in with development account.',
      variant: 'success',
    });
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-12">
        <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
          <span className="text-navy-950 font-display font-bold text-xl">R</span>
        </div>
        <span className="font-display text-2xl font-semibold text-white">
          Reserve<span className="text-gold-500">PTY</span>
        </span>
      </Link>

      {/* Dev Mode Banner */}
      {isDevMode && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Development Mode</span>
          </div>
          <p className="text-sm text-amber-200/70 mb-3">
            Skip authentication for testing purposes
          </p>
          <Button 
            onClick={handleDevModeLogin}
            variant="secondary"
            size="sm"
            className="w-full bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-500"
          >
            <Zap className="w-4 h-4 mr-2" />
            Quick Access (Dev Mode)
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-white mb-2">
          Welcome back
        </h1>
        <p className="text-muted">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-gold-500 hover:text-gold-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          Sign In
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-navy-950 px-4 text-subtle">New to ReservePTY?</span>
        </div>
      </div>

      {/* Sign up link */}
      <Link href="/signup">
        <Button variant="secondary" className="w-full" size="lg">
          Create an Account
        </Button>
      </Link>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-luxury items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-radial from-gold-500/10 via-transparent to-transparent" />
        
        {/* Decorative content */}
        <div className="relative z-10 max-w-lg text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <span className="text-gold-500 font-display text-4xl font-bold">R</span>
          </div>
          <h2 className="font-display text-3xl font-semibold text-white mb-4">
            Luxury Asset Management
          </h2>
          <p className="text-muted text-lg">
            Seamlessly coordinate bookings across private planes, helicopters, 
            exclusive residences, and yachts.
          </p>
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gold-500" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
