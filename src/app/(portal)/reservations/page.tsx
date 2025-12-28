'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ReservationsPage() {
  const { session, organizationId } = useAuth();
  const { language } = useLanguage();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const t = { en: { title: 'Reservations', noReservations: 'No reservations found' }, es: { title: 'Reservaciones', noReservations: 'No se encontraron reservaciones' } };
  const text = t[language];

  useEffect(() => {
    async function fetchReservations() {
      if (!session?.access_token || !organizationId) return;
      try {
        const response = await fetch(`/api/reservations?organizationId=${organizationId}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (response.ok) { const data = await response.json(); setReservations(data.reservations || []); }
      } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    }
    fetchReservations();
  }, [session, organizationId]);

  const statusColors: Record<string, string> = { approved: 'bg-green-500/20 text-green-400', pending: 'bg-yellow-500/20 text-yellow-400', rejected: 'bg-red-500/20 text-red-400', canceled: 'bg-gray-500/20 text-gray-400' };

  return (
    <div className="p-6 pb-24 lg:pb-6">
      <h1 className="text-2xl font-bold text-white mb-6">{text.title}</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#c8b273] border-t-transparent rounded-full animate-spin" /></div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-12 text-white/50">{text.noReservations}</div>
      ) : (
        <div className="space-y-4">
          {reservations.map(res => (
            <div key={res.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{res.asset?.name || res.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-white/50 text-sm">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(res.start_datetime), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(res.start_datetime), 'HH:mm')} - {format(new Date(res.end_datetime), 'HH:mm')}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[res.status] || statusColors.pending}`}>{res.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
