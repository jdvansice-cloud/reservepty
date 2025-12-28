'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: t('auth.login.error'),
        description: language === 'es' ? 'Error al registrarse con Google.' : 'Failed to sign up with Google.',
        variant: 'error',
      });
      setIsGoogleLoading(false);
    }
  };

  const passwordRequirements = language === 'es' 
    ? [
        { label: 'Al menos 8 caracteres', met: formData.password.length >= 8 },
        { label: 'Contiene un número', met: /\d/.test(formData.password) },
        { label: 'Contiene letra mayúscula', met: /[A-Z]/.test(formData.password) },
      ]
    : [
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
        title: language === 'es' ? 'Contraseña débil' : 'Weak password',
        description: language === 'es' 
          ? 'Asegúrate de que tu contraseña cumpla todos los requisitos.'
          : 'Please ensure your password meets all requirements.',
        variant: 'error',
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: t('auth.signup.passwordMismatch'),
        description: language === 'es' 
          ? 'Asegúrate de que ambas contraseñas sean idénticas.'
          : 'Please ensure both passwords are identical.',
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (result.error) {
        toast({
          title: t('auth.signup.failed'),
          description: result.error.message,
          variant: 'error',
        });
      } else if (result.confirmEmail) {
        // Email confirmation required - redirect to verify email page
        toast({
          title: t('auth.signup.success'),
          description: t('auth.signup.successDesc'),
          variant: 'success',
        });
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        // No email confirmation needed (auto-confirmed or dev mode)
        toast({
          title: t('auth.signup.success'),
          description: language === 'es' ? 'Tu cuenta ha sido creada' : 'Your account has been created',
          variant: 'success',
        });
        router.push('/onboarding');
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

  const features = language === 'es'
    ? [
        'Prueba gratuita de 14 días',
        'Sin tarjeta de crédito requerida',
        'Acceso completo a todas las funciones',
        'Cancela cuando quieras',
      ]
    : [
        '14-day free trial',
        'No credit card required',
        'Full access to all features',
        'Cancel anytime',
      ];

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
            {language === 'es' 
              ? 'Comienza a Gestionar tus Activos Hoy' 
              : 'Start Managing Your Assets Today'}
          </h2>
          <p className="text-muted text-lg mb-8">
            {language === 'es'
              ? 'Únete a family offices y organizaciones que confían en ReservePTY para la coordinación de sus activos de lujo.'
              : 'Join family offices and organizations who trust ReservePTY for their luxury asset coordination.'}
          </p>

          {/* Features list */}
          <ul className="space-y-4">
            {features.map((feature) => (
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
              {t('auth.signup.title')}
            </h1>
            <p className="text-muted">
              {t('auth.signup.subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.signup.firstName')}</Label>
                <Input
                  id="firstName"
                  placeholder={language === 'es' ? 'Juan' : 'John'}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.signup.lastName')}</Label>
                <Input
                  id="lastName"
                  placeholder={language === 'es' ? 'Pérez' : 'Smith'}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.signup.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={language === 'es' ? 'tu@empresa.com' : 'you@company.com'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.signup.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={language === 'es' ? 'Crea una contraseña segura' : 'Create a strong password'}
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
              <Label htmlFor="confirmPassword">{t('auth.signup.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={language === 'es' ? 'Confirma tu contraseña' : 'Confirm your password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                autoComplete="new-password"
                error={formData.confirmPassword.length > 0 && !passwordsMatch}
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-400">{t('auth.signup.passwordMismatch')}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              loading={isLoading}
              disabled={!allRequirementsMet || !passwordsMatch}
            >
              {t('auth.signup.submit')}
            </Button>

            <p className="text-center text-subtle text-xs">
              {t('auth.signup.terms')}{' '}
              <Link href="/terms" className="text-gold-500 hover:underline">
                {t('auth.signup.termsLink')}
              </Link>{' '}
              {t('auth.signup.and')}{' '}
              <Link href="/privacy" className="text-gold-500 hover:underline">
                {t('auth.signup.privacyLink')}
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-navy-950 px-4 text-subtle">{t('auth.signup.orContinue')}</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={handleGoogleSignUp}
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
              <span className="bg-navy-950 px-4 text-subtle">{t('auth.signup.haveAccount')}</span>
            </div>
          </div>

          {/* Sign in link */}
          <Link href="/login">
            <Button variant="secondary" className="w-full" size="lg">
              {language === 'es' ? 'Iniciar Sesión' : 'Sign In Instead'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
