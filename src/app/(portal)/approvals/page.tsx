'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ApprovalsPage() {
  const { session, organizationId, memberRole } = useAuth();
  const { language } = useLanguage();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const t = { en: { title: 'Pending Approvals', noPending: 'No pending approvals', approve: 'Approve', reject: 'Reject' }, es: { title: 'Aprobaciones Pendientes', noPending: 'No hay aprobaciones pendientes', approve: 'Aprobar', reject: 'Rechazar' } };
  const text = t[language];
  const canApprove = ['owner', 'admin', 'manager'].includes(memberRole || '');

  useEffect(() => {
    async function fetchPending() {
      if (!session?.access_token || !organizationId) return;
      try {
        const response = await fetch(`/api/reservations?organizationId=${organizationId}&status=pending`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (response.ok) { const data = await response.json(); setPending(data.reservations || []); }
      } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    }
    fetchPending();
  }, [session, organizationId]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!session?.access_token) return;
    setProcessing(id);
    try {
      await fetch(`/api/reservations/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      setPending(pending.filter(r => r.id !== id));
    } catch (error) { console.error('Error:', error); } finally { setProcessing(null); }
  };

  return (
    <div className="p-6 pb-24 lg:pb-6">
      <h1 className="text-2xl font-bold text-white mb-6">{text.title}</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#c8b273] border-t-transparent rounded-full animate-spin" /></div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12 text-white/50">{text.noPending}</div>
      ) : (
        <div className="space-y-4">
          {pending.map(res => (
            <div key={res.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{res.asset?.name || res.title}</h3>
                  <p className="text-white/50 text-sm mt-1">{format(new Date(res.start_datetime), 'MMM d, yyyy HH:mm')} - {format(new Date(res.end_datetime), 'HH:mm')}</p>
                  <p className="text-white/40 text-sm">{res.profile?.first_name} {res.profile?.last_name}</p>
                </div>
                {canApprove && (
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(res.id, 'approve')} disabled={!!processing} className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-50">
                      {processing === res.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{text.approve}
                    </button>
                    <button onClick={() => handleAction(res.id, 'reject')} disabled={!!processing} className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm hover:bg-red-500/30 disabled:opacity-50">
                      <X className="w-4 h-4" />{text.reject}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
