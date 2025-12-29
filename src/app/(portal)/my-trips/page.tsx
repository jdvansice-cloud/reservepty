'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, SECTIONS } from '@/lib/utils';
import {
  Briefcase,
  Calendar,
  Plane,
  Ship,
  Home,
  Navigation,
  MapPin,
  Clock,
  Users,
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ChevronRight,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Navigation,
  residences: Home,
  watercraft: Ship,
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

interface Reservation {
  id: string;
  title: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  notes: string | null;
  guest_count: number | null;
  asset: {
    id: string;
    name: string;
    section: string;
    primary_photo_url: string | null;
    details: any;
  };
}

export default function MyTripsPage() {
  const { user, organization, session } = useAuth();
  const { language, t } = useLanguage();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    const fetchMyReservations = async () => {
      if (!user?.id || !organization?.id || !session?.access_token) {
        setIsLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${baseUrl}/rest/v1/reservations?organization_id=eq.${organization.id}&user_id=eq.${user.id}&select=*,asset:assets(id,name,section,primary_photo_url,details)&order=start_datetime.desc`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Handle array response from Supabase join
          const mapped = data.map((r: any) => ({
            ...r,
            asset: Array.isArray(r.asset) ? r.asset[0] : r.asset,
          }));
          setReservations(mapped);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyReservations();
  }, [user?.id, organization?.id, session?.access_token]);

  const filteredReservations = useMemo(() => {
    const now = new Date();
    return reservations.filter((r) => {
      if (activeFilter === 'upcoming') {
        return new Date(r.end_datetime) >= now && r.status !== 'cancelled' && r.status !== 'rejected';
      } else if (activeFilter === 'past') {
        return new Date(r.end_datetime) < now || r.status === 'cancelled' || r.status === 'rejected';
      }
      return true;
    });
  }, [reservations, activeFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      pending: { es: 'Pendiente', en: 'Pending' },
      approved: { es: 'Aprobada', en: 'Approved' },
      rejected: { es: 'Rechazada', en: 'Rejected' },
      cancelled: { es: 'Cancelada', en: 'Cancelled' },
      completed: { es: 'Completada', en: 'Completed' },
    };
    return labels[status]?.[language] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircle2;
      case 'rejected':
      case 'cancelled':
        return XCircle;
      case 'pending':
        return Clock;
      default:
        return AlertCircle;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            {language === 'es' ? 'Mis Viajes' : 'My Trips'}
          </h1>
          <p className="text-muted mt-1">
            {language === 'es' ? 'Tus reservaciones y viajes programados' : 'Your reservations and scheduled trips'}
          </p>
        </div>
        <Link href="/calendar">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Nueva Reservación' : 'New Booking'}
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded-lg w-fit">
        <button
          onClick={() => setActiveFilter('upcoming')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeFilter === 'upcoming'
              ? 'bg-gold-500 text-navy-950'
              : 'text-muted hover:text-white'
          )}
        >
          {language === 'es' ? 'Próximos' : 'Upcoming'}
        </button>
        <button
          onClick={() => setActiveFilter('past')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeFilter === 'past'
              ? 'bg-gold-500 text-navy-950'
              : 'text-muted hover:text-white'
          )}
        >
          {language === 'es' ? 'Pasados' : 'Past'}
        </button>
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeFilter === 'all'
              ? 'bg-gold-500 text-navy-950'
              : 'text-muted hover:text-white'
          )}
        >
          {language === 'es' ? 'Todos' : 'All'}
        </button>
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gold-500/10 mx-auto flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-gold-500" />
            </div>
            <h3 className="text-lg font-display font-semibold text-white mb-2">
              {activeFilter === 'upcoming'
                ? (language === 'es' ? 'No hay reservaciones pendientes' : 'No pending reservations')
                : activeFilter === 'past'
                ? (language === 'es' ? 'No hay viajes pasados' : 'No past trips')
                : (language === 'es' ? 'No hay reservaciones' : 'No reservations')}
            </h3>
            <p className="text-muted max-w-md mx-auto mb-6">
              {language === 'es'
                ? 'Explora los activos disponibles y agenda tu próximo viaje.'
                : 'Explore available assets and schedule your next trip.'}
            </p>
            <Link href="/calendar">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Nueva Reservación' : 'New Booking'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const SectionIcon = SECTION_ICONS[reservation.asset?.section] || Plane;
            const statusColors = STATUS_COLORS[reservation.status] || STATUS_COLORS.pending;
            const StatusIcon = getStatusIcon(reservation.status);
            const sectionInfo = SECTIONS[reservation.asset?.section as keyof typeof SECTIONS];

            return (
              <Card key={reservation.id} className="card-hover overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Asset Image */}
                    <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0">
                      {reservation.asset?.primary_photo_url ? (
                        <img
                          src={reservation.asset.primary_photo_url}
                          alt={reservation.asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface flex items-center justify-center">
                          <SectionIcon className="w-12 h-12 text-muted" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-navy-950/80 via-transparent to-transparent" />
                      
                      {/* Section Badge */}
                      <div
                        className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${sectionInfo?.color}20`,
                          color: sectionInfo?.color,
                        }}
                      >
                        <SectionIcon className="w-3.5 h-3.5" />
                        {t(`assets.section.${reservation.asset?.section}`)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-display font-semibold text-white text-lg truncate">
                              {reservation.asset?.name || 'Unknown Asset'}
                            </h3>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                                statusColors.bg,
                                statusColors.text,
                                statusColors.border
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {getStatusLabel(reservation.status)}
                            </span>
                          </div>
                          
                          {reservation.title && (
                            <p className="text-gold-500 text-sm mb-2">{reservation.title}</p>
                          )}

                          {/* Date/Time Info */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted mt-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDate(reservation.start_datetime)}
                                {formatDate(reservation.start_datetime) !== formatDate(reservation.end_datetime) && (
                                  <> - {formatDate(reservation.end_datetime)}</>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>
                                {formatTime(reservation.start_datetime)} - {formatTime(reservation.end_datetime)}
                              </span>
                            </div>
                            {reservation.guest_count && (
                              <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span>
                                  {reservation.guest_count} {language === 'es' ? 'invitados' : 'guests'}
                                </span>
                              </div>
                            )}
                          </div>

                          {reservation.notes && (
                            <p className="text-sm text-muted mt-2 line-clamp-2">{reservation.notes}</p>
                          )}
                        </div>

                        {/* View Button */}
                        <Link href={`/assets/${reservation.asset?.id}`}>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {reservations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-display font-bold text-gold-500">
                {reservations.filter(r => r.status === 'approved' && new Date(r.end_datetime) >= new Date()).length}
              </p>
              <p className="text-xs text-muted mt-1">
                {language === 'es' ? 'Confirmados' : 'Confirmed'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-display font-bold text-amber-400">
                {reservations.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-xs text-muted mt-1">
                {language === 'es' ? 'Pendientes' : 'Pending'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-display font-bold text-emerald-400">
                {reservations.filter(r => new Date(r.end_datetime) < new Date() && r.status === 'approved').length}
              </p>
              <p className="text-xs text-muted mt-1">
                {language === 'es' ? 'Completados' : 'Completed'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-display font-bold text-white">
                {reservations.length}
              </p>
              <p className="text-xs text-muted mt-1">
                {language === 'es' ? 'Total' : 'Total'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
