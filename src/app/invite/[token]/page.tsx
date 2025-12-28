'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Building2, Mail, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  organization: {
    id: string;
    commercial_name: string | null;
    legal_name: string;
    logo_url: string | null;
  };
  inviter: {
    first_name: string;
    last_name: string;
  };
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, session } = useAuth();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('invitations')
          .select(`
            id,
            email,
            role,
            expires_at,
            accepted_at,
            organizations:organization_id (
              id,
              commercial_name,
              legal_name,
              logo_url
            ),
            profiles:invited_by (
              first_name,
              last_name
            )
          `)
          .eq('token', token)
          .single();

        if (error || !data) {
          setError(language === 'es' 
            ? 'Invitación no encontrada o inválida' 
            : 'Invitation not found or invalid');
          setIsLoading(false);
          return;
        }

        // Check if already accepted
        if (data.accepted_at) {
          setError(language === 'es' 
            ? 'Esta invitación ya ha sido aceptada' 
            : 'This invitation has already been accepted');
          setIsLoading(false);
          return;
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setError(language === 'es' 
            ? 'Esta invitación ha expirado' 
            : 'This invitation has expired');
          setIsLoading(false);
          return;
        }

        // Handle array response from Supabase join
        const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
        const inviter = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

        setInvitation({
          id: data.id,
          email: data.email,
          role: data.role,
          expires_at: data.expires_at,
          organization: org,
          inviter: inviter,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError(language === 'es' 
          ? 'Error al cargar la invitación' 
          : 'Error loading invitation');
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token, language]);

  const handleAccept = async () => {
    if (!invitation || !session?.access_token) return;

    // Check if logged-in user's email matches invitation email
    if (user?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      setError(language === 'es'
        ? `Esta invitación es para ${invitation.email}. Por favor inicia sesión con esa cuenta.`
        : `This invitation is for ${invitation.email}. Please sign in with that account.`);
      return;
    }

    setIsAccepting(true);

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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
        router.push('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || (language === 'es' 
        ? 'Error al aceptar la invitación' 
        : 'Error accepting invitation'));
      setIsAccepting(false);
    }
  };

  const roleLabels: Record<string, { es: string; en: string }> = {
    owner: { es: 'Propietario', en: 'Owner' },
    admin: { es: 'Administrador', en: 'Admin' },
    manager: { es: 'Gerente', en: 'Manager' },
    member: { es: 'Miembro', en: 'Member' },
    viewer: { es: 'Observador', en: 'Viewer' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-muted">
            {language === 'es' ? 'Cargando invitación...' : 'Loading invitation...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-display font-semibold text-white mb-2">
              {language === 'es' ? 'Invitación Inválida' : 'Invalid Invitation'}
            </h1>
            <p className="text-muted mb-6">{error}</p>
            <Link href="/login">
              <Button className="w-full">
                {language === 'es' ? 'Ir a Iniciar Sesión' : 'Go to Login'}
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
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-display font-semibold text-white mb-2">
              {language === 'es' ? '¡Bienvenido!' : 'Welcome!'}
            </h1>
            <p className="text-muted mb-4">
              {language === 'es' 
                ? `Te has unido a ${invitation?.organization.commercial_name || invitation?.organization.legal_name}` 
                : `You've joined ${invitation?.organization.commercial_name || invitation?.organization.legal_name}`}
            </p>
            <p className="text-sm text-muted">
              {language === 'es' ? 'Redirigiendo al panel...' : 'Redirecting to dashboard...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-navy-950 font-display font-bold text-xl">R</span>
            </div>
            <span className="font-display text-2xl font-semibold text-white">
              Reserve<span className="text-gold-500">PTY</span>
            </span>
          </div>

          {/* Organization info */}
          <div className="text-center mb-8">
            {invitation?.organization.logo_url ? (
              <img 
                src={invitation.organization.logo_url} 
                alt={invitation.organization.commercial_name || invitation.organization.legal_name}
                className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gold-500/10 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-gold-500" />
              </div>
            )}
            <h1 className="text-xl font-display font-semibold text-white mb-2">
              {language === 'es' ? 'Te han invitado a unirte' : "You've been invited to join"}
            </h1>
            <p className="text-lg text-gold-500 font-medium">
              {invitation?.organization.commercial_name || invitation?.organization.legal_name}
            </p>
          </div>

          {/* Invitation details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <Mail className="w-5 h-5 text-muted" />
              <div>
                <p className="text-xs text-muted">
                  {language === 'es' ? 'Invitado por' : 'Invited by'}
                </p>
                <p className="text-sm text-white">
                  {invitation?.inviter.first_name} {invitation?.inviter.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <Shield className="w-5 h-5 text-muted" />
              <div>
                <p className="text-xs text-muted">
                  {language === 'es' ? 'Tu rol será' : 'Your role will be'}
                </p>
                <p className="text-sm text-white capitalize">
                  {roleLabels[invitation?.role || 'member']?.[language] || invitation?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {user ? (
            <div className="space-y-3">
              {user.email?.toLowerCase() === invitation?.email.toLowerCase() ? (
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleAccept}
                  loading={isAccepting}
                >
                  {language === 'es' ? 'Aceptar Invitación' : 'Accept Invitation'}
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-amber-400 mb-4">
                    {language === 'es' 
                      ? `Estás conectado como ${user.email}. Esta invitación es para ${invitation?.email}.`
                      : `You're signed in as ${user.email}. This invitation is for ${invitation?.email}.`}
                  </p>
                  <Link href="/login">
                    <Button variant="secondary" className="w-full">
                      {language === 'es' ? 'Cambiar Cuenta' : 'Switch Account'}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Link href={`/signup?email=${encodeURIComponent(invitation?.email || '')}&invite=${token}`}>
                <Button className="w-full" size="lg">
                  {language === 'es' ? 'Crear Cuenta y Unirse' : 'Create Account & Join'}
                </Button>
              </Link>
              <Link href={`/login?redirect=/invite/${token}`}>
                <Button variant="secondary" className="w-full" size="lg">
                  {language === 'es' ? 'Ya tengo cuenta' : 'I already have an account'}
                </Button>
              </Link>
            </div>
          )}

          {/* Expiry notice */}
          <p className="text-xs text-muted text-center mt-6">
            {language === 'es' 
              ? `Esta invitación expira el ${new Date(invitation?.expires_at || '').toLocaleDateString('es-ES', { dateStyle: 'long' })}`
              : `This invitation expires on ${new Date(invitation?.expires_at || '').toLocaleDateString('en-US', { dateStyle: 'long' })}`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
