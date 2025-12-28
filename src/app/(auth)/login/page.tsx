'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// Google Icon Component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { signIn, signInWithGoogle } = useAuth();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: t('auth.login.failed'),
          description: error.message,
          variant: 'error',
        });
      } else {
        toast({
          title: t('auth.login.success'),
          description: t('auth.login.successDesc'),
          variant: 'success',
        });
        router.push(redirectTo);
      }
    } catch (error) {
      toast({
        title: t('auth.login.error'),
        description: t('auth.login.errorDesc'),
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: t('auth.login.error'),
        description: language === 'es' ? 'Error al iniciar sesión con Google.' : 'Failed to sign in with Google.',
        variant: 'error',
      });
      setIsGoogleLoading(false);
    }
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

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-white mb-2">
          {t('auth.login.title')}
        </h1>
        <p className="text-muted">
          {t('auth.login.subtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.login.email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={language === 'es' ? 'tu@empresa.com' : 'you@company.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.login.password')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={language === 'es' ? 'Ingresa tu contraseña' : 'Enter your password'}
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
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-gold-500 hover:text-gold-400 transition-colors"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          {t('auth.login.submit')}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-navy-950 px-4 text-subtle">{t('auth.login.orContinue')}</span>
        </div>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        size="lg"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <GoogleIcon className="w-5 h-5 mr-2" />
        )}
        {language === 'es' ? 'Continuar con Google' : 'Continue with Google'}
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-navy-950 px-4 text-subtle">
            {t('auth.login.noAccount')}
          </span>
        </div>
      </div>

      {/* Sign up link */}
      <Link href="/signup">
        <Button variant="secondary" className="w-full" size="lg">
          {language === 'es' ? 'Crear una Cuenta' : 'Create an Account'}
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

function DecorativeSection() {
  const { language } = useLanguage();
  
  return (
    <div className="hidden lg:flex flex-1 relative bg-gradient-luxury items-center justify-center p-12">
      <div className="absolute inset-0 bg-gradient-radial from-gold-500/10 via-transparent to-transparent" />
      
      {/* Decorative content */}
      <div className="relative z-10 max-w-lg text-center">
        <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
          <span className="text-gold-500 font-display text-4xl font-bold">R</span>
        </div>
        <h2 className="font-display text-3xl font-semibold text-white mb-4">
          {language === 'es' ? 'Gestión de Activos de Lujo' : 'Luxury Asset Management'}
        </h2>
        <p className="text-muted text-lg">
          {language === 'es' 
            ? 'Coordina reservas de aviones privados, helicópteros, residencias exclusivas y yates de manera fluida.'
            : 'Seamlessly coordinate bookings across private planes, helicopters, exclusive residences, and yachts.'}
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
      <DecorativeSection />
    </div>
  );
}
