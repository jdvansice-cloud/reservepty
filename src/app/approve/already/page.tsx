'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';

function AlreadyContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'approved';

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-surface border-border">
        <CardContent className="pt-8 pb-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            status === 'approved' ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            {status === 'approved' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400" />
            )}
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-2">
            Ya Respondiste
          </h1>
          <p className="text-muted mb-6">
            Ya has respondido a esta solicitud de aprobación.
            <br />
            Estado: <span className={`font-medium ${
              status === 'approved' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {status === 'approved' ? 'Aprobado' : 'Rechazado'}
            </span>
          </p>

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

export default function AlreadyRespondedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full" />
      </div>
    }>
      <AlreadyContent />
    </Suspense>
  );
}
