'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, formatDate } from '@/lib/utils';
import {
  Plane,
  X,
  Loader2,
  MapPin,
  Clock,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Airport {
  id: string;
  icao_code: string;
  iata_code: string | null;
  name: string;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

interface PlaneAsset {
  id: string;
  name: string;
  section: string;
  details: {
    homeAirport?: string;
    cruiseSpeed?: string;
    turnaroundMinutes?: number;
    tailNumber?: string;
    manufacturer?: string;
    model?: string;
  };
}

interface FlightLeg {
  type: 'customer' | 'empty';
  departure: Airport;
  arrival: Airport;
  departureTime: Date;
  arrivalTime: Date;
  flightTimeMinutes: number;
  distanceNm: number;
}

interface PlaneBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlaneBookingData) => Promise<void>;
  asset: PlaneAsset;
  airports: Airport[];
  selectedDate?: Date;
  isSubmitting: boolean;
}

export interface PlaneBookingData {
  title: string;
  tripType: 'taken' | 'pickup';
  departureAirport: Airport;
  arrivalAirport: Airport;
  legs: FlightLeg[];
  notes: string;
  startDatetime: string;
  endDatetime: string;
  metadata: {
    tripType: 'taken' | 'pickup';
    legs: {
      type: string;
      departure: string;
      arrival: string;
      departureTime: string;
      arrivalTime: string;
      distanceNm: number;
      flightTimeMinutes: number;
    }[];
    totalDistanceNm: number;
    totalFlightMinutes: number;
  };
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// Calculate flight time in minutes
function calculateFlightTime(distanceNm: number, cruiseSpeedKnots: number): number {
  if (!cruiseSpeedKnots) return 0;
  const hours = distanceNm / cruiseSpeedKnots;
  return Math.round(hours * 60);
}

// Add minutes to a date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// Format time as HH:MM
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Format duration
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function PlaneBookingModal({
  isOpen,
  onClose,
  onSubmit,
  asset,
  airports,
  selectedDate,
  isSubmitting,
}: PlaneBookingModalProps) {
  const TAXI_TIME = 15; // 15 minutes for taxi/takeoff
  
  const [tripType, setTripType] = useState<'taken' | 'pickup'>('taken');
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState(
    selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [departureSearch, setDepartureSearch] = useState('');
  const [arrivalSearch, setArrivalSearch] = useState('');
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false);

  // Get asset details
  const homeAirportCode = asset.details?.homeAirport;
  const cruiseSpeed = parseInt(asset.details?.cruiseSpeed || '450'); // Default 450 knots
  const turnaroundMinutes = asset.details?.turnaroundMinutes || 60; // Default 60 min

  // Find home airport
  const homeAirport = useMemo(() => {
    if (!homeAirportCode) return null;
    return airports.find(a => 
      a.iata_code === homeAirportCode || a.icao_code === homeAirportCode
    ) || null;
  }, [airports, homeAirportCode]);

  // Filter airports for dropdown
  const filterAirports = (search: string) => {
    if (!search) return airports.slice(0, 20);
    const searchLower = search.toLowerCase();
    return airports.filter(a => 
      a.iata_code?.toLowerCase().includes(searchLower) ||
      a.icao_code?.toLowerCase().includes(searchLower) ||
      a.name?.toLowerCase().includes(searchLower) ||
      a.city?.toLowerCase().includes(searchLower)
    ).slice(0, 20);
  };

  // Calculate itinerary
  const itinerary = useMemo((): FlightLeg[] | null => {
    if (!homeAirport || !departureAirport || !arrivalAirport) return null;
    if (!departureAirport.latitude || !arrivalAirport.latitude || !homeAirport.latitude) return null;

    const legs: FlightLeg[] = [];
    const baseDateTime = new Date(`${selectedDateStr}T${selectedTime}:00`);

    if (tripType === 'taken') {
      // TAKEN: User departure → destination, then plane returns home
      const leg1Distance = calculateDistance(
        departureAirport.latitude, departureAirport.longitude!,
        arrivalAirport.latitude, arrivalAirport.longitude!
      );
      const leg1FlightTime = calculateFlightTime(leg1Distance, cruiseSpeed);
      const leg1DepartureTime = addMinutes(baseDateTime, TAXI_TIME);
      const leg1ArrivalTime = addMinutes(leg1DepartureTime, leg1FlightTime);

      legs.push({
        type: 'customer',
        departure: departureAirport,
        arrival: arrivalAirport,
        departureTime: leg1DepartureTime,
        arrivalTime: leg1ArrivalTime,
        flightTimeMinutes: leg1FlightTime,
        distanceNm: leg1Distance,
      });

      // Empty leg: destination → home
      const leg2Distance = calculateDistance(
        arrivalAirport.latitude, arrivalAirport.longitude!,
        homeAirport.latitude, homeAirport.longitude!
      );
      const leg2FlightTime = calculateFlightTime(leg2Distance, cruiseSpeed);
      const leg2DepartureTime = addMinutes(leg1ArrivalTime, turnaroundMinutes);
      const leg2ArrivalTime = addMinutes(leg2DepartureTime, leg2FlightTime);

      if (arrivalAirport.id !== homeAirport.id) {
        legs.push({
          type: 'empty',
          departure: arrivalAirport,
          arrival: homeAirport,
          departureTime: leg2DepartureTime,
          arrivalTime: leg2ArrivalTime,
          flightTimeMinutes: leg2FlightTime,
          distanceNm: leg2Distance,
        });
      }
    } else {
      // PICKUP: Plane goes to pick up user, then brings them to destination
      // First, empty leg from home to pickup location
      const leg1Distance = calculateDistance(
        homeAirport.latitude, homeAirport.longitude!,
        departureAirport.latitude, departureAirport.longitude!
      );
      const leg1FlightTime = calculateFlightTime(leg1Distance, cruiseSpeed);
      
      // Work backwards - user wants to be picked up at baseDateTime
      const leg1ArrivalTime = addMinutes(baseDateTime, -turnaroundMinutes); // Arrive before pickup
      const leg1DepartureTime = addMinutes(leg1ArrivalTime, -leg1FlightTime);

      if (homeAirport.id !== departureAirport.id) {
        legs.push({
          type: 'empty',
          departure: homeAirport,
          arrival: departureAirport,
          departureTime: addMinutes(leg1DepartureTime, -TAXI_TIME),
          arrivalTime: leg1ArrivalTime,
          flightTimeMinutes: leg1FlightTime,
          distanceNm: leg1Distance,
        });
      }

      // Customer leg: pickup → destination
      const leg2Distance = calculateDistance(
        departureAirport.latitude, departureAirport.longitude!,
        arrivalAirport.latitude, arrivalAirport.longitude!
      );
      const leg2FlightTime = calculateFlightTime(leg2Distance, cruiseSpeed);
      const leg2DepartureTime = addMinutes(baseDateTime, TAXI_TIME);
      const leg2ArrivalTime = addMinutes(leg2DepartureTime, leg2FlightTime);

      legs.push({
        type: 'customer',
        departure: departureAirport,
        arrival: arrivalAirport,
        departureTime: leg2DepartureTime,
        arrivalTime: leg2ArrivalTime,
        flightTimeMinutes: leg2FlightTime,
        distanceNm: leg2Distance,
      });
    }

    return legs;
  }, [tripType, departureAirport, arrivalAirport, homeAirport, selectedDateStr, selectedTime, cruiseSpeed, turnaroundMinutes]);

  const handleSubmit = async () => {
    if (!itinerary || !departureAirport || !arrivalAirport || itinerary.length === 0) return;

    const totalDistance = itinerary.reduce((sum, leg) => sum + leg.distanceNm, 0);
    const totalFlightMinutes = itinerary.reduce((sum, leg) => sum + leg.flightTimeMinutes, 0);

    const firstLeg = itinerary[0];
    const lastLeg = itinerary[itinerary.length - 1];

    const data: PlaneBookingData = {
      title: title || `${tripType === 'taken' ? 'Flight' : 'Pickup'}: ${departureAirport.iata_code || departureAirport.icao_code} → ${arrivalAirport.iata_code || arrivalAirport.icao_code}`,
      tripType,
      departureAirport,
      arrivalAirport,
      legs: itinerary,
      notes,
      startDatetime: firstLeg.departureTime.toISOString(),
      endDatetime: lastLeg.arrivalTime.toISOString(),
      metadata: {
        tripType,
        legs: itinerary.map(leg => ({
          type: leg.type,
          departure: leg.departure.iata_code || leg.departure.icao_code,
          arrival: leg.arrival.iata_code || leg.arrival.icao_code,
          departureTime: leg.departureTime.toISOString(),
          arrivalTime: leg.arrivalTime.toISOString(),
          distanceNm: leg.distanceNm,
          flightTimeMinutes: leg.flightTimeMinutes,
        })),
        totalDistanceNm: totalDistance,
        totalFlightMinutes,
      },
    };

    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative max-w-2xl w-full animate-fade-up max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-navy-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Plane className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-display">Book Flight</CardTitle>
              <p className="text-sm text-muted">{asset.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Home Airport Info */}
          {homeAirport && (
            <div className="p-3 rounded-lg bg-surface border border-border">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gold-500" />
                <span className="text-muted">Home Base:</span>
                <span className="text-white font-medium">
                  {homeAirport.iata_code || homeAirport.icao_code} - {homeAirport.name}
                </span>
              </div>
            </div>
          )}

          {!homeAirport && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>No home airport set for this aircraft. Please configure in asset settings.</span>
              </div>
            </div>
          )}

          {/* Trip Type Selection */}
          <div>
            <Label className="mb-3 block">Trip Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTripType('taken')}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all',
                  tripType === 'taken'
                    ? 'border-gold-500 bg-gold-500/10'
                    : 'border-border hover:border-gold-500/50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRight className="w-4 h-4 text-gold-500" />
                  <span className="font-medium text-white">I need to be taken</span>
                </div>
                <p className="text-xs text-muted">
                  Fly from your location to destination
                </p>
              </button>
              <button
                onClick={() => setTripType('pickup')}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all',
                  tripType === 'pickup'
                    ? 'border-gold-500 bg-gold-500/10'
                    : 'border-border hover:border-gold-500/50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDown className="w-4 h-4 text-gold-500" />
                  <span className="font-medium text-white">I need to be picked up</span>
                </div>
                <p className="text-xs text-muted">
                  Plane comes to get you
                </p>
              </button>
            </div>
          </div>

          {/* Airport Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* Departure Airport */}
            <div className="relative">
              <Label>{tripType === 'taken' ? 'Departure Airport' : 'Pickup Location'} *</Label>
              <Input
                placeholder="Search airports..."
                value={departureSearch || (departureAirport ? `${departureAirport.iata_code || departureAirport.icao_code} - ${departureAirport.city}` : '')}
                onChange={(e) => {
                  setDepartureSearch(e.target.value);
                  setDepartureAirport(null);
                  setShowDepartureDropdown(true);
                }}
                onFocus={() => setShowDepartureDropdown(true)}
              />
              {showDepartureDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-navy-900 border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filterAirports(departureSearch).map((airport) => (
                    <button
                      key={airport.id}
                      onClick={() => {
                        setDepartureAirport(airport);
                        setDepartureSearch('');
                        setShowDepartureDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-surface flex items-center gap-2 text-sm"
                    >
                      <span className="font-medium text-gold-500">
                        {airport.iata_code || airport.icao_code}
                      </span>
                      <span className="text-white truncate">{airport.city}</span>
                      <span className="text-muted text-xs truncate">{airport.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Arrival Airport */}
            <div className="relative">
              <Label>Destination Airport *</Label>
              <Input
                placeholder="Search airports..."
                value={arrivalSearch || (arrivalAirport ? `${arrivalAirport.iata_code || arrivalAirport.icao_code} - ${arrivalAirport.city}` : '')}
                onChange={(e) => {
                  setArrivalSearch(e.target.value);
                  setArrivalAirport(null);
                  setShowArrivalDropdown(true);
                }}
                onFocus={() => setShowArrivalDropdown(true)}
              />
              {showArrivalDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-navy-900 border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filterAirports(arrivalSearch).map((airport) => (
                    <button
                      key={airport.id}
                      onClick={() => {
                        setArrivalAirport(airport);
                        setArrivalSearch('');
                        setShowArrivalDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-surface flex items-center gap-2 text-sm"
                    >
                      <span className="font-medium text-gold-500">
                        {airport.iata_code || airport.icao_code}
                      </span>
                      <span className="text-white truncate">{airport.city}</span>
                      <span className="text-muted text-xs truncate">{airport.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{tripType === 'taken' ? 'Departure Date' : 'Pickup Date'} *</Label>
              <Input
                type="date"
                value={selectedDateStr}
                onChange={(e) => setSelectedDateStr(e.target.value)}
              />
            </div>
            <div>
              <Label>{tripType === 'taken' ? 'Departure Time' : 'Pickup Time'} *</Label>
              <Input
                type="time"
                step="900"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
              <p className="text-xs text-muted mt-1">15-minute intervals</p>
            </div>
          </div>

          {/* Itinerary Preview */}
          {itinerary && itinerary.length > 0 && (
            <div className="p-4 rounded-lg bg-surface border border-border space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Flight Itinerary
              </div>
              
              {itinerary.map((leg, index) => (
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
                      {leg.type === 'customer' ? 'Your Flight' : 'Repositioning'}
                    </span>
                    <span className="text-xs text-muted">
                      {leg.distanceNm.toLocaleString()} nm • {formatDuration(leg.flightTimeMinutes)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {leg.departure.iata_code || leg.departure.icao_code}
                      </div>
                      <div className="text-xs text-muted">{formatTime(leg.departureTime)}</div>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 border-t border-dashed border-border" />
                      <Plane className={cn(
                        'w-4 h-4',
                        leg.type === 'customer' ? 'text-sky-400' : 'text-gray-400'
                      )} />
                      <div className="flex-1 border-t border-dashed border-border" />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {leg.arrival.iata_code || leg.arrival.icao_code}
                      </div>
                      <div className="text-xs text-muted">{formatTime(leg.arrivalTime)}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted">Total Trip Duration:</span>
                <span className="text-white font-medium">
                  {itinerary.length > 0 && formatDuration(
                    Math.round((itinerary[itinerary.length - 1].arrivalTime.getTime() - itinerary[0].departureTime.getTime()) / 60000)
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Title and Notes */}
          <div>
            <Label>Trip Title (optional)</Label>
            <Input
              placeholder="e.g., Business meeting in New York"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <textarea
              rows={2}
              placeholder="Any special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white placeholder:text-muted focus:outline-none focus:border-gold-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !departureAirport || !arrivalAirport || !itinerary || !homeAirport}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                'Request Booking'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Click outside to close dropdowns */}
      {(showDepartureDropdown || showArrivalDropdown) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setShowDepartureDropdown(false);
            setShowArrivalDropdown(false);
          }}
        />
      )}
    </div>
  );
}
