'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Loader2,
  ChevronRight,
  Home,
  Plane,
  Ship,
  Navigation,
  Mail,
} from 'lucide-react';

interface PendingApproval {
  id: string;
  reservation_id: string;
  rule_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reservation?: {
    id: string;
    title: string;
    start_datetime: string;
    end_datetime: string;
    status: string;
    asset?: {
      id: string;
      name: string;
      section: string;
    };
    profile?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  };
  rule?: {
    id: string;
    name: string;
    description: string | null;
  };
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Navigation,
  residences: Home,
  watercraft: Ship,
};

export default function PendingApprovalsPage() {
  const { session, user, organization } = useAuth();
  const { toast } = useToast();

  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.access_token && user?.id) {
      fetchApprovals();
    }
  }, [session?.access_token, user?.id]);

  const fetchApprovals = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/rule_approvals?user_id=eq.${user!.id}&status=eq.pending&select=*,reservation:reservations(id,title,start_datetime,end_datetime,status,asset:assets(id,name,section),profile:profiles!reservations_user_id_fkey(id,first_name,last_name,email)),rule:tier_booking_rules(id,name,description)`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session!.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Format nested data
        const formatted = data.map((a: any) => ({
          ...a,
          reservation: Array.isArray(a.reservation) ? a.reservation[0] : a.reservation,
          rule: Array.isArray(a.rule) ? a.rule[0] : a.rule,
        })).map((a: any) => ({
          ...a,
          reservation: a.reservation ? {
            ...a.reservation,
            asset: Array.isArray(a.reservation.asset) ? a.reservation.asset[0] : a.reservation.asset,
            profile: Array.isArray(a.reservation.profile) ? a.reservation.profile[0] : a.reservation.profile,
          } : null,
        }));
        setApprovals(formatted);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, action: 'approved' | 'rejected') => {
    setProcessingId(approvalId);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/rule_approvals?id=eq.${approvalId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session!.access_token}`,
          },
          body: JSON.stringify({
            status: action,
            responded_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update approval');

      // Check if all approvals for this reservation are complete
      const approval = approvals.find(a => a.id === approvalId);
      if (approval && action === 'approved') {
        await checkAndUpdateReservation(approval.reservation_id);
      }

      toast({
        title: action === 'approved' ? 'Aprobado' : 'Rechazado',
        description: action === 'approved' 
          ? 'La reserva ha sido aprobada por ti'
          : 'La reserva ha sido rechazada',
      });

      // Remove from list
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo procesar', variant: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const checkAndUpdateReservation = async (reservationId: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Check if all approvals for this reservation are approved
      const response = await fetch(
        `${baseUrl}/rest/v1/rule_approvals?reservation_id=eq.${reservationId}&select=status`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session!.access_token}`,
          },
        }
      );

      if (response.ok) {
        const allApprovals = await response.json();
        const allApproved = allApprovals.every((a: any) => a.status === 'approved');
        
        if (allApproved) {
          // Update reservation to approved
          await fetch(
            `${baseUrl}/rest/v1/reservations?id=eq.${reservationId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey!,
                'Authorization': `Bearer ${session!.access_token}`,
              },
              body: JSON.stringify({
                status: 'approved',
                approved_at: new Date().toISOString(),
              }),
            }
          );
        }
      }
    } catch (error) {
      console.error('Error checking reservation status:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserName = (profile: any) => {
    if (!profile) return 'Usuario';
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Aprobaciones Pendientes</h1>
        <p className="text-muted mt-1">Reservas que requieren tu aprobación</p>
      </div>

      {approvals.length === 0 ? (
        <Card className="bg-surface border-border">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Sin aprobaciones pendientes</h3>
            <p className="text-muted">No tienes reservas esperando tu aprobación</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const SectionIcon = approval.reservation?.asset?.section 
              ? SECTION_ICONS[approval.reservation.asset.section] || Home
              : Home;

            return (
              <Card key={approval.id} className="bg-surface border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-lg shrink-0",
                      "bg-amber-500/20"
                    )}>
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">
                          {approval.reservation?.title || 'Reserva'}
                        </h3>
                        <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Pendiente
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <SectionIcon className="w-3 h-3" />
                          {approval.reservation?.asset?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {approval.reservation?.start_datetime && formatDate(approval.reservation.start_datetime)}
                          {' - '}
                          {approval.reservation?.end_datetime && formatDate(approval.reservation.end_datetime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {getUserName(approval.reservation?.profile)}
                        </span>
                      </div>

                      {approval.rule && (
                        <div className="mt-2 p-2 bg-navy-800 rounded text-sm">
                          <span className="text-gold-400 font-medium">Regla: </span>
                          <span className="text-white">{approval.rule.name}</span>
                          {approval.rule.description && (
                            <p className="text-muted text-xs mt-1">{approval.rule.description}</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          onClick={() => handleApproval(approval.id, 'approved')}
                          disabled={processingId === approval.id}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {processingId === approval.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Aprobar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleApproval(approval.id, 'rejected')}
                          disabled={processingId === approval.id}
                          variant="outline"
                          size="sm"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
