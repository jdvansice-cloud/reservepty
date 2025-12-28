'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'en' | 'es'>('en');

  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('es')) {
      setLang('es');
    }
  }, []);

  const t = {
    en: {
      title: 'Welcome Back',
      subtitle: 'Sign in to your ReservePTY account',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      errorInvalid: 'Invalid email or password',
      orContinueWith: 'Or continue with',
      google: 'Google',
    },
    es: {
      title: 'Bienvenido',
      subtitle: 'Inicia sesión en tu cuenta de ReservePTY',
      email: 'Correo electrónico',
      password: 'Contraseña',
      signIn: 'Iniciar Sesión',
      signingIn: 'Iniciando sesión...',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes una cuenta?',
      signUp: 'Regístrate',
      errorInvalid: 'Correo o contraseña inválidos',
      orContinueWith: 'O continúa con',
      google: 'Google',
    },
  };

  const text = t[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(text.errorInvalid);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError(text.errorInvalid);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2b4a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-[#c8b273] rounded-lg flex items-center justify-center">
              <span className="text-[#0a1628] font-bold text-2xl">R</span>
            </div>
            <span className="text-white text-2xl font-semibold">ReservePTY</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-2">{text.title}</h1>
          <p className="text-white/60 mb-6">{text.subtitle}</p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-1">{text.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#c8b273]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-1">{text.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#c8b273] pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-[#c8b273] text-sm hover:underline">
                {text.forgotPassword}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c8b273] text-[#0a1628] py-3 rounded-lg font-semibold hover:bg-[#d4c088] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? text.signingIn : text.signIn}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-sm">{text.orContinueWith}</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white/10 border border-white/20 text-white py-3 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {text.google}
          </button>

          <p className="text-center text-white/60 mt-6">
            {text.noAccount}{' '}
            <Link href="/signup" className="text-[#c8b273] hover:underline">
              {text.signUp}
            </Link>
          </p>
        </div>

        {/* Language toggle */}
        <div className="text-center mt-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="text-white/50 hover:text-white text-sm"
          >
            {lang === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}
          </button>
        </div>
      </div>
    </div>
  );
}
