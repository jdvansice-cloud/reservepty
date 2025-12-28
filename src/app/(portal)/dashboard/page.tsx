'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Plane, Navigation2, Building2, Ship, Calendar, Users, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { session, profile, organization, entitlements } = useAuth();
  const { language } = useLanguage();
  const [stats, setStats] = useState({ totalAssets: 0, upcomingBookings: 0, pendingApprovals: 0, members: 0 });
  const [loading, setLoading] = useState(true);

  const t = {
    en: { welcome: 'Welcome back', totalAssets: 'Total Assets', upcomingBookings: 'Upcoming Bookings', pendingApprovals: 'Pending Approvals', members: 'Members', sections: 'Your Sections', planes: 'Planes', helicopters: 'Helicopters', residences: 'Residences & Spaces', boats: 'Boats' },
    es: { welcome: 'Bienvenido', totalAssets: 'Total de Activos', upcomingBookings: 'Próximas Reservas', pendingApprovals: 'Aprobaciones Pendientes', members: 'Miembros', sections: 'Tus Secciones', planes: 'Aviones', helicopters: 'Helicópteros', residences: 'Residencias y Espacios', boats: 'Embarcaciones' },
  };
  const text = t[language];

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.access_token) return;
      try {
        const response = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (response.ok) { const data = await response.json(); setStats(data.stats || stats); }
      } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    }
    fetchDashboardData();
  }, [session]);

  const sectionIcons: Record<string, any> = { planes: Plane, helicopters: Navigation2, residences: Building2, boats: Ship };
  const activeSections = entitlements.filter(e => e.is_active).map(e => e.section);

  return (
    <div className="p-6 pb-24 lg:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{text.welcome}, {profile?.first_name || 'User'}</h1>
        <p className="text-white/60">{organization?.commercial_name}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Plane, value: stats.totalAssets, label: text.totalAssets, color: '#c8b273' },
          { icon: Calendar, value: stats.upcomingBookings, label: text.upcomingBookings, color: '#3b82f6' },
          { icon: Clock, value: stats.pendingApprovals, label: text.pendingApprovals, color: '#f97316' },
          { icon: Users, value: stats.members, label: text.members, color: '#22c55e' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${stat.color}20` }}>
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-white/60 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">{text.sections}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {activeSections.map(section => {
            const Icon = sectionIcons[section] || Plane;
            return (
              <div key={section} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#c8b273]/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#c8b273]" />
                </div>
                <span className="text-white font-medium">{text[section as keyof typeof text] || section}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
