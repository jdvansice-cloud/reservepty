'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, SECTIONS, formatDate, isDevMode } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Plane,
  Ship,
  Home,
  X,
  Clock,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  boats: Ship,
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Mock bookings
const mockBookings = [
  {
    id: '1',
    assetId: '1',
    assetName: 'Gulfstream G650',
    section: 'planes',
    userName: 'John Smith',
    startDate: new Date(2025, 0, 5, 10, 0),
    endDate: new Date(2025, 0, 5, 16, 0),
    status: 'approved',
    route: 'KMIA → KJFK',
  },
  {
    id: '2',
    assetId: '3',
    assetName: 'Miami Beach Villa',
    section: 'residences',
    userName: 'Sarah Johnson',
    startDate: new Date(2025, 0, 10),
    endDate: new Date(2025, 0, 15),
    status: 'approved',
  },
  {
    id: '3',
    assetId: '4',
    assetName: 'Azimut 72',
    section: 'boats',
    userName: 'Michael Chen',
    startDate: new Date(2025, 0, 18),
    endDate: new Date(2025, 0, 20),
    status: 'pending',
  },
  {
    id: '4',
    assetId: '2',
    assetName: 'Bell 429',
    section: 'helicopters',
    userName: 'Emma Williams',
    startDate: new Date(2025, 0, 22, 14, 0),
    endDate: new Date(2025, 0, 22, 18, 0),
    status: 'approved',
  },
];

const mockAssets = [
  { id: '1', name: 'Gulfstream G650', section: 'planes' },
  { id: '2', name: 'Bell 429', section: 'helicopters' },
  { id: '3', name: 'Miami Beach Villa', section: 'residences' },
  { id: '4', name: 'Azimut 72', section: 'boats' },
];

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const preselectedAsset = searchParams.get('asset');
  
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1)); // Jan 2025 for demo
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    assetId: preselectedAsset || '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

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

  const filteredBookings = useMemo(() => {
    return mockBookings.filter((booking) => {
      if (selectedSection && booking.section !== selectedSection) return false;
      return true;
    });
  }, [selectedSection]);

  const getBookingsForDate = (date: Date) => {
    return filteredBookings.filter((booking) => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
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

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setBookingForm((prev) => ({
      ...prev,
      startDate: date.toISOString().split('T')[0],
      endDate: date.toISOString().split('T')[0],
    }));
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowBookingModal(false);
    setBookingForm({
      assetId: '',
      startDate: '',
      endDate: '',
      startTime: '09:00',
      endTime: '17:00',
      notes: '',
    });
  };

  const selectedAsset = mockAssets.find((a) => a.id === bookingForm.assetId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Calendar</h1>
          <p className="text-muted mt-1">View and manage bookings across all assets</p>
        </div>
        <div className="flex items-center gap-3">
          {isDevMode() && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Demo</span>
            </div>
          )}
          <Button onClick={() => setShowBookingModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
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
          All Assets
        </button>
        {Object.entries(SECTIONS).map(([key, section]) => {
          const Icon = SECTION_ICONS[key];
          return (
            <button
              key={key}
              onClick={() => setSelectedSection(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedSection === key
                  ? 'bg-gold-500 text-navy-950'
                  : 'bg-surface text-muted hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg bg-surface hover:bg-navy-800 text-muted hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-display font-semibold text-white min-w-[200px] text-center">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg bg-surface hover:bg-navy-800 text-muted hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
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
                      const sectionInfo = SECTIONS[booking.section as keyof typeof SECTIONS];
                      return (
                        <div
                          key={booking.id}
                          className="text-xs px-1.5 py-0.5 rounded truncate"
                          style={{
                            backgroundColor: `${sectionInfo?.color}20`,
                            color: sectionInfo?.color,
                          }}
                        >
                          {booking.assetName}
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
          <div className="divide-y divide-border">
            {filteredBookings
              .filter((b) => new Date(b.startDate) >= new Date())
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 5)
              .map((booking) => {
                const Icon = SECTION_ICONS[booking.section];
                const sectionInfo = SECTIONS[booking.section as keyof typeof SECTIONS];
                return (
                  <div key={booking.id} className="px-6 py-4 flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${sectionInfo?.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: sectionInfo?.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{booking.assetName}</p>
                      <p className="text-xs text-muted">
                        {booking.userName} • {formatDate(booking.startDate)}
                        {booking.route && ` • ${booking.route}`}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                        booking.status === 'approved'
                          ? 'text-emerald-400 bg-emerald-400/10'
                          : 'text-amber-400 bg-amber-400/10'
                      )}
                    >
                      {booking.status === 'approved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {booking.status}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBookingModal(false)}
          />
          <Card className="relative max-w-lg w-full animate-fade-up max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">New Booking</CardTitle>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Asset Selection */}
              <div>
                <Label>Select Asset</Label>
                <select
                  value={bookingForm.assetId}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, assetId: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="">Choose an asset...</option>
                  {mockAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({SECTIONS[asset.section as keyof typeof SECTIONS]?.label})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={bookingForm.startDate}
                    onChange={(e) =>
                      setBookingForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={bookingForm.endDate}
                    onChange={(e) =>
                      setBookingForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Time Selection (for aviation) */}
              {selectedAsset && ['planes', 'helicopters'].includes(selectedAsset.section) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Departure Time</Label>
                    <Input
                      type="time"
                      value={bookingForm.startTime}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Arrival Time (est.)</Label>
                    <Input
                      type="time"
                      value={bookingForm.endTime}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, endTime: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>Notes (optional)</Label>
                <textarea
                  rows={3}
                  placeholder="Add any special requests or notes..."
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
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitBooking}
                  disabled={!bookingForm.assetId || !bookingForm.startDate || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Booking'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
