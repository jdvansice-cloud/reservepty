'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(formData.password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast({
        title: 'Weak password',
        description: 'Please ensure your password meets all requirements.',
        variant: 'error',
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are identical.',
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'error',
        });
      } else {
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
          variant: 'success',
        });
        router.push('/onboarding');
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

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-luxury items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-radial from-gold-500/10 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-lg">
          <div className="w-24 h-24 mb-8 rounded-3xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <span className="text-gold-500 font-display text-4xl font-bold">R</span>
          </div>
          <h2 className="font-display text-3xl font-semibold text-white mb-4">
            Start Managing Your Assets Today
          </h2>
          <p className="text-muted text-lg mb-8">
            Join family offices and organizations who trust ReservePTY 
            for their luxury asset coordination.
          </p>

          {/* Features list */}
          <ul className="space-y-4">
            {[
              '14-day free trial',
              'No credit card required',
              'Full access to all features',
              'Cancel anytime',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-muted">
                <div className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-gold-500" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
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

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-navy-950 font-display font-bold text-xl">R</span>
            </div>
            <span className="font-display text-2xl font-semibold text-white">
              Reserve<span className="text-gold-500">PTY</span>
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-white mb-2">
              Create your account
            </h1>
            <p className="text-muted">
              Get started with your 14-day free trial
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
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

              {/* Password requirements */}
              {formData.password && (
                <ul className="mt-3 space-y-1">
                  {passwordRequirements.map((req) => (
                    <li
                      key={req.label}
                      className={cn(
                        'flex items-center gap-2 text-xs transition-colors',
                        req.met ? 'text-emerald-400' : 'text-subtle'
                      )}
                    >
                      <Check className={cn('w-3 h-3', req.met ? 'opacity-100' : 'opacity-30')} />
                      {req.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                autoComplete="new-password"
                error={formData.confirmPassword.length > 0 && !passwordsMatch}
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              loading={isLoading}
              disabled={!allRequirementsMet || !passwordsMatch}
            >
              Create Account
            </Button>

            <p className="text-center text-subtle text-xs">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-gold-500 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-gold-500 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-navy-950 px-4 text-subtle">Already have an account?</span>
            </div>
          </div>

          {/* Sign in link */}
          <Link href="/login">
            <Button variant="secondary" className="w-full" size="lg">
              Sign In Instead
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
