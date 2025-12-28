'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';

function VerifyEmailContent() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;
    
    setIsResending(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        toast({
          title: language === 'es' ? 'Error' : 'Error',
          description: error.message,
          variant: 'error',
        });
      } else {
        toast({
          title: language === 'es' ? '¡Correo reenviado!' : 'Email resent!',
          description: language === 'es' 
            ? 'Revisa tu bandeja de entrada' 
            : 'Check your inbox',
          variant: 'success',
        });
        setResendCooldown(60); // 60 second cooldown
      }
    } catch (error) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' 
          ? 'No se pudo reenviar el correo' 
          : 'Could not resend email',
        variant: 'error',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-navy-950 font-display font-bold text-xl">R</span>
            </div>
            <span className="font-display text-2xl font-semibold text-white">
              Reserve<span className="text-gold-500">PTY</span>
            </span>
          </div>

          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-gold-500/10 mx-auto flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-gold-500" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-display font-semibold text-white mb-3">
            {language === 'es' ? 'Verifica tu correo electrónico' : 'Check your email'}
          </h1>

          {/* Description */}
          <p className="text-muted mb-2">
            {language === 'es' 
              ? 'Te hemos enviado un enlace de verificación a:' 
              : "We've sent a verification link to:"}
          </p>
          
          {email && (
            <p className="text-gold-500 font-medium mb-6 break-all">
              {email}
            </p>
          )}

          <p className="text-muted text-sm mb-8">
            {language === 'es' 
              ? 'Haz clic en el enlace del correo para activar tu cuenta y continuar con la configuración.' 
              : 'Click the link in the email to activate your account and continue with setup.'}
          </p>

          {/* Checklist */}
          <div className="bg-surface rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-muted mb-3">
              {language === 'es' ? '¿No ves el correo?' : "Don't see the email?"}
            </p>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'es' 
                    ? 'Revisa tu carpeta de spam o correo no deseado' 
                    : 'Check your spam or junk folder'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'es' 
                    ? 'Asegúrate de que el correo electrónico sea correcto' 
                    : 'Make sure the email address is correct'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'es' 
                    ? 'El enlace expira en 24 horas' 
                    : 'The link expires in 24 hours'}
                </span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {email && (
              <Button
                className="w-full"
                variant="secondary"
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {resendCooldown > 0 
                  ? `${language === 'es' ? 'Reenviar en' : 'Resend in'} ${resendCooldown}s`
                  : language === 'es' ? 'Reenviar correo de verificación' : 'Resend verification email'}
              </Button>
            )}

            <Link href="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Volver al inicio de sesión' : 'Back to login'}
              </Button>
            </Link>
          </div>

          {/* Help text */}
          <p className="text-xs text-muted mt-6">
            {language === 'es' 
              ? '¿Necesitas ayuda? Contacta soporte@reservepty.com'
              : 'Need help? Contact support@reservepty.com'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
