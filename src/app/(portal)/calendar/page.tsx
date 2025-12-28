'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';

export default function CalendarPage() {
  const { session, organizationId } = useAuth();
  const { language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<any[]>([]);

  const t = { en: { title: 'Calendar', today: 'Today' }, es: { title: 'Calendario', today: 'Hoy' } };
  const text = t[language];

  useEffect(() => {
    async function fetchReservations() {
      if (!session?.access_token || !organizationId) return;
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      try {
        const response = await fetch(`/api/reservations?organizationId=${organizationId}&start=${start}&end=${end}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (response.ok) { const data = await response.json(); setReservations(data.reservations || []); }
      } catch (error) { console.error('Error:', error); }
    }
    fetchReservations();
  }, [session, organizationId, currentDate]);

  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const firstDayOfWeek = startOfMonth(currentDate).getDay();

  return (
    <div className="p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{text.title}</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="text-white/70 hover:text-white"><ChevronLeft className="w-6 h-6" /></button>
          <span className="text-white font-medium">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="text-white/70 hover:text-white"><ChevronRight className="w-6 h-6" /></button>
        </div>
      </div>
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-white/50 text-sm">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="p-2 min-h-[80px] border-b border-r border-white/5" />)}
          {days.map(day => {
            const dayReservations = reservations.filter(r => format(new Date(r.start_datetime), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
            return (
              <div key={day.toISOString()} className={`p-2 min-h-[80px] border-b border-r border-white/5 ${isToday(day) ? 'bg-[#c8b273]/10' : ''}`}>
                <span className={`text-sm ${isToday(day) ? 'text-[#c8b273] font-bold' : 'text-white/70'}`}>{format(day, 'd')}</span>
                {dayReservations.slice(0, 2).map(res => (
                  <div key={res.id} className="mt-1 px-1 py-0.5 bg-[#c8b273]/20 rounded text-xs text-[#c8b273] truncate">{res.asset?.name || res.title}</div>
                ))}
                {dayReservations.length > 2 && <div className="text-xs text-white/50 mt-1">+{dayReservations.length - 2} more</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
