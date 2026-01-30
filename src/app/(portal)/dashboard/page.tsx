'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, SECTIONS, formatDate } from '@/lib/utils';
import {
  useDashboard,
  useDashboardStats,
  useSectionStats,
  useRecentBookings,
} from '@/lib/hooks/useDashboard';
import {
  Plane,
  Ship,
  Home,
  Navigation,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import type { Database } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

type AssetSection = Database['public']['Enums']['asset_section'];
type ReservationStatus = Database['public']['Enums']['reservation_status'];

// ============================================================================
// CONSTANTS
// ============================================================================

const SECTION_ICONS: Record<AssetSection, React.ElementType> = {
  planes: Plane,
  helicopters: Navigation,
  residences: Home,
  watercraft: Ship,
};

// ============================================================================
// HELPERS
// ============================================================================

const getStatusColor = (status: ReservationStatus) => {
  switch (status) {
    case 'approved':
      return 'text-emerald-400 bg-emerald-400/10';
    case 'pending':
      return 'text-amber-400 bg-amber-400/10';
    case 'rejected':
      return 'text-red-400 bg-red-400/10';
    case 'canceled':
      return 'text-stone-400 bg-stone-400/10';
    default:
      return 'text-muted bg-muted/10';
  }
};

const getStatusIcon = (status: ReservationStatus) => {
  switch (status) {
    case 'approved':
      return CheckCircle2;
    case 'pending':
      return AlertCircle;
    case 'rejected':
    case 'canceled':
      return XCircle;
    default:
      return Clock;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardPage() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [greeting, setGreeting] = useState('');

  // Fetch dashboard data
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: sectionStats,
    isLoading: sectionLoading,
  } = useSectionStats();

  const {
    data: recentBookings,
    isLoading: bookingsLoading,
  } = useRecentBookings(5);

  const isLoading = statsLoading || sectionLoading || bookingsLoading;

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

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in overflow-hidden">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchStats()}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCcw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          {language === 'es' ? 'Actualizar' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCardItem
          title={t('dashboard.totalAssets')}
          value={stats?.totalAssets ?? 0}
          icon={Plane}
          color="gold"
          isLoading={statsLoading}
        />
        <StatCardItem
          title={t('dashboard.activeBookings')}
          value={stats?.activeBookings ?? 0}
          icon={Calendar}
          color="emerald"
          isLoading={statsLoading}
        />
        <StatCardItem
          title={t('dashboard.totalMembers')}
          value={stats?.totalMembers ?? 0}
          icon={Users}
          color="blue"
          isLoading={statsLoading}
        />
        <StatCardItem
          title={language === 'es' ? 'Este Mes' : 'This Month'}
          value={stats?.monthlyBookings ?? 0}
          icon={TrendingUp}
          color="purple"
          isLoading={statsLoading}
          subtitle={
            stats?.pendingApprovals && stats.pendingApprovals > 0
              ? `${stats.pendingApprovals} ${language === 'es' ? 'pendientes' : 'pending'}`
              : undefined
          }
        />
      </div>

      {/* Section Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {sectionLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-surface" />
                  <div className="flex-1">
                    <div className="h-3 w-16 bg-surface rounded mb-2" />
                    <div className="h-5 w-12 bg-surface rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          sectionStats?.map((stat) => {
            const Icon = SECTION_ICONS[stat.section];
            const sectionInfo = SECTIONS[stat.section as keyof typeof SECTIONS];
            return (
              <Link key={stat.section} href={`/assets?section=${stat.section}`}>
                <Card className="card-hover h-full overflow-hidden">
                  <CardContent className="p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${sectionInfo?.color}20` }}
                      >
                        <Icon
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{ color: sectionInfo?.color }}
                        />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-xs sm:text-sm text-muted capitalize truncate">
                          {t(`assets.section.${stat.section}`)}
                        </p>
                        <div className="flex items-baseline gap-1 sm:gap-2">
                          <span className="text-lg sm:text-xl font-display font-bold text-white">
                            {stat.assetCount}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted">
                            {language === 'es' ? 'activos' : 'assets'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] sm:text-xs text-muted truncate">
                          <span className="text-white font-medium">{stat.bookingCount}</span>{' '}
                          {language === 'es' ? 'reservas' : 'bookings'}
                        </p>
                        {stat.utilizationRate > 0 && (
                          <span className="text-[10px] sm:text-xs text-emerald-400 font-medium">
                            {stat.utilizationRate}%
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 px-4 md:px-6">
          <CardTitle className="text-base md:text-lg font-display">
            {language === 'es' ? 'Reservas Recientes' : 'Recent Bookings'}
          </CardTitle>
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-xs md:text-sm">
              {language === 'es' ? 'Ver todo' : 'View all'}
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {bookingsLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 animate-pulse">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-surface" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-surface rounded mb-2" />
                    <div className="h-3 w-24 bg-surface rounded" />
                  </div>
                  <div className="h-6 w-16 bg-surface rounded-full" />
                </div>
              ))
            ) : recentBookings && recentBookings.length > 0 ? (
              recentBookings.map((booking) => {
                const Icon = SECTION_ICONS[booking.assetSection];
                const StatusIcon = getStatusIcon(booking.status);
                const sectionInfo = SECTIONS[booking.assetSection as keyof typeof SECTIONS];
                return (
                  <Link
                    key={booking.id}
                    href={`/calendar?reservation=${booking.id}`}
                    className="block"
                  >
                    <div className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-surface transition-colors">
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
                          {booking.title || booking.assetName}
                        </p>
                        <p className="text-xs text-muted truncate">
                          {booking.userName} • {formatDate(new Date(booking.startDatetime))}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0',
                          getStatusColor(booking.status)
                        )}
                      >
                        <StatusIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="hidden sm:inline">{t(`bookings.status.${booking.status}`)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              // Empty state
              <div className="px-4 md:px-6 py-8 text-center">
                <Clock className="w-10 h-10 mx-auto text-muted/50 mb-3" />
                <p className="text-sm text-muted">
                  {language === 'es' ? 'No hay reservas recientes' : 'No recent bookings'}
                </p>
                <Link href="/calendar">
                  <Button variant="outline" size="sm" className="mt-3">
                    {language === 'es' ? 'Crear reserva' : 'Create booking'}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals Alert (for admins) */}
      {stats?.pendingApprovals && stats.pendingApprovals > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">
                  {stats.pendingApprovals}{' '}
                  {language === 'es'
                    ? 'reservas pendientes de aprobación'
                    : 'bookings awaiting approval'}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  {language === 'es'
                    ? 'Revisa y aprueba las solicitudes de reserva'
                    : 'Review and approve booking requests'}
                </p>
              </div>
              <Link href="/calendar?status=pending">
                <Button size="sm" className="flex-shrink-0">
                  {language === 'es' ? 'Revisar' : 'Review'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD ITEM
// ============================================================================

interface StatCardItemProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'gold' | 'emerald' | 'blue' | 'purple';
  isLoading?: boolean;
  subtitle?: string;
}

function StatCardItem({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
  subtitle,
}: StatCardItemProps) {
  const colorClasses = {
    gold: 'bg-gold-500/10 text-gold-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <Card className="card-hover">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted">{title}</p>
            {isLoading ? (
              <div className="h-8 w-16 bg-surface rounded animate-pulse mt-1" />
            ) : (
              <>
                <p className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
                  {value.toLocaleString()}
                </p>
                {subtitle && (
                  <p className="text-xs text-amber-400 mt-0.5">{subtitle}</p>
                )}
              </>
            )}
          </div>
          <div
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center',
              colorClasses[color]
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
