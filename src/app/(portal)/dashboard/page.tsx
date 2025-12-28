'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, SECTIONS, formatDate, formatRelativeTime } from '@/lib/utils';
import {
  Plane,
  Ship,
  Home,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  watercraft: Ship,
};

// Mock data for development
const mockStats = {
  totalAssets: 12,
  activeBookings: 5,
  totalMembers: 23,
  thisMonthBookings: 18,
};

const mockSectionStats = [
  { section: 'planes', count: 3, bookings: 8 },
  { section: 'helicopters', count: 2, bookings: 3 },
  { section: 'residences', count: 5, bookings: 12 },
  { section: 'watercraft', count: 2, bookings: 4 },
];

const mockRecentBookings = [
  {
    id: '1',
    assetName: 'Gulfstream G650',
    section: 'planes',
    userName: 'John Smith',
    startDate: new Date(Date.now() + 86400000 * 2),
    endDate: new Date(Date.now() + 86400000 * 2 + 36000000),
    status: 'approved',
  },
  {
    id: '2',
    assetName: 'Miami Beach Villa',
    section: 'residences',
    userName: 'Sarah Johnson',
    startDate: new Date(Date.now() + 86400000 * 5),
    endDate: new Date(Date.now() + 86400000 * 10),
    status: 'pending',
  },
  {
    id: '3',
    assetName: 'Azimut 72',
    section: 'watercraft',
    userName: 'Michael Chen',
    startDate: new Date(Date.now() + 86400000 * 7),
    endDate: new Date(Date.now() + 86400000 * 9),
    status: 'approved',
  },
  {
    id: '4',
    assetName: 'Bell 429',
    section: 'helicopters',
    userName: 'Emma Williams',
    startDate: new Date(Date.now() - 86400000),
    endDate: new Date(Date.now() - 86400000 + 14400000),
    status: 'completed',
  },
];

export default function DashboardPage() {
  const { profile, organization, membership } = useAuth();
  const { t, language } = useLanguage();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (language === 'es') {
      if (hour < 12) setGreeting('Buenos días');
      else if (hour < 18) setGreeting('Buenas tardes');
      else setGreeting('Buenas noches');
    } else {
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    }
  }, [language]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-emerald-400 bg-emerald-400/10';
      case 'pending':
        return 'text-amber-400 bg-amber-400/10';
      case 'rejected':
        return 'text-red-400 bg-red-400/10';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10';
      default:
        return 'text-muted bg-muted/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircle2;
      case 'pending':
        return AlertCircle;
      case 'rejected':
        return XCircle;
      case 'completed':
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white">
            {greeting}, {profile?.first_name || (language === 'es' ? 'usuario' : 'there')}
          </h1>
          <p className="text-sm sm:text-base text-muted mt-1">
            {language === 'es' 
              ? 'Esto es lo que está pasando con tus activos hoy.'
              : "Here's what's happening with your assets today."}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted">{t('dashboard.totalAssets')}</p>
                <p className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
                  {mockStats.totalAssets}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-gold-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted">{t('dashboard.activeBookings')}</p>
                <p className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
                  {mockStats.activeBookings}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted">{t('dashboard.totalMembers')}</p>
                <p className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
                  {mockStats.totalMembers}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted">{language === 'es' ? 'Este Mes' : 'This Month'}</p>
                <p className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
                  {mockStats.thisMonthBookings}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {mockSectionStats.map((stat) => {
          const Icon = SECTION_ICONS[stat.section];
          const sectionInfo = SECTIONS[stat.section as keyof typeof SECTIONS];
          return (
            <Link key={stat.section} href={`/assets?section=${stat.section}`}>
              <Card className="card-hover h-full">
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${sectionInfo?.color}20` }}
                    >
                      <Icon
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        style={{ color: sectionInfo?.color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted capitalize truncate">{t(`assets.section.${stat.section}`)}</p>
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-lg sm:text-xl font-display font-bold text-white">
                          {stat.count}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted">{language === 'es' ? 'activos' : 'assets'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
                    <p className="text-[10px] sm:text-xs text-muted truncate">
                      <span className="text-white font-medium">{stat.bookings}</span> {language === 'es' ? 'reservas' : 'bookings'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Bookings - Full Width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 px-4 md:px-6">
          <CardTitle className="text-base md:text-lg font-display">{language === 'es' ? 'Reservas Recientes' : 'Recent Bookings'}</CardTitle>
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-xs md:text-sm">
              {language === 'es' ? 'Ver todo' : 'View all'}
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {mockRecentBookings.map((booking) => {
              const Icon = SECTION_ICONS[booking.section];
              const StatusIcon = getStatusIcon(booking.status);
              const sectionInfo = SECTIONS[booking.section as keyof typeof SECTIONS];
              return (
                <div
                  key={booking.id}
                  className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-surface transition-colors"
                >
                  <div
                    className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${sectionInfo?.color}20` }}
                  >
                    <Icon
                      className="w-4 h-4 md:w-5 md:h-5"
                      style={{ color: sectionInfo?.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {booking.assetName}
                    </p>
                    <p className="text-xs text-muted">
                      {booking.userName} • {formatDate(booking.startDate)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                      getStatusColor(booking.status)
                    )}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {t(`bookings.status.${booking.status}`)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
