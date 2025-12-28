'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action') || 'approved';
  const title = searchParams.get('title') || 'Reserva';

  const isApproved = action !== 'reject';

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-surface border-border">
        <CardContent className="pt-8 pb-6 text-center">
          {isApproved ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                ¡Aprobación Confirmada!
              </h1>
              <p className="text-muted mb-6">
                Has aprobado exitosamente la reserva:
                <br />
                <span className="text-white font-medium">{decodeURIComponent(title)}</span>
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                Reserva Rechazada
              </h1>
              <p className="text-muted mb-6">
                Has rechazado la reserva:
                <br />
                <span className="text-white font-medium">{decodeURIComponent(title)}</span>
              </p>
            </>
          )}

          <Link href="/dashboard">
            <Button className="w-full">
              Ir al Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ApprovalSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
