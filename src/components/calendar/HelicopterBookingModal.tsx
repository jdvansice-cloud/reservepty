'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Navigation,
  X,
  MapPin,
  Clock,
  ArrowRight,
  Home,
  Search,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  AlertTriangle,
  Users,
  User,
  Scale,
} from 'lucide-react';

interface Heliport {
  id: string;
  icao_code: string;
  name: string;
  city?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface HelicopterAsset {
  id: string;
  name: string;
  section: string;
  details?: {
    registration?: string;
    model?: string;
    cruiseSpeed?: string;
    maxRange?: string;
    maxPassengers?: string;
    homeHeliport?: string;
    turnaroundMinutes?: number;
  };
}

interface FlightLeg {
  type: string;
  departure: Heliport;
  arrival: Heliport;
  departureTime: Date;
  arrivalTime: Date;
  flightTimeMinutes: number;
  distanceNm: number;
}

interface Passenger {
  id: string;
  fullName: string;
  idNumber: string;
  idType: 'cedula' | 'passport';
  weightKg: number;
}

interface HelicopterBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HelicopterBookingData) => Promise<void>;
  asset: HelicopterAsset;
  heliports: Heliport[];
  selectedDate?: Date;
  isSubmitting: boolean;
}

export interface HelicopterBookingData {
  title: string;
  tripType: 'taken' | 'pickup' | 'multileg';
  departureHeliport: Heliport;
  arrivalHeliport: Heliport;
  legs: FlightLeg[];
  notes: string;
  startDatetime: string;
  endDatetime: string;
  passengers: Passenger[];
  metadata: {
    tripType: 'taken' | 'pickup' | 'multileg';
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
    passengers: {
      fullName: string;
      idType: 'cedula' | 'passport';
      idNumber: string;
      weightKg: number;
    }[];
    totalPassengerWeightKg: number;
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

// Calculate flight time based on distance and speed
function calculateFlightTime(distanceNm: number, speedKnots: number): number {
  return Math.round((distanceNm / speedKnots) * 60);
}

// Add minutes to a date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// Format duration
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

// Taxi time constant
const TAXI_TIME = 15; // minutes

export default function HelicopterBookingModal({
  isOpen,
  onClose,
  onSubmit,
  asset,
  heliports,
  selectedDate,
  isSubmitting,
}: HelicopterBookingModalProps) {
  
  const [tripType, setTripType] = useState<'taken' | 'pickup' | 'multileg'>('taken');
  const [departureHeliport, setDepartureHeliport] = useState<Heliport | null>(null);
  const [arrivalHeliport, setArrivalHeliport] = useState<Heliport | null>(null);
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

  // Passenger manifest state (required for Aeronáutica Civil de Panamá)
  const [passengers, setPassengers] = useState<Passenger[]>([
    { id: crypto.randomUUID(), fullName: '', idNumber: '', idType: 'cedula', weightKg: 0 }
  ]);

  // Editable itinerary state
  const [editableLegs, setEditableLegs] = useState<FlightLeg[]>([]);
  const [isEditingItinerary, setIsEditingItinerary] = useState(false);
  const [editingLegHeliport, setEditingLegHeliport] = useState<{legIndex: number, field: 'departure' | 'arrival'} | null>(null);
  const [legHeliportSearch, setLegHeliportSearch] = useState('');

  // Multi-leg mode state
  interface MultiLegInput {
    departureHeliport: Heliport | null;
    arrivalHeliport: Heliport | null;
    departureDate: string;
    departureTime: string;
  }
  const [multiLegs, setMultiLegs] = useState<MultiLegInput[]>([
    { departureHeliport: null, arrivalHeliport: null, departureDate: '', departureTime: '09:00' }
  ]);
  const [editingMultiLegHeliport, setEditingMultiLegHeliport] = useState<{legIndex: number, field: 'departure' | 'arrival'} | null>(null);
  const [multiLegHeliportSearch, setMultiLegHeliportSearch] = useState('');

  // Get asset details
  const homeHeliportCode = asset.details?.homeHeliport;
  const cruiseSpeed = parseInt(asset.details?.cruiseSpeed || '450');
  const turnaroundMinutes = asset.details?.turnaroundMinutes || 60;

  // Find home heliport
  const homeHeliport = useMemo(() => {
    if (!homeHeliportCode) return null;
    return heliports.find(a => 
      a.icao_code === homeHeliportCode
    ) || null;
  }, [heliports, homeHeliportCode]);

  // Filter heliports for dropdown
  const filterHeliports = (search: string) => {
    if (!search) return heliports.slice(0, 20);
    const searchLower = search.toLowerCase();
    return heliports.filter(a => 
      a.icao_code?.toLowerCase().includes(searchLower) ||
      a.name?.toLowerCase().includes(searchLower) ||
      a.city?.toLowerCase().includes(searchLower)
    ).slice(0, 20);
  };

  // Calculate initial itinerary based on inputs
  const calculateInitialItinerary = (): FlightLeg[] => {
    if (!homeHeliport || !departureHeliport || !arrivalHeliport) return [];
    if (!departureHeliport.latitude || !arrivalHeliport.latitude || !homeHeliport.latitude) return [];

    const legs: FlightLeg[] = [];
    const baseDateTime = new Date(`${selectedDateStr}T${selectedTime}:00`);

    if (tripType === 'taken') {
      // TAKEN: User departure → destination, then plane returns home
      const leg1Distance = calculateDistance(
        departureHeliport.latitude, departureHeliport.longitude!,
        arrivalHeliport.latitude, arrivalHeliport.longitude!
      );
      const leg1FlightTime = calculateFlightTime(leg1Distance, cruiseSpeed);
      const leg1DepartureTime = addMinutes(baseDateTime, TAXI_TIME);
      const leg1ArrivalTime = addMinutes(leg1DepartureTime, leg1FlightTime);

      legs.push({
        type: 'customer',
        departure: departureHeliport,
        arrival: arrivalHeliport,
        departureTime: leg1DepartureTime,
        arrivalTime: leg1ArrivalTime,
        flightTimeMinutes: leg1FlightTime,
        distanceNm: leg1Distance,
      });

      // Empty leg: destination → home (if needed)
      if (arrivalHeliport.id !== homeHeliport.id) {
        const leg2Distance = calculateDistance(
          arrivalHeliport.latitude, arrivalHeliport.longitude!,
          homeHeliport.latitude, homeHeliport.longitude!
        );
        const leg2FlightTime = calculateFlightTime(leg2Distance, cruiseSpeed);
        const leg2DepartureTime = addMinutes(leg1ArrivalTime, turnaroundMinutes);
        const leg2ArrivalTime = addMinutes(leg2DepartureTime, leg2FlightTime);

        legs.push({
          type: 'empty',
          departure: arrivalHeliport,
          arrival: homeHeliport,
          departureTime: leg2DepartureTime,
          arrivalTime: leg2ArrivalTime,
          flightTimeMinutes: leg2FlightTime,
          distanceNm: leg2Distance,
        });
      }
    } else {
      // PICKUP: Plane goes to pick up user, then brings them to destination
      const leg1Distance = calculateDistance(
        homeHeliport.latitude, homeHeliport.longitude!,
        departureHeliport.latitude, departureHeliport.longitude!
      );
      const leg1FlightTime = calculateFlightTime(leg1Distance, cruiseSpeed);
      const leg1ArrivalTime = addMinutes(baseDateTime, -turnaroundMinutes);
      const leg1DepartureTime = addMinutes(leg1ArrivalTime, -leg1FlightTime);

      if (homeHeliport.id !== departureHeliport.id) {
        legs.push({
          type: 'empty',
          departure: homeHeliport,
          arrival: departureHeliport,
          departureTime: addMinutes(leg1DepartureTime, -TAXI_TIME),
          arrivalTime: leg1ArrivalTime,
          flightTimeMinutes: leg1FlightTime,
          distanceNm: leg1Distance,
        });
      }

      // Customer leg: pickup → destination
      const leg2Distance = calculateDistance(
        departureHeliport.latitude, departureHeliport.longitude!,
        arrivalHeliport.latitude, arrivalHeliport.longitude!
      );
      const leg2FlightTime = calculateFlightTime(leg2Distance, cruiseSpeed);
      const leg2DepartureTime = addMinutes(baseDateTime, TAXI_TIME);
      const leg2ArrivalTime = addMinutes(leg2DepartureTime, leg2FlightTime);

      legs.push({
        type: 'customer',
        departure: departureHeliport,
        arrival: arrivalHeliport,
        departureTime: leg2DepartureTime,
        arrivalTime: leg2ArrivalTime,
        flightTimeMinutes: leg2FlightTime,
        distanceNm: leg2Distance,
      });
    }

    return legs;
  };

  // Generate itinerary when inputs change (but only if not in edit mode)
  useEffect(() => {
    if (!isEditingItinerary && departureHeliport && arrivalHeliport && homeHeliport) {
      const legs = calculateInitialItinerary();
      setEditableLegs(legs);
    }
  }, [tripType, departureHeliport, arrivalHeliport, homeHeliport, selectedDateStr, selectedTime, isEditingItinerary]);

  // Update a leg's properties
  const updateLeg = (index: number, updates: Partial<FlightLeg>) => {
    setEditableLegs(prev => {
      const newLegs = [...prev];
      newLegs[index] = { ...newLegs[index], ...updates };
      
      // If heliports changed, recalculate distance and flight time only
      if (updates.departure || updates.arrival) {
        const leg = newLegs[index];
        if (leg.departure.latitude && leg.arrival.latitude) {
          const distance = calculateDistance(
            leg.departure.latitude, leg.departure.longitude!,
            leg.arrival.latitude, leg.arrival.longitude!
          );
          const flightTime = calculateFlightTime(distance, cruiseSpeed);
          newLegs[index].distanceNm = distance;
          newLegs[index].flightTimeMinutes = flightTime;
          // Update arrival time based on new flight time
          newLegs[index].arrivalTime = addMinutes(leg.departureTime, flightTime);
        }
      }
      
      // If departure time changed, update arrival time
      if (updates.departureTime) {
        const leg = newLegs[index];
        newLegs[index].arrivalTime = addMinutes(updates.departureTime, leg.flightTimeMinutes);
      }
      
      return newLegs;
    });
    setIsEditingItinerary(true);
  };

  // Toggle leg type
  const toggleLegType = (index: number) => {
    setEditableLegs(prev => {
      const newLegs = [...prev];
      newLegs[index].type = newLegs[index].type === 'customer' ? 'empty' : 'customer';
      return newLegs;
    });
    setIsEditingItinerary(true);
  };

  // Add a new leg
  const addLeg = () => {
    const lastLeg = editableLegs[editableLegs.length - 1];
    const newDepartureTime = lastLeg ? addMinutes(lastLeg.arrivalTime, turnaroundMinutes) : new Date();
    
    const newLeg: FlightLeg = {
      type: 'customer',
      departure: lastLeg?.arrival || homeHeliport!,
      arrival: homeHeliport!,
      departureTime: newDepartureTime,
      arrivalTime: addMinutes(newDepartureTime, 60),
      flightTimeMinutes: 60,
      distanceNm: 0,
    };
    
    setEditableLegs([...editableLegs, newLeg]);
    setIsEditingItinerary(true);
  };

  // Remove a leg
  const removeLeg = (index: number) => {
    if (editableLegs.length <= 1) return;
    setEditableLegs(prev => prev.filter((_, i) => i !== index));
    setIsEditingItinerary(true);
  };

  // Reset to calculated itinerary
  const resetItinerary = () => {
    const legs = calculateInitialItinerary();
    setEditableLegs(legs);
    setIsEditingItinerary(false);
  };

  const handleSubmit = async () => {
    // For multileg trips
    if (tripType === 'multileg') {
      // Validate all legs have required data
      const validLegs = multiLegs.filter(
        leg => leg.departureHeliport && leg.arrivalHeliport && leg.departureDate && leg.departureTime
      );
      
      if (validLegs.length === 0) return;

      // Build FlightLeg objects for multileg
      const builtLegs: FlightLeg[] = validLegs.map((leg) => {
        const depTime = new Date(`${leg.departureDate}T${leg.departureTime}:00`);
        const distanceNm = calculateDistance(
          leg.departureHeliport!.latitude!,
          leg.departureHeliport!.longitude!,
          leg.arrivalHeliport!.latitude!,
          leg.arrivalHeliport!.longitude!
        );
        const flightTimeMinutes = calculateFlightTime(distanceNm, cruiseSpeed);
        const arrTime = addMinutes(depTime, flightTimeMinutes);

        return {
          type: 'customer',
          departure: leg.departureHeliport!,
          arrival: leg.arrivalHeliport!,
          departureTime: depTime,
          arrivalTime: arrTime,
          flightTimeMinutes,
          distanceNm,
        };
      });

      const totalDistance = builtLegs.reduce((sum, leg) => sum + leg.distanceNm, 0);
      const totalFlightMinutes = builtLegs.reduce((sum, leg) => sum + leg.flightTimeMinutes, 0);

      const firstLeg = builtLegs[0];
      const lastLeg = builtLegs[builtLegs.length - 1];

      // Build route string
      const routeStr = builtLegs.map(l => l.departure.icao_code || l.departure.icao_code).join(' → ') 
        + ' → ' + (lastLeg.arrival.icao_code || lastLeg.arrival.icao_code);

      const totalPassengerWeight = passengers.reduce((sum, p) => sum + (p.weightKg || 0), 0);

      const data: HelicopterBookingData = {
        title: title || `Multi-leg: ${routeStr}`,
        tripType: 'multileg',
        departureHeliport: firstLeg.departure,
        arrivalHeliport: lastLeg.arrival,
        legs: builtLegs,
        notes,
        startDatetime: firstLeg.departureTime.toISOString(),
        endDatetime: lastLeg.arrivalTime.toISOString(),
        passengers,
        metadata: {
          tripType: 'multileg',
          legs: builtLegs.map(leg => ({
            type: leg.type,
            departure: leg.departure.icao_code || leg.departure.icao_code,
            arrival: leg.arrival.icao_code || leg.arrival.icao_code,
            departureTime: leg.departureTime.toISOString(),
            arrivalTime: leg.arrivalTime.toISOString(),
            distanceNm: leg.distanceNm,
            flightTimeMinutes: leg.flightTimeMinutes,
          })),
          totalDistanceNm: totalDistance,
          totalFlightMinutes,
          passengers: passengers.map(p => ({
            fullName: p.fullName,
            idType: p.idType,
            idNumber: p.idNumber,
            weightKg: p.weightKg,
          })),
          totalPassengerWeightKg: totalPassengerWeight,
        },
      };

      await onSubmit(data);
      return;
    }

    // For taken/pickup trips (original logic)
    if (!editableLegs.length || !departureHeliport || !arrivalHeliport) return;

    const totalDistance = editableLegs.reduce((sum, leg) => sum + leg.distanceNm, 0);
    const totalFlightMinutes = editableLegs.reduce((sum, leg) => sum + leg.flightTimeMinutes, 0);
    const totalPassengerWeight = passengers.reduce((sum, p) => sum + (p.weightKg || 0), 0);

    const firstLeg = editableLegs[0];
    const lastLeg = editableLegs[editableLegs.length - 1];

    const data: HelicopterBookingData = {
      title: title || `${tripType === 'taken' ? 'Flight' : 'Pickup'}: ${departureHeliport.icao_code || departureHeliport.icao_code} → ${arrivalHeliport.icao_code || arrivalHeliport.icao_code}`,
      tripType,
      departureHeliport,
      arrivalHeliport,
      legs: editableLegs,
      notes,
      startDatetime: firstLeg.departureTime.toISOString(),
      endDatetime: lastLeg.arrivalTime.toISOString(),
      passengers,
      metadata: {
        tripType,
        legs: editableLegs.map(leg => ({
          type: leg.type,
          departure: leg.departure.icao_code || leg.departure.icao_code,
          arrival: leg.arrival.icao_code || leg.arrival.icao_code,
          departureTime: leg.departureTime.toISOString(),
          arrivalTime: leg.arrivalTime.toISOString(),
          distanceNm: leg.distanceNm,
          flightTimeMinutes: leg.flightTimeMinutes,
        })),
        totalDistanceNm: totalDistance,
        totalFlightMinutes,
        passengers: passengers.map(p => ({
          fullName: p.fullName,
          idType: p.idType,
          idNumber: p.idNumber,
          weightKg: p.weightKg,
        })),
        totalPassengerWeightKg: totalPassengerWeight,
      },
    };

    await onSubmit(data);
  };

  // Select heliport for a leg
  const selectLegHeliport = (heliport: Heliport) => {
    if (!editingLegHeliport) return;
    const { legIndex, field } = editingLegHeliport;
    updateLeg(legIndex, { [field]: heliport });
    setEditingLegHeliport(null);
    setLegHeliportSearch('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative max-w-2xl w-full animate-fade-up max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-navy-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-sky-400" />
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
          {/* Home Heliport Info */}
          {homeHeliport && (
            <div className="p-3 rounded-lg bg-surface border border-border">
              <div className="flex items-center gap-2 text-sm">
                <Home className="w-4 h-4 text-gold-500" />
                <span className="text-muted">Home Base:</span>
                <span className="text-white font-medium">
                  {homeHeliport.icao_code || homeHeliport.icao_code} - {homeHeliport.name}
                </span>
              </div>
            </div>
          )}

          {/* Trip Type Selection */}
          <div>
            <Label>Trip Type</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setTripType('taken');
                  setIsEditingItinerary(false);
                }}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  tripType === 'taken'
                    ? 'border-gold-500 bg-gold-500/10'
                    : 'border-border hover:border-gold-500/50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="w-4 h-4 text-gold-500" />
                  <span className="font-medium text-white text-sm">Taken</span>
                </div>
                <p className="text-xs text-muted">
                  One-way trip, plane returns empty
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTripType('pickup');
                  setIsEditingItinerary(false);
                }}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  tripType === 'pickup'
                    ? 'border-gold-500 bg-gold-500/10'
                    : 'border-border hover:border-gold-500/50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-gold-500" />
                  <span className="font-medium text-white text-sm">Pickup</span>
                </div>
                <p className="text-xs text-muted">
                  Plane comes to pick you up
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTripType('multileg');
                  setIsEditingItinerary(false);
                  // Initialize first leg with selected date
                  setMultiLegs([{ 
                    departureHeliport: null, 
                    arrivalHeliport: null, 
                    departureDate: selectedDateStr, 
                    departureTime: '09:00' 
                  }]);
                }}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  tripType === 'multileg'
                    ? 'border-gold-500 bg-gold-500/10'
                    : 'border-border hover:border-gold-500/50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRight className="w-4 h-4 text-gold-500" />
                  <span className="font-medium text-white text-sm">Multi-Leg</span>
                </div>
                <p className="text-xs text-muted">
                  Stay with plane, multiple stops
                </p>
              </button>
            </div>
          </div>

          {/* Standard mode: Departure/Arrival/Date-Time (for taken and pickup) */}
          {tripType !== 'multileg' && (
            <>
              {/* Departure Heliport */}
              <div className="relative">
                <Label>{tripType === 'taken' ? 'Departure Heliport' : 'Pickup Location'} *</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <Input
                    placeholder="Search heliports..."
                    className="pl-10"
                    value={departureSearch}
                    onChange={(e) => {
                      setDepartureSearch(e.target.value);
                      setShowDepartureDropdown(true);
                    }}
                    onFocus={() => setShowDepartureDropdown(true)}
                  />
                  {departureHeliport && !showDepartureDropdown && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gold-500 font-medium">
                      {departureHeliport.icao_code || departureHeliport.icao_code}
                    </div>
                  )}
                </div>
                {showDepartureDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-navy-900 border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filterHeliports(departureSearch).map((heliport) => {
                      const missingCoords = !heliport.latitude || !heliport.longitude;
                      return (
                        <button
                          key={heliport.id}
                          type="button"
                          onClick={() => {
                            setDepartureHeliport(heliport);
                            setDepartureSearch(heliport.name);
                            setShowDepartureDropdown(false);
                            setIsEditingItinerary(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left hover:bg-surface flex items-center justify-between",
                            missingCoords && "opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {missingCoords && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                            <span className="text-white font-medium">
                              {heliport.icao_code || heliport.icao_code}
                            </span>
                            <span className="text-muted text-sm">{heliport.name}</span>
                          </div>
                          <span className="text-xs text-muted">{heliport.city}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

          {/* Arrival Heliport */}
          <div className="relative">
            <Label>Destination *</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search heliports..."
                className="pl-10"
                value={arrivalSearch}
                onChange={(e) => {
                  setArrivalSearch(e.target.value);
                  setShowArrivalDropdown(true);
                }}
                onFocus={() => setShowArrivalDropdown(true)}
              />
              {arrivalHeliport && !showArrivalDropdown && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gold-500 font-medium">
                  {arrivalHeliport.icao_code || arrivalHeliport.icao_code}
                </div>
              )}
            </div>
            {showArrivalDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-navy-900 border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filterHeliports(arrivalSearch).map((heliport) => (
                  <button
                    key={heliport.id}
                    type="button"
                    onClick={() => {
                      setArrivalHeliport(heliport);
                      setArrivalSearch(heliport.name);
                      setShowArrivalDropdown(false);
                      setIsEditingItinerary(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-surface flex items-center justify-between"
                  >
                    <div>
                      <span className="text-white font-medium">
                        {heliport.icao_code || heliport.icao_code}
                      </span>
                      <span className="text-muted ml-2 text-sm">{heliport.name}</span>
                    </div>
                    <span className="text-xs text-muted">{heliport.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{tripType === 'taken' ? 'Departure Date' : 'Pickup Date'} *</Label>
              <Input
                type="date"
                value={selectedDateStr}
                onChange={(e) => {
                  setSelectedDateStr(e.target.value);
                  setIsEditingItinerary(false);
                }}
              />
            </div>
            <div>
              <Label>{tripType === 'taken' ? 'Departure Time' : 'Pickup Time'} *</Label>
              <Input
                type="time"
                step="900"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  setIsEditingItinerary(false);
                }}
              />
              <p className="text-xs text-muted mt-1">15-minute intervals</p>
            </div>
          </div>
            </>
          )}

          {/* Multi-Leg Builder */}
          {tripType === 'multileg' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Flight Legs</Label>
                <button
                  type="button"
                  onClick={() => {
                    const lastLeg = multiLegs[multiLegs.length - 1];
                    setMultiLegs([...multiLegs, {
                      departureHeliport: lastLeg?.arrivalHeliport || null,
                      arrivalHeliport: null,
                      departureDate: lastLeg?.departureDate || selectedDateStr,
                      departureTime: '09:00'
                    }]);
                  }}
                  className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Leg
                </button>
              </div>
              
              <p className="text-xs text-muted">
                Plan your complete journey. You stay with the aircraft for all legs (no empty legs).
              </p>

              <div className="space-y-3">
                {multiLegs.map((leg, index) => (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg bg-surface border border-border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-white">Leg {index + 1}</span>
                        <span className="px-2 py-0.5 text-xs rounded bg-sky-500/20 text-sky-400">Customer</span>
                      </div>
                      {multiLegs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setMultiLegs(multiLegs.filter((_, i) => i !== index));
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Departure Heliport */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Label className="text-xs">From</Label>
                        <div 
                          className="mt-1 p-2 rounded border border-border bg-navy-900 cursor-pointer hover:border-gold-500/50"
                          onClick={() => {
                            setEditingMultiLegHeliport({ legIndex: index, field: 'departure' });
                            setMultiLegHeliportSearch('');
                          }}
                        >
                          {leg.departureHeliport ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gold-500 font-medium text-sm">
                                {leg.departureHeliport.icao_code || leg.departureHeliport.icao_code}
                              </span>
                              <span className="text-xs text-muted truncate">{leg.departureHeliport.city}</span>
                            </div>
                          ) : (
                            <span className="text-muted text-sm">Select heliport</span>
                          )}
                        </div>
                        {editingMultiLegHeliport?.legIndex === index && editingMultiLegHeliport?.field === 'departure' && (
                          <div className="absolute z-30 w-64 mt-1 bg-navy-900 border border-border rounded-lg shadow-xl">
                            <div className="p-2 border-b border-border">
                              <Input
                                placeholder="Search heliports..."
                                value={multiLegHeliportSearch}
                                onChange={(e) => setMultiLegHeliportSearch(e.target.value)}
                                autoFocus
                                className="text-sm"
                              />
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {filterHeliports(multiLegHeliportSearch).map((heliport) => {
                                const missingCoords = !heliport.latitude || !heliport.longitude;
                                return (
                                  <button
                                    key={heliport.id}
                                    type="button"
                                    onClick={() => {
                                      const newLegs = [...multiLegs];
                                      newLegs[index].departureHeliport = heliport;
                                      setMultiLegs(newLegs);
                                      setEditingMultiLegHeliport(null);
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-left hover:bg-surface text-sm",
                                      missingCoords && "opacity-60"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {missingCoords && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                                      <span className="text-gold-500 font-medium">
                                        {heliport.icao_code || heliport.icao_code}
                                      </span>
                                      <span className="text-muted truncate">{heliport.name}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="p-2 border-t border-border">
                              <button
                                type="button"
                                onClick={() => setEditingMultiLegHeliport(null)}
                                className="text-xs text-muted hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Arrival Heliport */}
                      <div className="relative">
                        <Label className="text-xs">To</Label>
                        <div 
                          className="mt-1 p-2 rounded border border-border bg-navy-900 cursor-pointer hover:border-gold-500/50"
                          onClick={() => {
                            setEditingMultiLegHeliport({ legIndex: index, field: 'arrival' });
                            setMultiLegHeliportSearch('');
                          }}
                        >
                          {leg.arrivalHeliport ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gold-500 font-medium text-sm">
                                {leg.arrivalHeliport.icao_code || leg.arrivalHeliport.icao_code}
                              </span>
                              <span className="text-xs text-muted truncate">{leg.arrivalHeliport.city}</span>
                            </div>
                          ) : (
                            <span className="text-muted text-sm">Select heliport</span>
                          )}
                        </div>
                        {editingMultiLegHeliport?.legIndex === index && editingMultiLegHeliport?.field === 'arrival' && (
                          <div className="absolute z-30 w-64 mt-1 bg-navy-900 border border-border rounded-lg shadow-xl right-0">
                            <div className="p-2 border-b border-border">
                              <Input
                                placeholder="Search heliports..."
                                value={multiLegHeliportSearch}
                                onChange={(e) => setMultiLegHeliportSearch(e.target.value)}
                                autoFocus
                                className="text-sm"
                              />
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {filterHeliports(multiLegHeliportSearch).map((heliport) => {
                                const missingCoords = !heliport.latitude || !heliport.longitude;
                                return (
                                  <button
                                    key={heliport.id}
                                    type="button"
                                    onClick={() => {
                                      const newLegs = [...multiLegs];
                                      newLegs[index].arrivalHeliport = heliport;
                                      // Auto-set next leg's departure to this arrival
                                      if (index < multiLegs.length - 1) {
                                        newLegs[index + 1].departureHeliport = heliport;
                                      }
                                      setMultiLegs(newLegs);
                                      setEditingMultiLegHeliport(null);
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-left hover:bg-surface text-sm",
                                      missingCoords && "opacity-60"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {missingCoords && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                                      <span className="text-gold-500 font-medium">
                                        {heliport.icao_code || heliport.icao_code}
                                      </span>
                                      <span className="text-muted truncate">{heliport.name}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="p-2 border-t border-border">
                              <button
                                type="button"
                                onClick={() => setEditingMultiLegHeliport(null)}
                                className="text-xs text-muted hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Departure Date</Label>
                        <Input
                          type="date"
                          value={leg.departureDate}
                          min={index > 0 ? multiLegs[index - 1].departureDate : undefined}
                          onChange={(e) => {
                            const newLegs = [...multiLegs];
                            newLegs[index].departureDate = e.target.value;
                            setMultiLegs(newLegs);
                          }}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Departure Time</Label>
                        <Input
                          type="time"
                          step="900"
                          value={leg.departureTime}
                          onChange={(e) => {
                            const newLegs = [...multiLegs];
                            newLegs[index].departureTime = e.target.value;
                            setMultiLegs(newLegs);
                          }}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>

                    {/* Flight Info (if both heliports selected) */}
                    {leg.departureHeliport && leg.arrivalHeliport && 
                     leg.departureHeliport.latitude && leg.arrivalHeliport.latitude && (
                      <div className="flex items-center gap-4 text-xs text-muted pt-2 border-t border-border/50">
                        <span>
                          Distance: {calculateDistance(
                            leg.departureHeliport.latitude!,
                            leg.departureHeliport.longitude!,
                            leg.arrivalHeliport.latitude!,
                            leg.arrivalHeliport.longitude!
                          ).toLocaleString()} nm
                        </span>
                        <span>
                          Est. flight: {formatDuration(calculateFlightTime(
                            calculateDistance(
                              leg.departureHeliport.latitude!,
                              leg.departureHeliport.longitude!,
                              leg.arrivalHeliport.latitude!,
                              leg.arrivalHeliport.longitude!
                            ),
                            cruiseSpeed
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Journey Summary */}
              {multiLegs.length > 0 && multiLegs.every(l => l.departureHeliport && l.arrivalHeliport) && (
                <div className="p-3 rounded-lg bg-gold-500/10 border border-gold-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-gold-500" />
                    <span className="text-gold-500 font-medium">Journey Summary</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 text-xs">
                    {multiLegs.map((leg, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span className="text-white font-medium">
                          {leg.departureHeliport?.icao_code || leg.departureHeliport?.icao_code}
                        </span>
                        {idx < multiLegs.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-muted" />
                        )}
                        {idx === multiLegs.length - 1 && (
                          <>
                            <ArrowRight className="w-3 h-3 text-muted" />
                            <span className="text-white font-medium">
                              {leg.arrivalHeliport?.icao_code || leg.arrivalHeliport?.icao_code}
                            </span>
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted">
                    {multiLegs.length} leg{multiLegs.length > 1 ? 's' : ''} • All customer flights
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Missing Coordinates Warning (for taken/pickup modes) */}
          {tripType !== 'multileg' && ((departureHeliport && (!departureHeliport.latitude || !departureHeliport.longitude)) ||
            (arrivalHeliport && (!arrivalHeliport.latitude || !arrivalHeliport.longitude)) ||
            (homeHeliport && (!homeHeliport.latitude || !homeHeliport.longitude))) && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Missing Heliport Coordinates</p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    The following heliports need coordinates for flight calculations:
                  </p>
                  <ul className="text-xs text-amber-400/80 mt-1 list-disc list-inside">
                    {homeHeliport && (!homeHeliport.latitude || !homeHeliport.longitude) && (
                      <li>Home base: {homeHeliport.name}</li>
                    )}
                    {departureHeliport && (!departureHeliport.latitude || !departureHeliport.longitude) && (
                      <li>Departure: {departureHeliport.name}</li>
                    )}
                    {arrivalHeliport && (!arrivalHeliport.latitude || !arrivalHeliport.longitude) && (
                      <li>Destination: {arrivalHeliport.name}</li>
                    )}
                  </ul>
                  <p className="text-xs text-amber-400/80 mt-2">
                    Please update these heliports in the Heliports directory.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Editable Itinerary (for taken/pickup modes) */}
          {tripType !== 'multileg' && editableLegs.length > 0 && (
            <div className="p-4 rounded-lg bg-surface border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  {isEditingItinerary ? (
                    <Edit2 className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  Flight Itinerary
                  {isEditingItinerary && (
                    <span className="text-xs text-amber-400 ml-2">(Modified)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditingItinerary && (
                    <button
                      onClick={resetItinerary}
                      className="text-xs text-muted hover:text-white flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                  <button
                    onClick={addLeg}
                    className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Leg
                  </button>
                </div>
              </div>
              
              {editableLegs.map((leg, index) => (
                <div 
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    leg.type === 'customer' 
                      ? 'bg-sky-500/10 border-sky-500/30' 
                      : 'bg-gray-500/10 border-gray-500/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => toggleLegType(index)}
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80',
                        leg.type === 'customer' 
                          ? 'bg-sky-500/20 text-sky-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      )}
                    >
                      {leg.type === 'customer' ? 'Customer' : 'Empty'} (click to toggle)
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">
                        {leg.distanceNm.toLocaleString()} nm • {formatDuration(leg.flightTimeMinutes)}
                      </span>
                      {editableLegs.length > 1 && (
                        <button
                          onClick={() => removeLeg(index)}
                          className="p-1 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Heliports Row */}
                  <div className="flex items-center gap-2 mb-3">
                    {/* Departure Heliport */}
                    <div className="flex-1 relative">
                      {editingLegHeliport?.legIndex === index && editingLegHeliport.field === 'departure' ? (
                        <div className="relative">
                          <Input
                            placeholder="Search..."
                            value={legHeliportSearch}
                            onChange={(e) => setLegHeliportSearch(e.target.value)}
                            autoFocus
                            className="text-sm"
                          />
                          <div className="absolute z-30 w-full mt-1 bg-navy-900 border border-border rounded-lg shadow-xl max-h-32 overflow-y-auto">
                            {filterHeliports(legHeliportSearch).map((heliport) => (
                              <button
                                key={heliport.id}
                                type="button"
                                onClick={() => selectLegHeliport(heliport)}
                                className="w-full px-3 py-1.5 text-left hover:bg-surface text-sm"
                              >
                                <span className="text-white font-medium">
                                  {heliport.icao_code || heliport.icao_code}
                                </span>
                                <span className="text-muted ml-2">{heliport.city}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingLegHeliport({ legIndex: index, field: 'departure' });
                            setLegHeliportSearch('');
                          }}
                          className="w-full p-2 rounded bg-navy-900 border border-border text-center hover:border-gold-500"
                        >
                          <div className="text-lg font-bold text-white">
                            {leg.departure.icao_code || leg.departure.icao_code}
                          </div>
                          <div className="text-xs text-muted">{leg.departure.city}</div>
                        </button>
                      )}
                    </div>
                    
                    <ArrowRight className="w-5 h-5 text-muted flex-shrink-0" />
                    
                    {/* Arrival Heliport */}
                    <div className="flex-1 relative">
                      {editingLegHeliport?.legIndex === index && editingLegHeliport.field === 'arrival' ? (
                        <div className="relative">
                          <Input
                            placeholder="Search..."
                            value={legHeliportSearch}
                            onChange={(e) => setLegHeliportSearch(e.target.value)}
                            autoFocus
                            className="text-sm"
                          />
                          <div className="absolute z-30 w-full mt-1 bg-navy-900 border border-border rounded-lg shadow-xl max-h-32 overflow-y-auto">
                            {filterHeliports(legHeliportSearch).map((heliport) => (
                              <button
                                key={heliport.id}
                                type="button"
                                onClick={() => selectLegHeliport(heliport)}
                                className="w-full px-3 py-1.5 text-left hover:bg-surface text-sm"
                              >
                                <span className="text-white font-medium">
                                  {heliport.icao_code || heliport.icao_code}
                                </span>
                                <span className="text-muted ml-2">{heliport.city}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingLegHeliport({ legIndex: index, field: 'arrival' });
                            setLegHeliportSearch('');
                          }}
                          className="w-full p-2 rounded bg-navy-900 border border-border text-center hover:border-gold-500"
                        >
                          <div className="text-lg font-bold text-white">
                            {leg.arrival.icao_code || leg.arrival.icao_code}
                          </div>
                          <div className="text-xs text-muted">{leg.arrival.city}</div>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Times Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Departure</Label>
                      <Input
                        type="datetime-local"
                        step="900"
                        value={leg.departureTime.toISOString().slice(0, 16)}
                        onChange={(e) => {
                          const newTime = new Date(e.target.value);
                          updateLeg(index, { departureTime: newTime });
                        }}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Arrival (calculated)</Label>
                      <div className="px-3 py-2 bg-navy-950 border border-border rounded-lg text-sm text-muted">
                        {leg.arrivalTime.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted">Total Trip:</span>
                <span className="text-white font-medium">
                  {editableLegs.length} leg{editableLegs.length > 1 ? 's' : ''} • {' '}
                  {editableLegs.reduce((sum, leg) => sum + leg.distanceNm, 0).toLocaleString()} nm • {' '}
                  {formatDuration(
                    Math.round((editableLegs[editableLegs.length - 1].arrivalTime.getTime() - editableLegs[0].departureTime.getTime()) / 60000)
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Passenger Manifest - Required by Aeronáutica Civil de Panamá */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-500" />
                <Label className="text-base font-medium">Passenger Manifest *</Label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPassengers([...passengers, {
                    id: crypto.randomUUID(),
                    fullName: '',
                    idNumber: '',
                    idType: 'cedula',
                    weightKg: 0
                  }]);
                }}
                className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Passenger
              </button>
            </div>

            <p className="text-xs text-muted">
              Required by Aeronáutica Civil de Panamá for all flights.
            </p>

            <div className="space-y-3">
              {passengers.map((passenger, index) => (
                <div
                  key={passenger.id}
                  className="p-4 rounded-lg bg-surface border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted" />
                      <span className="text-sm font-medium text-white">Passenger {index + 1}</span>
                    </div>
                    {passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPassengers(passengers.filter((_, i) => i !== index));
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <Label className="text-xs">Full Name (as on ID) *</Label>
                    <Input
                      placeholder="e.g., Juan Carlos Pérez García"
                      value={passenger.fullName}
                      onChange={(e) => {
                        const newPassengers = [...passengers];
                        newPassengers[index].fullName = e.target.value;
                        setPassengers(newPassengers);
                      }}
                      className="mt-1"
                    />
                  </div>

                  {/* ID Type and Number */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">ID Type *</Label>
                      <select
                        value={passenger.idType}
                        onChange={(e) => {
                          const newPassengers = [...passengers];
                          newPassengers[index].idType = e.target.value as 'cedula' | 'passport';
                          setPassengers(newPassengers);
                        }}
                        className="mt-1 w-full px-3 py-2 bg-navy-900 border border-border rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
                      >
                        <option value="cedula">Cédula</option>
                        <option value="passport">Passport</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">
                        {passenger.idType === 'cedula' ? 'Cédula Number' : 'Passport Number'} *
                      </Label>
                      <Input
                        placeholder={passenger.idType === 'cedula' ? 'e.g., 8-123-4567' : 'e.g., PA1234567'}
                        value={passenger.idNumber}
                        onChange={(e) => {
                          const newPassengers = [...passengers];
                          newPassengers[index].idNumber = e.target.value;
                          setPassengers(newPassengers);
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      Weight (kg) *
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="300"
                      placeholder="e.g., 75"
                      value={passenger.weightKg || ''}
                      onChange={(e) => {
                        const newPassengers = [...passengers];
                        newPassengers[index].weightKg = parseInt(e.target.value) || 0;
                        setPassengers(newPassengers);
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Passenger Summary */}
            {passengers.length > 0 && passengers.some(p => p.weightKg > 0) && (
              <div className="p-3 rounded-lg bg-gold-500/10 border border-gold-500/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {passengers.length} passenger{passengers.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-gold-500 font-medium">
                    Total weight: {passengers.reduce((sum, p) => sum + (p.weightKg || 0), 0)} kg
                  </span>
                </div>
              </div>
            )}
          </div>

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
              placeholder="Special requests, catering, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white placeholder:text-muted focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                // Validate passengers - at least one with all required fields
                !passengers.every(p => p.fullName && p.idNumber && p.weightKg > 0) ||
                (tripType === 'multileg'
                  ? !multiLegs.every(leg => leg.departureHeliport && leg.arrivalHeliport && leg.departureDate && leg.departureTime)
                  : (!editableLegs.length || !departureHeliport || !arrivalHeliport)
                )
              }
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
