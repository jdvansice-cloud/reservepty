'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, SECTIONS, formatDate } from '@/lib/utils';
import { PlaneBookingData } from '@/components/calendar/PlaneBookingModal';
import PlaneBookingModal from '@/components/calendar/PlaneBookingModal';
import { HelicopterBookingData } from '@/components/calendar/HelicopterBookingModal';
import HelicopterBookingModal from '@/components/calendar/HelicopterBookingModal';
import { EditableItinerary } from '@/components/calendar/EditableItinerary';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Plane,
  Ship,
  Home,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  Edit2,
  Navigation,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Navigation,
  residences: Home,
  watercraft: Ship,
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Airport {
  id: string;
  icao_code: string;
  iata_code?: string;
  name: string;
  city?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface Heliport {
  id: string;
  icao_code: string;
  name: string;
  city?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface Asset {
  id: string;
  name: string;
  section: string;
  details: any;
}

interface Reservation {
  id: string;
  asset_id: string;
  user_id: string;
  title: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  notes: string | null;
  guest_count: number | null;
  metadata?: {
    tripType?: string;
    legs?: Array<{
      type: string;
      departure: string;
      arrival: string;
      departureTime: string;
      arrivalTime: string;
      flightTimeMinutes?: number;
      distanceNm?: number;
    }>;
    totalDistanceNm?: number;
    totalFlightMinutes?: number;
    legType?: string;
  };
  asset?: Asset;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const preselectedAsset = searchParams.get('asset');
  const { toast } = useToast();
  const { organization, session, user, profile } = useAuth();
  const { t, language } = useLanguage();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [heliports, setHeliports] = useState<Heliport[]>([]);
  const [showPlaneBookingModal, setShowPlaneBookingModal] = useState(false);
  const [showHelicopterBookingModal, setShowHelicopterBookingModal] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    assetId: preselectedAsset || '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    title: '',
    notes: '',
    guestCount: '',
  });

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conflicts, setConflicts] = useState<Reservation[]>([]);
  const [isEditingItinerary, setIsEditingItinerary] = useState(false);
  const [isSavingItinerary, setIsSavingItinerary] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Fetch assets and reservations
  useEffect(() => {
    const fetchData = async () => {
      if (!organization?.id || !session?.access_token) {
        setIsLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Fetch assets
        const assetsResponse = await fetch(
          `${baseUrl}/rest/v1/assets?organization_id=eq.${organization.id}&is_active=eq.true&select=id,name,section,details`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json();
          setAssets(assetsData);
        }

        // Fetch reservations for current month (expanded range for multi-day bookings)
        const startRange = new Date(year, month - 1, 1).toISOString();
        const endRange = new Date(year, month + 2, 0).toISOString();

        const reservationsResponse = await fetch(
          `${baseUrl}/rest/v1/reservations?organization_id=eq.${organization.id}&start_datetime=gte.${startRange}&start_datetime=lte.${endRange}&select=*,asset:assets(id,name,section),profile:profiles(first_name,last_name,email)&order=start_datetime.asc`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json();
          // Handle Supabase join returning arrays
          const formattedReservations = reservationsData.map((r: any) => ({
            ...r,
            asset: Array.isArray(r.asset) ? r.asset[0] : r.asset,
            profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
          }));
          setReservations(formattedReservations);
        }

        // Fetch airports for plane bookings (includes airports and dual-use)
        const airportsResponse = await fetch(
          `${baseUrl}/rest/v1/airports?type=in.(airport,both)&is_active=eq.true&order=name.asc`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (airportsResponse.ok) {
          const airportsData = await airportsResponse.json();
          setAirports(airportsData);
        }

        // Fetch heliports for helicopter bookings (includes heliports and dual-use)
        const heliportsResponse = await fetch(
          `${baseUrl}/rest/v1/airports?type=in.(helipad,both)&is_active=eq.true&order=name.asc`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (heliportsResponse.ok) {
          const heliportsData = await heliportsResponse.json();
          setHeliports(heliportsData);
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [organization?.id, session?.access_token, year, month]);

  const calendarDays = useMemo(() => {
    const days = [];
    
    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      const day = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    return days;
  }, [year, month, startingDayOfWeek, daysInMonth]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      if (selectedSection && reservation.asset?.section !== selectedSection) return false;
      return true;
    });
  }, [reservations, selectedSection]);

  const getBookingsForDate = (date: Date) => {
    return filteredReservations.filter((reservation) => {
      const bookingStart = new Date(reservation.start_datetime);
      const bookingEnd = new Date(reservation.end_datetime);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      return bookingStart <= dayEnd && bookingEnd >= dayStart;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Check for conflicts when asset or dates change
  useEffect(() => {
    if (!bookingForm.assetId || !bookingForm.startDate) {
      setConflicts([]);
      return;
    }

    const selectedAsset = assets.find(a => a.id === bookingForm.assetId);

    // Build full datetime for comparison
    let startDateTime: Date;
    let endDateTime: Date;

    if (selectedAsset?.section === 'residences') {
      // Residences use check-in/check-out times
      const checkInTime = selectedAsset?.details?.checkInTime || '15:00';
      const checkOutTime = selectedAsset?.details?.checkOutTime || '11:00';
      startDateTime = new Date(`${bookingForm.startDate}T${checkInTime}:00`);
      const endDate = bookingForm.endDate || bookingForm.startDate;
      endDateTime = new Date(`${endDate}T${checkOutTime}:00`);
    } else if (selectedAsset?.section === 'watercraft') {
      // Boats use full day: 00:00 to 23:59
      startDateTime = new Date(`${bookingForm.startDate}T00:00:00`);
      const endDate = bookingForm.endDate || bookingForm.startDate;
      endDateTime = new Date(`${endDate}T23:59:59`);
    } else {
      // Aviation uses start/end times
      startDateTime = new Date(`${bookingForm.startDate}T${bookingForm.startTime || '00:00'}:00`);
      const endDate = bookingForm.endDate || bookingForm.startDate;
      endDateTime = new Date(`${endDate}T${bookingForm.endTime || '23:59'}:00`);
    }
    
    // Find overlapping reservations for the same asset
    // Using strict inequality: allows back-to-back where arrival === next departure
    const overlapping = reservations.filter((r) => {
      if (r.asset_id !== bookingForm.assetId) return false;
      if (r.status === 'rejected' || r.status === 'cancelled') return false;
      
      const rStart = new Date(r.start_datetime);
      const rEnd = new Date(r.end_datetime);
      
      // Strict overlap check: startDateTime < rEnd AND endDateTime > rStart
      // This allows: myDeparture === theirArrival (no overlap)
      return startDateTime < rEnd && endDateTime > rStart;
    });

    setConflicts(overlapping);
  }, [bookingForm.assetId, bookingForm.startDate, bookingForm.endDate, bookingForm.startTime, bookingForm.endTime, reservations, assets]);

  // Helper to create audit log entries
  const createAuditLog = async (
    action: string,
    entityId: string,
    oldValues?: any,
    newValues?: any
  ) => {
    if (!session?.access_token || !organization?.id || !user?.id) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      await fetch(`${baseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey!,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          organization_id: organization.id,
          user_id: user.id,
          action,
          entity_type: 'reservation',
          entity_id: entityId,
          old_values: oldValues || null,
          new_values: newValues || null,
        }),
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  };

  const handleBookingClick = (reservation: Reservation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const handleApproveBooking = async () => {
    if (!selectedReservation || !session?.access_token) return;
    
    setIsProcessing(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/reservations?id=eq.${selectedReservation.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            status: 'approved',
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to approve booking');

      // Create audit log
      await createAuditLog(
        'approve',
        selectedReservation.id,
        { status: selectedReservation.status },
        { status: 'approved', approved_by: user?.id }
      );

      // Update local state
      setReservations(prev => prev.map(r => 
        r.id === selectedReservation.id 
          ? { ...r, status: 'approved', approved_by: user?.id }
          : r
      ));

      toast({ title: language === 'es' ? 'Reserva aprobada' : 'Booking approved', description: language === 'es' ? 'La reserva ha sido aprobada.' : 'The booking has been approved.' });
      setShowDetailModal(false);
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!selectedReservation || !session?.access_token) return;
    
    const reason = prompt(language === 'es' ? 'Razón del rechazo (opcional):' : 'Reason for rejection (optional):');
    
    setIsProcessing(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/reservations?id=eq.${selectedReservation.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            status: 'rejected',
            rejected_reason: reason || null,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to reject booking');

      // Create audit log
      await createAuditLog(
        'reject',
        selectedReservation.id,
        { status: selectedReservation.status },
        { status: 'rejected', rejected_reason: reason || null }
      );

      setReservations(prev => prev.map(r => 
        r.id === selectedReservation.id 
          ? { ...r, status: 'rejected', rejected_reason: reason }
          : r
      ));

      toast({ title: language === 'es' ? 'Reserva rechazada' : 'Booking rejected', description: language === 'es' ? 'La reserva ha sido rechazada.' : 'The booking has been rejected.' });
      setShowDetailModal(false);
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedReservation || !session?.access_token) return;
    
    if (!confirm(language === 'es' ? '¿Estás seguro de que deseas cancelar esta reserva?' : 'Are you sure you want to cancel this booking?')) return;
    
    setIsProcessing(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/reservations?id=eq.${selectedReservation.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to cancel booking');

      // Create audit log
      await createAuditLog(
        'cancel',
        selectedReservation.id,
        { status: selectedReservation.status },
        { status: 'canceled', canceled_at: new Date().toISOString() }
      );

      setReservations(prev => prev.map(r => 
        r.id === selectedReservation.id 
          ? { ...r, status: 'canceled' }
          : r
      ));

      toast({ title: language === 'es' ? 'Reserva cancelada' : 'Booking canceled', description: language === 'es' ? 'La reserva ha sido cancelada.' : 'The booking has been canceled.' });
      setShowDetailModal(false);
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle plane booking submission
  const handlePlaneBookingSubmit = async (data: PlaneBookingData) => {
    if (!organization?.id || !session?.access_token || !user?.id) {
      toast({ title: t('common.error'), description: language === 'es' ? 'Debes iniciar sesión.' : 'You must be logged in.', variant: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const selectedAsset = assets.find(a => a.id === bookingForm.assetId);

      // Create the main reservation with metadata
      const reservationData = {
        organization_id: organization.id,
        asset_id: bookingForm.assetId,
        user_id: user.id,
        title: data.title,
        start_datetime: data.startDatetime,
        end_datetime: data.endDatetime,
        status: 'pending',
        notes: data.notes || null,
        metadata: data.metadata,
      };

      const response = await fetch(
        `${baseUrl}/rest/v1/reservations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(reservationData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const newReservation = await response.json();

      // Create audit log for new reservation
      await createAuditLog(
        'create',
        newReservation[0].id,
        null,
        { 
          title: data.title,
          status: 'pending',
          tripType: data.tripType,
          start_datetime: data.startDatetime,
          end_datetime: data.endDatetime,
        }
      );

      // Add to local state
      const fullReservation = {
        ...newReservation[0],
        asset: selectedAsset,
        profile: profile,
      };
      setReservations(prev => [...prev, fullReservation]);

      toast({
        title: language === 'es' ? 'Reserva de vuelo creada' : 'Flight booking created',
        description: language === 'es' ? 'Tu solicitud de vuelo ha sido enviada para aprobación.' : 'Your flight request has been submitted for approval.',
      });

      setShowPlaneBookingModal(false);
      setBookingForm(prev => ({ ...prev, assetId: '' }));
    } catch (error: any) {
      console.error('Plane booking error:', error);
      toast({
        title: language === 'es' ? 'Reserva fallida' : 'Booking failed',
        description: error.message || (language === 'es' ? 'Ocurrió un error.' : 'An error occurred.'),
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelicopterBookingSubmit = async (data: HelicopterBookingData) => {
    if (!organization?.id || !session?.access_token || !user?.id) {
      toast({ title: t('common.error'), description: language === 'es' ? 'Debes iniciar sesión.' : 'You must be logged in.', variant: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const selectedAsset = assets.find(a => a.id === bookingForm.assetId);

      // Create the main reservation with metadata
      const reservationData = {
        organization_id: organization.id,
        asset_id: bookingForm.assetId,
        user_id: user.id,
        title: data.title,
        start_datetime: data.startDatetime,
        end_datetime: data.endDatetime,
        status: 'pending',
        notes: data.notes || null,
        metadata: data.metadata,
      };

      const response = await fetch(
        `${baseUrl}/rest/v1/reservations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(reservationData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const newReservation = await response.json();

      // Create audit log for new reservation
      await createAuditLog(
        'create',
        newReservation[0].id,
        null,
        { 
          title: data.title,
          status: 'pending',
          tripType: data.tripType,
          start_datetime: data.startDatetime,
          end_datetime: data.endDatetime,
        }
      );

      // Add to local state
      const fullReservation = {
        ...newReservation[0],
        asset: selectedAsset,
        profile: profile,
      };
      setReservations(prev => [...prev, fullReservation]);

      toast({
        title: language === 'es' ? 'Reserva de helicóptero creada' : 'Helicopter booking created',
        description: language === 'es' ? 'Tu solicitud de vuelo ha sido enviada para aprobación.' : 'Your flight request has been submitted for approval.',
      });

      setShowHelicopterBookingModal(false);
      setBookingForm(prev => ({ ...prev, assetId: '' }));
    } catch (error: any) {
      console.error('Helicopter booking error:', error);
      toast({
        title: language === 'es' ? 'Reserva fallida' : 'Booking failed',
        description: error.message || (language === 'es' ? 'Ocurrió un error.' : 'An error occurred.'),
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle saving updated itinerary (admin feature)
  const handleSaveItinerary = async (updatedLegs: any[]) => {
    if (!selectedReservation || !session?.access_token) return;

    setIsSavingItinerary(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Calculate new start and end times from legs
      const firstLeg = updatedLegs[0];
      const lastLeg = updatedLegs[updatedLegs.length - 1];
      
      const totalDistance = updatedLegs.reduce((sum, leg) => sum + (leg.distanceNm || 0), 0);
      const totalFlightMinutes = updatedLegs.reduce((sum, leg) => sum + (leg.flightTimeMinutes || 0), 0);

      // Update metadata
      const newMetadata = {
        ...selectedReservation.metadata,
        legs: updatedLegs.map(leg => ({
          type: leg.type,
          departure: leg.departure,
          arrival: leg.arrival,
          departureTime: leg.departureTime,
          arrivalTime: leg.arrivalTime,
          distanceNm: leg.distanceNm,
          flightTimeMinutes: leg.flightTimeMinutes,
        })),
        totalDistanceNm: totalDistance,
        totalFlightMinutes,
      };

      const response = await fetch(
        `${baseUrl}/rest/v1/reservations?id=eq.${selectedReservation.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            start_datetime: firstLeg.departureTime,
            end_datetime: lastLeg.arrivalTime,
            metadata: newMetadata,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const updated = await response.json();

      // Update local state
      setReservations(prev => prev.map(r =>
        r.id === selectedReservation.id
          ? { 
              ...r, 
              start_datetime: firstLeg.departureTime,
              end_datetime: lastLeg.arrivalTime,
              metadata: newMetadata 
            }
          : r
      ));

      setSelectedReservation(prev => prev ? {
        ...prev,
        start_datetime: firstLeg.departureTime,
        end_datetime: lastLeg.arrivalTime,
        metadata: newMetadata,
      } : null);

      toast({
        title: language === 'es' ? 'Itinerario actualizado' : 'Itinerary updated',
        description: language === 'es' ? 'El itinerario de vuelo ha sido actualizado exitosamente.' : 'The flight itinerary has been updated successfully.',
      });

      setIsEditingItinerary(false);
    } catch (error: any) {
      console.error('Save itinerary error:', error);
      toast({
        title: language === 'es' ? 'Actualización fallida' : 'Update failed',
        description: error.message || (language === 'es' ? 'Error al actualizar itinerario.' : 'Failed to update itinerary.'),
        variant: 'error',
      });
    } finally {
      setIsSavingItinerary(false);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    setBookingForm((prev) => ({
      ...prev,
      startDate: dateStr,
      endDate: dateStr,
    }));
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async () => {
    if (!organization?.id || !session?.access_token || !user?.id) {
      toast({ title: t('common.error'), description: language === 'es' ? 'Debes iniciar sesión.' : 'You must be logged in.', variant: 'error' });
      return;
    }

    if (!bookingForm.assetId || !bookingForm.startDate) {
      toast({ title: t('common.error'), description: language === 'es' ? 'Por favor selecciona un activo y fecha.' : 'Please select an asset and date.', variant: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const selectedAsset = assets.find(a => a.id === bookingForm.assetId);
      const isAviation = selectedAsset && ['planes', 'helicopters'].includes(selectedAsset.section);

      // Build datetime
      let startDatetime: string;
      let endDatetime: string;

      if (isAviation) {
        startDatetime = `${bookingForm.startDate}T${bookingForm.startTime}:00`;
        endDatetime = `${bookingForm.endDate || bookingForm.startDate}T${bookingForm.endTime}:00`;
      } else if (selectedAsset?.section === 'residences') {
        // Residences use check-in/check-out times
        const checkInTime = selectedAsset.details?.checkInTime || '15:00';
        const checkOutTime = selectedAsset.details?.checkOutTime || '11:00';
        startDatetime = `${bookingForm.startDate}T${checkInTime}:00`;
        endDatetime = `${bookingForm.endDate}T${checkOutTime}:00`;
      } else if (selectedAsset?.section === 'watercraft') {
        // Boats use full day: 00:00 to 23:59
        startDatetime = `${bookingForm.startDate}T00:00:00`;
        endDatetime = `${bookingForm.endDate}T23:59:59`;
      } else {
        // Generic fallback
        startDatetime = `${bookingForm.startDate}T00:00:00`;
        endDatetime = `${bookingForm.endDate || bookingForm.startDate}T23:59:59`;
      }

      const reservationData = {
        organization_id: organization.id,
        asset_id: bookingForm.assetId,
        user_id: user.id,
        title: bookingForm.title || `Booking by ${profile?.first_name || user.email}`,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        status: 'pending', // All bookings start as pending
        notes: bookingForm.notes || null,
        guest_count: bookingForm.guestCount ? parseInt(bookingForm.guestCount) : null,
      };

      const response = await fetch(
        `${baseUrl}/rest/v1/reservations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(reservationData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const newReservation = await response.json();

      // Create audit log for new reservation
      await createAuditLog(
        'create',
        newReservation[0].id,
        null,
        { 
          title: reservationData.title,
          status: 'pending',
          start_datetime: startDatetime,
          end_datetime: endDatetime,
          guest_count: reservationData.guest_count,
        }
      );

      // Add the new reservation to state with asset info
      const fullReservation = {
        ...newReservation[0],
        asset: selectedAsset,
        profile: profile,
      };
      setReservations(prev => [...prev, fullReservation]);

      toast({
        title: language === 'es' ? 'Reserva creada' : 'Booking created',
        description: language === 'es' ? 'Tu solicitud de reserva ha sido enviada para aprobación.' : 'Your booking request has been submitted for approval.',
      });

      setShowBookingModal(false);
      setBookingForm({
        assetId: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        title: '',
        notes: '',
        guestCount: '',
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: language === 'es' ? 'Reserva fallida' : 'Booking failed',
        description: error.message || (language === 'es' ? 'Ocurrió un error.' : 'An error occurred.'),
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAsset = assets.find((a) => a.id === bookingForm.assetId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle2 };
      case 'pending':
        return { color: 'text-amber-400 bg-amber-400/10', icon: AlertCircle };
      case 'rejected':
        return { color: 'text-red-400 bg-red-400/10', icon: X };
      case 'cancelled':
        return { color: 'text-gray-400 bg-gray-400/10', icon: X };
      default:
        return { color: 'text-muted bg-muted/10', icon: AlertCircle };
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{t('calendar.title')}</h1>
          <p className="text-muted mt-1">{t('calendar.subtitle')}</p>
        </div>
        <Button onClick={() => setShowBookingModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('calendar.newBooking')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedSection(null)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            selectedSection === null
              ? 'bg-gold-500 text-navy-950'
              : 'bg-surface text-muted hover:text-white'
          )}
        >
          {language === 'es' ? 'Todos los Activos' : 'All Assets'}
        </button>
        {Object.entries(SECTIONS).map(([key, section]) => {
          const Icon = SECTION_ICONS[key];
          const hasAssets = assets.some(a => a.section === key);
          if (!hasAssets) return null;
          return (
            <button
              key={key}
              onClick={() => setSelectedSection(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedSection === key
                  ? 'text-navy-950'
                  : 'bg-surface text-muted hover:text-white'
              )}
              style={selectedSection === key ? { backgroundColor: section.color } : undefined}
            >
              <Icon className="w-4 h-4" />
              {t(`assets.section.${key}`)}
            </button>
          );
        })}
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-display font-semibold text-white min-w-[200px] text-center">
              {MONTHS[month]} {year}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={handleToday}>
            Today
          </Button>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const bookings = getBookingsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    'min-h-[100px] p-2 rounded-lg text-left transition-all',
                    isCurrentMonth
                      ? 'bg-surface hover:bg-navy-800'
                      : 'bg-navy-950/50 hover:bg-navy-900',
                    isToday && 'ring-2 ring-gold-500'
                  )}
                >
                  <div
                    className={cn(
                      'text-sm font-medium mb-1',
                      isCurrentMonth ? 'text-white' : 'text-muted'
                    )}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {bookings.slice(0, 3).map((booking) => {
                      const sectionInfo = SECTIONS[booking.asset?.section as keyof typeof SECTIONS];
                      const hasFlightLegs = booking.metadata?.legs && booking.metadata.legs.length > 0;
                      const tripType = booking.metadata?.tripType;
                      
                      return (
                        <div
                          key={booking.id}
                          onClick={(e) => handleBookingClick(booking, e)}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity',
                            booking.status === 'pending' && 'opacity-60',
                            booking.status === 'cancelled' && 'line-through opacity-40',
                            booking.status === 'rejected' && 'line-through opacity-40'
                          )}
                          style={{
                            backgroundColor: `${sectionInfo?.color}20`,
                            color: sectionInfo?.color,
                          }}
                          title={`${booking.asset?.name} - ${booking.status}${hasFlightLegs ? ` (${tripType === 'taken' ? 'Outbound' : 'Return'})` : ''}`}
                        >
                          {hasFlightLegs ? (
                            <span className="flex items-center gap-1">
                              <span>{booking.metadata?.legs?.[0]?.departure}</span>
                              <span>→</span>
                              <span>{booking.metadata?.legs?.[0]?.arrival}</span>
                            </span>
                          ) : (
                            booking.asset?.name
                          )}
                        </div>
                      );
                    })}
                    {bookings.length > 3 && (
                      <div className="text-xs text-muted">+{bookings.length - 3} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredReservations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarIcon className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted">No bookings yet</p>
              <Button className="mt-4" onClick={() => setShowBookingModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Booking
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredReservations
                .filter((r) => new Date(r.start_datetime) >= new Date() && r.status !== 'cancelled' && r.status !== 'rejected')
                .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
                .slice(0, 10)
                .map((reservation) => {
                  const Icon = SECTION_ICONS[reservation.asset?.section || 'planes'];
                  const sectionInfo = SECTIONS[reservation.asset?.section as keyof typeof SECTIONS];
                  const statusBadge = getStatusBadge(reservation.status);
                  const StatusIcon = statusBadge.icon;
                  
                  return (
                    <div 
                      key={reservation.id} 
                      className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-surface/50 transition-colors"
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setShowDetailModal(true);
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${sectionInfo?.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: sectionInfo?.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {reservation.asset?.name || 'Unknown Asset'}
                        </p>
                        <p className="text-xs text-muted">
                          {reservation.profile?.first_name || reservation.profile?.email || 'Unknown'} • {formatDate(new Date(reservation.start_datetime))}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0',
                          statusBadge.color
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {reservation.status}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBookingModal(false)}
          />
          <Card className="relative w-full sm:max-w-lg animate-slide-up sm:animate-fade-up max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-navy-900 z-10 border-b border-border">
              <CardTitle className="text-lg sm:text-xl font-display">{t('calendar.newBooking')}</CardTitle>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              {assets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted mb-4">{language === 'es' ? 'No hay activos disponibles. Agrega un activo primero.' : 'No assets available. Add an asset first.'}</p>
                  <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
                    {language === 'es' ? 'Cerrar' : 'Close'}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Asset Selection */}
                  <div>
                    <Label className="text-sm">{language === 'es' ? 'Seleccionar Activo *' : 'Select Asset *'}</Label>
                    <select
                      value={bookingForm.assetId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const asset = assets.find(a => a.id === selectedId);
                        
                        // If plane is selected, switch to plane booking modal
                        if (asset?.section === 'planes') {
                          setBookingForm((prev) => ({ ...prev, assetId: selectedId }));
                          setShowBookingModal(false);
                          setShowPlaneBookingModal(true);
                        } else if (asset?.section === 'helicopters') {
                          // If helicopter is selected, switch to helicopter booking modal
                          setBookingForm((prev) => ({ ...prev, assetId: selectedId }));
                          setShowBookingModal(false);
                          setShowHelicopterBookingModal(true);
                        } else {
                          setBookingForm((prev) => ({ ...prev, assetId: selectedId }));
                        }
                      }}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-gold-500 text-sm sm:text-base"
                    >
                      <option value="">{language === 'es' ? 'Seleccionar un activo...' : 'Choose an asset...'}</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({t(`assets.section.${asset.section}`)})
                          {asset.section === 'planes' && ' ✈️'}
                          {asset.section === 'helicopters' && ' 🚁'}
                        </option>
                      ))}
                    </select>
                    {assets.some(a => ['planes', 'helicopters'].includes(a.section)) && (
                      <p className="text-xs text-muted mt-1">
                        {language === 'es' ? '✈️🚁 Las aeronaves tienen un flujo de reserva mejorado con planificación de itinerario' : '✈️🚁 Aircraft have an enhanced booking flow with itinerary planning'}
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <Label className="text-sm">{language === 'es' ? 'Título de la Reserva' : 'Booking Title'}</Label>
                    <Input
                      placeholder={language === 'es' ? 'Ej: Vacaciones familiares, Viaje de negocios' : 'e.g., Family vacation, Business trip'}
                      value={bookingForm.title}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="text-sm sm:text-base"
                    />
                  </div>

                  {/* Date Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm">
                        {selectedAsset?.section === 'residences' 
                          ? (language === 'es' ? 'Fecha de Llegada *' : 'Arrival Date *')
                          : selectedAsset?.section === 'watercraft'
                          ? (language === 'es' ? 'Fecha de Salida *' : 'Departure Date *')
                          : (language === 'es' ? 'Fecha de Inicio *' : 'Start Date *')}
                      </Label>
                      <Input
                        type="date"
                        value={bookingForm.startDate}
                        onChange={(e) =>
                          setBookingForm((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className="text-sm sm:text-base"
                      />
                      {selectedAsset && selectedAsset.section === 'residences' && (
                        <p className="text-xs text-muted mt-1">
                          {language === 'es' ? 'Check-in:' : 'Check-in:'} {selectedAsset.details?.checkInTime || '15:00'}
                        </p>
                      )}
                      {selectedAsset && selectedAsset.section === 'watercraft' && (
                        <p className="text-xs text-muted mt-1">
                          {language === 'es' ? 'Desde las 12:00 AM' : 'From 12:00 AM'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm">
                        {selectedAsset?.section === 'residences' 
                          ? (language === 'es' ? 'Fecha de Salida *' : 'Departure Date *')
                          : selectedAsset?.section === 'watercraft'
                          ? (language === 'es' ? 'Fecha de Regreso *' : 'Return Date *')
                          : (language === 'es' ? 'Fecha de Fin' : 'End Date')}
                      </Label>
                      <Input
                        type="date"
                        value={bookingForm.endDate}
                        min={bookingForm.startDate}
                        onChange={(e) =>
                          setBookingForm((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className="text-sm sm:text-base"
                      />
                      {selectedAsset && selectedAsset.section === 'residences' && (
                        <p className="text-xs text-muted mt-1">
                          Check-out: {selectedAsset.details?.checkOutTime || '11:00'}
                        </p>
                      )}
                      {selectedAsset && selectedAsset.section === 'watercraft' && (
                        <p className="text-xs text-muted mt-1">
                          {language === 'es' ? 'Hasta las 11:59 PM' : 'Until 11:59 PM'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conflict Warning */}
                  {conflicts.length > 0 && (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-400">{language === 'es' ? 'Conflicto de Horario' : 'Scheduling Conflict'}</p>
                          <p className="text-xs text-amber-400/80 mt-1">
                            {language === 'es' 
                              ? `Este activo tiene ${conflicts.length} reserva${conflicts.length > 1 ? 's' : ''} existente${conflicts.length > 1 ? 's' : ''} durante este tiempo:`
                              : `This asset has ${conflicts.length} existing booking${conflicts.length > 1 ? 's' : ''} during this time:`}
                          </p>
                          <ul className="mt-2 space-y-1">
                            {conflicts.map((c) => (
                              <li key={c.id} className="text-xs text-amber-400/70">
                                • {formatDate(new Date(c.start_datetime))} - {t(`bookings.status.${c.status}`)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Time Selection (for aviation) */}
                  {selectedAsset && ['planes', 'helicopters'].includes(selectedAsset.section) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{language === 'es' ? 'Hora de Salida' : 'Departure Time'}</Label>
                        <Input
                          type="time"
                          step="900"
                          value={bookingForm.startTime}
                          onChange={(e) =>
                            setBookingForm((prev) => ({ ...prev, startTime: e.target.value }))
                          }
                        />
                        <p className="text-xs text-muted mt-1">{language === 'es' ? 'Intervalos de 15 minutos' : '15-minute intervals'}</p>
                      </div>
                      <div>
                        <Label>{language === 'es' ? 'Hora de Llegada (est.)' : 'Arrival Time (est.)'}</Label>
                        <Input
                          type="time"
                          step="900"
                          value={bookingForm.endTime}
                          onChange={(e) =>
                            setBookingForm((prev) => ({ ...prev, endTime: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Guest Count (for residences/watercraft) */}
                  {selectedAsset && ['residences', 'watercraft'].includes(selectedAsset.section) && (
                    <div>
                      <Label>{language === 'es' ? 'Número de Invitados' : 'Number of Guests'}</Label>
                      <Input
                        type="number"
                        placeholder={language === 'es' ? 'Ej: 4' : 'e.g., 4'}
                        value={bookingForm.guestCount}
                        onChange={(e) =>
                          setBookingForm((prev) => ({ ...prev, guestCount: e.target.value }))
                        }
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label>{language === 'es' ? 'Notas (opcional)' : 'Notes (optional)'}</Label>
                    <textarea
                      rows={3}
                      placeholder={language === 'es' ? 'Agregar solicitudes especiales o notas...' : 'Add any special requests or notes...'}
                      value={bookingForm.notes}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white placeholder:text-muted focus:outline-none focus:border-gold-500 resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowBookingModal(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSubmitBooking}
                      disabled={
                        !bookingForm.assetId || 
                        !bookingForm.startDate || 
                        isSubmitting ||
                        conflicts.length > 0 ||
                        (selectedAsset && ['residences', 'watercraft'].includes(selectedAsset.section) && !bookingForm.endDate)
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {language === 'es' ? 'Creando...' : 'Creating...'}
                        </>
                      ) : conflicts.length > 0 ? (
                        language === 'es' ? 'No se puede Reservar - Conflicto' : 'Cannot Book - Conflict'
                      ) : (
                        language === 'es' ? 'Crear Reserva' : 'Create Booking'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDetailModal(false);
              setIsEditingItinerary(false);
            }}
          />
          <Card className="relative max-w-lg w-full animate-fade-up max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = SECTION_ICONS[selectedReservation.asset?.section || 'planes'];
                  const sectionInfo = SECTIONS[selectedReservation.asset?.section as keyof typeof SECTIONS];
                  return (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${sectionInfo?.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: sectionInfo?.color }} />
                    </div>
                  );
                })()}
                <div>
                  <CardTitle className="text-lg font-display">
                    {selectedReservation.title || selectedReservation.asset?.name}
                  </CardTitle>
                  <p className="text-sm text-muted">{selectedReservation.asset?.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setIsEditingItinerary(false);
                }}
                className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{t('common.status')}</span>
                {(() => {
                  const statusBadge = getStatusBadge(selectedReservation.status);
                  const StatusIcon = statusBadge.icon;
                  return (
                    <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize', statusBadge.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {t(`bookings.status.${selectedReservation.status}`)}
                    </div>
                  );
                })()}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted block mb-1">{language === 'es' ? 'Inicio' : 'Start'}</span>
                  <p className="text-sm text-white">
                    {new Date(selectedReservation.start_datetime).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(selectedReservation.start_datetime).toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted block mb-1">{language === 'es' ? 'Fin' : 'End'}</span>
                  <p className="text-sm text-white">
                    {new Date(selectedReservation.end_datetime).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(selectedReservation.end_datetime).toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Flight Itinerary (for planes) */}
              {selectedReservation.metadata?.legs && selectedReservation.metadata.legs.length > 0 && (
                <div className="p-4 rounded-lg bg-surface border border-border space-y-3">
                  {isEditingItinerary ? (
                    /* Editable Itinerary Mode */
                    <EditableItinerary
                      legs={selectedReservation.metadata.legs}
                      airports={airports}
                      cruiseSpeed={parseInt(assets.find(a => a.id === selectedReservation.asset_id)?.details?.cruiseSpeed || '450')}
                      onSave={handleSaveItinerary}
                      onCancel={() => setIsEditingItinerary(false)}
                      isSaving={isSavingItinerary}
                    />
                  ) : (
                    /* Read-only Itinerary Display */
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white flex items-center gap-2">
                          <Plane className="w-4 h-4 text-sky-400" />
                          {language === 'es' ? 'Itinerario de Vuelo' : 'Flight Itinerary'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted capitalize">
                            {selectedReservation.metadata.tripType === 'taken' 
                              ? (language === 'es' ? 'Vuelo de Salida' : 'Outbound Flight')
                              : (language === 'es' ? 'Vuelo de Recogida' : 'Pickup Flight')}
                          </span>
                          {/* Edit button for admins - show for pending/approved bookings */}
                          {(selectedReservation.status === 'pending' || selectedReservation.status === 'approved') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingItinerary(true)}
                              className="h-7 px-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              {t('common.edit')}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {selectedReservation.metadata.legs.map((leg, index) => (
                        <div 
                          key={index}
                          className={cn(
                            'p-3 rounded-lg border',
                            leg.type === 'customer' 
                              ? 'bg-sky-500/10 border-sky-500/30' 
                              : 'bg-gray-500/10 border-gray-500/30 opacity-60'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              leg.type === 'customer' 
                                ? 'bg-sky-500/20 text-sky-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            )}>
                              {leg.type === 'customer' 
                                ? (language === 'es' ? 'Tu Vuelo' : 'Your Flight')
                                : (language === 'es' ? 'Vuelo Vacío (Reposición)' : 'Empty Leg (Repositioning)')}
                            </span>
                            {leg.distanceNm && (
                              <span className="text-xs text-muted">
                                {leg.distanceNm.toLocaleString()} nm
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="text-base font-bold text-white">{leg.departure}</div>
                              <div className="text-xs text-muted">
                                {new Date(leg.departureTime).toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 border-t border-dashed border-border" />
                              <Plane className={cn('w-3 h-3', leg.type === 'customer' ? 'text-sky-400' : 'text-gray-400')} />
                              <div className="flex-1 border-t border-dashed border-border" />
                            </div>
                            <div className="text-center">
                              <div className="text-base font-bold text-white">{leg.arrival}</div>
                              <div className="text-xs text-muted">
                                {new Date(leg.arrivalTime).toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Total Trip Summary */}
                      {selectedReservation.metadata.totalDistanceNm && (
                        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted">
                          <span>Total Trip</span>
                          <span>
                            {selectedReservation.metadata.totalDistanceNm.toLocaleString()} nm • 
                            {selectedReservation.metadata.legs.length} leg{selectedReservation.metadata.legs.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Booked By */}
              <div>
                <span className="text-xs text-muted block mb-1">{language === 'es' ? 'Reservado por' : 'Booked By'}</span>
                <p className="text-sm text-white">
                  {selectedReservation.profile?.first_name 
                    ? `${selectedReservation.profile.first_name} ${selectedReservation.profile.last_name || ''}`
                    : selectedReservation.profile?.email || (language === 'es' ? 'Desconocido' : 'Unknown')}
                </p>
              </div>

              {/* Guest Count */}
              {selectedReservation.guest_count && (
                <div>
                  <span className="text-xs text-muted block mb-1">{language === 'es' ? 'Invitados' : 'Guests'}</span>
                  <p className="text-sm text-white">{selectedReservation.guest_count} {language === 'es' ? 'invitados' : 'guests'}</p>
                </div>
              )}

              {/* Notes */}
              {selectedReservation.notes && (
                <div>
                  <span className="text-xs text-muted block mb-1">{language === 'es' ? 'Notas' : 'Notes'}</span>
                  <p className="text-sm text-white bg-surface p-3 rounded-lg">{selectedReservation.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                {selectedReservation.status === 'pending' && (
                  <>
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={handleApproveBooking}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      {t('approvals.approve')}
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 hover:bg-red-500/20 hover:text-red-400"
                      onClick={handleRejectBooking}
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('approvals.reject')}
                    </Button>
                  </>
                )}
                {(selectedReservation.status === 'approved' || selectedReservation.status === 'pending') && 
                 selectedReservation.user_id === user?.id && (
                  <Button
                    variant="secondary"
                    className="flex-1 hover:bg-red-500/20 hover:text-red-400"
                    onClick={handleCancelBooking}
                    disabled={isProcessing}
                  >
                    {language === 'es' ? 'Cancelar Reserva' : 'Cancel Booking'}
                  </Button>
                )}
                {(selectedReservation.status === 'cancelled' || selectedReservation.status === 'rejected') && (
                  <p className="text-sm text-muted text-center w-full py-2">
                    {language === 'es' 
                      ? `Esta reserva ha sido ${t(`bookings.status.${selectedReservation.status}`)}.`
                      : `This booking has been ${selectedReservation.status}.`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plane Booking Modal */}
      {bookingForm.assetId && assets.find(a => a.id === bookingForm.assetId)?.section === 'planes' && (
        <PlaneBookingModal
          isOpen={showPlaneBookingModal}
          onClose={() => {
            setShowPlaneBookingModal(false);
            setBookingForm(prev => ({ ...prev, assetId: '' }));
          }}
          onSubmit={handlePlaneBookingSubmit}
          asset={assets.find(a => a.id === bookingForm.assetId)!}
          airports={airports}
          selectedDate={selectedDate || undefined}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Helicopter Booking Modal */}
      {bookingForm.assetId && assets.find(a => a.id === bookingForm.assetId)?.section === 'helicopters' && (
        <HelicopterBookingModal
          isOpen={showHelicopterBookingModal}
          onClose={() => {
            setShowHelicopterBookingModal(false);
            setBookingForm(prev => ({ ...prev, assetId: '' }));
          }}
          onSubmit={handleHelicopterBookingSubmit}
          asset={assets.find(a => a.id === bookingForm.assetId)!}
          heliports={heliports}
          selectedDate={selectedDate || undefined}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
