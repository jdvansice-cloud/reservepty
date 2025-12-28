'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  missing_token: {
    title: 'Enlace Inválido',
    description: 'El enlace de aprobación no contiene la información necesaria.',
  },
  invalid_token: {
    title: 'Enlace No Encontrado',
    description: 'El enlace de aprobación no es válido o ha sido utilizado.',
  },
  expired_token: {
    title: 'Enlace Expirado',
    description: 'El enlace de aprobación ha expirado. Por favor solicita uno nuevo.',
  },
  update_failed: {
    title: 'Error de Sistema',
    description: 'No se pudo procesar tu aprobación. Por favor intenta de nuevo.',
  },
  unknown: {
    title: 'Error Inesperado',
    description: 'Ocurrió un error. Por favor intenta de nuevo o contacta soporte.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unknown';
  const errorInfo = ERROR_MESSAGES[reason] || ERROR_MESSAGES.unknown;

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-surface border-border">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-muted mb-6">
            {errorInfo.description}
          </p>

          <div className="space-y-3">
            <Link href="/approvals">
              <Button className="w-full">
                Ver Aprobaciones Pendientes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Ir al Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ApprovalErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
