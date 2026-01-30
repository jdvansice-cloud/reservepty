'use client';

import { useState, useEffect, useMemo, ComponentType } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Plane,
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
  LucideIcon,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface AviationLocation {
  id: string;
  icao_code: string;
  iata_code?: string;
  name: string;
  city?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface AviationAsset {
  id: string;
  name: string;
  section: 'planes' | 'helicopters';
  details?: {
    registration?: string;
    model?: string;
    cruiseSpeed?: string;
    maxRange?: string;
    maxPassengers?: string;
    homeAirport?: string;
    homeHeliport?: string;
    turnaroundMinutes?: number;
  };
}

export interface FlightLeg {
  type: 'customer' | 'empty';
  departure: AviationLocation;
  arrival: AviationLocation;
  departureTime: Date;
  arrivalTime: Date;
  flightTimeMinutes: number;
  distanceNm: number;
}

export interface AviationBookingData {
  title: string;
  tripType: 'taken' | 'pickup' | 'multileg';
  departureLocation: AviationLocation;
  arrivalLocation: AviationLocation;
  legs: FlightLeg[];
  notes: string;
  startDatetime: string;
  endDatetime: string;
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
  };
}

export interface AviationModalConfig {
  icon: LucideIcon;
  locationLabel: string;
  entityName: string;
  showIATACode: boolean;
  getHomeLocationCode: (asset: AviationAsset) => string | undefined;
}

export interface AviationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AviationBookingData) => Promise<void>;
  asset: AviationAsset;
  locations: AviationLocation[];
  selectedDate?: Date;
  isSubmitting: boolean;
  config?: AviationModalConfig;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PLANE_CONFIG: AviationModalConfig = {
  icon: Plane,
  locationLabel: 'Airport',
  entityName: 'airport',
  showIATACode: true,
  getHomeLocationCode: (asset) => asset.details?.homeAirport,
};

const HELICOPTER_CONFIG: AviationModalConfig = {
  icon: Navigation,
  locationLabel: 'Heliport',
  entityName: 'heliport',
  showIATACode: false,
  getHomeLocationCode: (asset) => asset.details?.homeHeliport,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculate flight time based on distance and speed
 */
function calculateFlightTime(distanceNm: number, speedKnots: number): number {
  return Math.round((distanceNm / speedKnots) * 60);
}

/**
 * Add minutes to a date
 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Format duration as human readable string
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format time as HH:MM
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Get display code for a location (IATA preferred, fallback to ICAO)
 */
function getLocationCode(location: AviationLocation, preferIATA: boolean): string {
  if (preferIATA && location.iata_code) {
    return location.iata_code;
  }
  return location.icao_code;
}

// Taxi time constant
const TAXI_TIME = 15; // minutes

// ============================================================================
// COMPONENT
// ============================================================================

export default function AviationBookingModal({
  isOpen,
  onClose,
  onSubmit,
  asset,
  locations,
  selectedDate,
  isSubmitting,
  config,
}: AviationBookingModalProps) {
  // Determine config based on asset section if not provided
  const modalConfig = useMemo(() => {
    if (config) return config;
    return asset.section === 'helicopters' ? HELICOPTER_CONFIG : PLANE_CONFIG;
  }, [config, asset.section]);

  const Icon = modalConfig.icon;
  const { locationLabel, entityName, showIATACode, getHomeLocationCode } = modalConfig;

  // Trip state
  const [tripType, setTripType] = useState<'taken' | 'pickup' | 'multileg'>('taken');
  const [departureLocation, setDepartureLocation] = useState<AviationLocation | null>(null);
  const [arrivalLocation, setArrivalLocation] = useState<AviationLocation | null>(null);
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

  // Editable itinerary state
  const [editableLegs, setEditableLegs] = useState<FlightLeg[]>([]);
  const [isEditingItinerary, setIsEditingItinerary] = useState(false);
  const [editingLegLocation, setEditingLegLocation] = useState<{
    legIndex: number;
    field: 'departure' | 'arrival';
  } | null>(null);
  const [legLocationSearch, setLegLocationSearch] = useState('');

  // Multi-leg mode state
  interface MultiLegInput {
    departureLocation: AviationLocation | null;
    arrivalLocation: AviationLocation | null;
    departureDate: string;
    departureTime: string;
  }
  const [multiLegs, setMultiLegs] = useState<MultiLegInput[]>([
    { departureLocation: null, arrivalLocation: null, departureDate: '', departureTime: '09:00' },
  ]);
  const [editingMultiLegLocation, setEditingMultiLegLocation] = useState<{
    legIndex: number;
    field: 'departure' | 'arrival';
  } | null>(null);
  const [multiLegLocationSearch, setMultiLegLocationSearch] = useState('');

  // Get asset details
  const homeLocationCode = getHomeLocationCode(asset);
  const cruiseSpeed = parseInt(asset.details?.cruiseSpeed || '450');
  const turnaroundMinutes = asset.details?.turnaroundMinutes || 60;

  // Find home location
  const homeLocation = useMemo(() => {
    if (!homeLocationCode) return null;
    return (
      locations.find(
        (a) => a.iata_code === homeLocationCode || a.icao_code === homeLocationCode
      ) || null
    );
  }, [locations, homeLocationCode]);

  // Filter locations for dropdown
  const filterLocations = (search: string) => {
    if (!search) return locations.slice(0, 20);
    const searchLower = search.toLowerCase();
    return locations
      .filter(
        (loc) =>
          loc.iata_code?.toLowerCase().includes(searchLower) ||
          loc.icao_code?.toLowerCase().includes(searchLower) ||
          loc.name?.toLowerCase().includes(searchLower) ||
          loc.city?.toLowerCase().includes(searchLower)
      )
      .slice(0, 20);
  };

  // Calculate initial itinerary based on inputs
  const calculateInitialItinerary = (): FlightLeg[] => {
    if (!homeLocation || !departureLocation || !arrivalLocation) return [];
    if (!departureLocation.latitude || !arrivalLocation.latitude || !homeLocation.latitude)
      return [];

    const legs: FlightLeg[] = [];
    const baseDateTime = new Date(`${selectedDateStr}T${selectedTime}:00`);

    if (tripType === 'taken') {
      // TAKEN: User departure → destination, then aircraft returns home
      const leg1Distance = calculateDistance(
        departureLocation.latitude,
        departureLocation.longitude!,
        arrivalLocation.latitude,
        arrivalLocation.longitude!
      );
      const leg1FlightTime = calculateFlightTime(leg1Distance, cruiseSpeed);
      const leg1DepartureTime = addMinutes(baseDateTime, TAXI_TIME);
      const leg1ArrivalTime = addMinutes(leg1DepartureTime, leg1FlightTime);

      legs.push({
        type: 'customer',
        departure: departureLocation,
        arrival: arrivalLocation,
        departureTime: leg1DepartureTime,
        arrivalTime: leg1ArrivalTime,
        flightTimeMinutes: leg1FlightTime,
        distanceNm: leg1Distance,
      });

      // Empty leg: destination → home (if needed)
      if (arrivalLocation.id !== homeLocation.id) {
        const leg2Distance = calculateDistance(
          arrivalLocation.latitude,
          arrivalLocation.longitude!,
          homeLocation.latitude,
          homeLocation.longitude!
        );
        const leg2FlightTime = calculateFlightTime(leg2Distance, cruiseSpeed);
        const leg2DepartureTime = addMinutes(leg1ArrivalTime, turnaroundMinutes);
        const leg2ArrivalTime = addMinutes(leg2DepartureTime, leg2FlightTime);

        legs.push({
          type: 'empty',
          departure: arrivalLocation,
          arrival: homeLocation,
          departureTime: leg2DepartureTime,
          arrivalTime: leg2ArrivalTime,
          flightTimeMinutes: leg2FlightTime,
          distanceNm: leg2Distance,
        });
      }
    } else {
      // PICKUP: Aircraft goes to pick up user, then brings them to destination
      const leg1Distance = calculateDistance(
        homeLocation.latitude,
        homeLocation.longitude!,
        departureLocation.latitude,
        departureLocation.longitude!
      );
      const leg1FlightTime = calculateFlightTime(leg1Distance, cruiseSpeed);
      const leg1ArrivalTime = addMinutes(baseDateTime, -turnaroundMinutes);
      const leg1DepartureTime = addMinutes(leg1ArrivalTime, -leg1FlightTime);

      if (homeLocation.id !== departureLocation.id) {
        legs.push({
          type: 'empty',
          departure: homeLocation,
          arrival: departureLocation,
          departureTime: addMinutes(leg1DepartureTime, -TAXI_TIME),
          arrivalTime: leg1ArrivalTime,
          flightTimeMinutes: leg1FlightTime,
          distanceNm: leg1Distance,
        });
      }

      // Customer leg: pickup → destination
      const leg2Distance = calculateDistance(
        departureLocation.latitude,
        departureLocation.longitude!,
        arrivalLocation.latitude,
        arrivalLocation.longitude!
      );
      const leg2FlightTime = calculateFlightTime(leg2Distance, cruiseSpeed);
      const leg2DepartureTime = addMinutes(baseDateTime, TAXI_TIME);
      const leg2ArrivalTime = addMinutes(leg2DepartureTime, leg2FlightTime);

      legs.push({
        type: 'customer',
        departure: departureLocation,
        arrival: arrivalLocation,
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
    if (!isEditingItinerary && departureLocation && arrivalLocation && homeLocation) {
      const legs = calculateInitialItinerary();
      setEditableLegs(legs);
    }
  }, [
    tripType,
    departureLocation,
    arrivalLocation,
    homeLocation,
    selectedDateStr,
    selectedTime,
    isEditingItinerary,
  ]);

  // Update a leg's properties
  const updateLeg = (index: number, updates: Partial<FlightLeg>) => {
    setEditableLegs((prev) => {
      const newLegs = [...prev];
      newLegs[index] = { ...newLegs[index], ...updates };

      // If locations changed, recalculate distance and flight time
      if (updates.departure || updates.arrival) {
        const leg = newLegs[index];
        if (leg.departure.latitude && leg.arrival.latitude) {
          const distance = calculateDistance(
            leg.departure.latitude,
            leg.departure.longitude!,
            leg.arrival.latitude,
            leg.arrival.longitude!
          );
          const flightTime = calculateFlightTime(distance, cruiseSpeed);
          newLegs[index].distanceNm = distance;
          newLegs[index].flightTimeMinutes = flightTime;
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
    setEditableLegs((prev) => {
      const newLegs = [...prev];
      newLegs[index].type = newLegs[index].type === 'customer' ? 'empty' : 'customer';
      return newLegs;
    });
    setIsEditingItinerary(true);
  };

  // Add a new leg
  const addLeg = () => {
    const lastLeg = editableLegs[editableLegs.length - 1];
    const newDepartureTime = lastLeg
      ? addMinutes(lastLeg.arrivalTime, turnaroundMinutes)
      : new Date();

    const newLeg: FlightLeg = {
      type: 'customer',
      departure: lastLeg?.arrival || homeLocation!,
      arrival: homeLocation!,
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
    setEditableLegs((prev) => prev.filter((_, i) => i !== index));
    setIsEditingItinerary(true);
  };

  // Reset to calculated itinerary
  const resetItinerary = () => {
    const legs = calculateInitialItinerary();
    setEditableLegs(legs);
    setIsEditingItinerary(false);
  };

  // Select location for a leg
  const selectLegLocation = (location: AviationLocation) => {
    if (!editingLegLocation) return;
    const { legIndex, field } = editingLegLocation;
    updateLeg(legIndex, { [field]: location });
    setEditingLegLocation(null);
    setLegLocationSearch('');
  };

  // Select location for multi-leg
  const selectMultiLegLocation = (location: AviationLocation) => {
    if (!editingMultiLegLocation) return;
    const { legIndex, field } = editingMultiLegLocation;
    setMultiLegs((prev) => {
      const newLegs = [...prev];
      if (field === 'departure') {
        newLegs[legIndex].departureLocation = location;
      } else {
        newLegs[legIndex].arrivalLocation = location;
      }
      return newLegs;
    });
    setEditingMultiLegLocation(null);
    setMultiLegLocationSearch('');
  };

  // Add multi-leg
  const addMultiLeg = () => {
    const lastLeg = multiLegs[multiLegs.length - 1];
    setMultiLegs([
      ...multiLegs,
      {
        departureLocation: lastLeg?.arrivalLocation || null,
        arrivalLocation: null,
        departureDate: lastLeg?.departureDate || '',
        departureTime: '09:00',
      },
    ]);
  };

  // Remove multi-leg
  const removeMultiLeg = (index: number) => {
    if (multiLegs.length <= 1) return;
    setMultiLegs((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async () => {
    // For multileg trips
    if (tripType === 'multileg') {
      const validLegs = multiLegs.filter(
        (leg) =>
          leg.departureLocation && leg.arrivalLocation && leg.departureDate && leg.departureTime
      );

      if (validLegs.length === 0) return;

      const builtLegs: FlightLeg[] = validLegs.map((leg) => {
        const depTime = new Date(`${leg.departureDate}T${leg.departureTime}:00`);
        const distanceNm = calculateDistance(
          leg.departureLocation!.latitude!,
          leg.departureLocation!.longitude!,
          leg.arrivalLocation!.latitude!,
          leg.arrivalLocation!.longitude!
        );
        const flightTimeMinutes = calculateFlightTime(distanceNm, cruiseSpeed);
        const arrTime = addMinutes(depTime, flightTimeMinutes);

        return {
          type: 'customer' as const,
          departure: leg.departureLocation!,
          arrival: leg.arrivalLocation!,
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

      const routeStr =
        builtLegs.map((l) => getLocationCode(l.departure, showIATACode)).join(' → ') +
        ' → ' +
        getLocationCode(lastLeg.arrival, showIATACode);

      const data: AviationBookingData = {
        title: title || `Multi-leg: ${routeStr}`,
        tripType: 'multileg',
        departureLocation: firstLeg.departure,
        arrivalLocation: lastLeg.arrival,
        legs: builtLegs,
        notes,
        startDatetime: firstLeg.departureTime.toISOString(),
        endDatetime: lastLeg.arrivalTime.toISOString(),
        metadata: {
          tripType: 'multileg',
          legs: builtLegs.map((leg) => ({
            type: leg.type,
            departure: getLocationCode(leg.departure, showIATACode),
            arrival: getLocationCode(leg.arrival, showIATACode),
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
      return;
    }

    // For taken/pickup trips
    if (!editableLegs.length || !departureLocation || !arrivalLocation) return;

    const totalDistance = editableLegs.reduce((sum, leg) => sum + leg.distanceNm, 0);
    const totalFlightMinutes = editableLegs.reduce((sum, leg) => sum + leg.flightTimeMinutes, 0);

    const firstLeg = editableLegs[0];
    const lastLeg = editableLegs[editableLegs.length - 1];

    const depCode = getLocationCode(departureLocation, showIATACode);
    const arrCode = getLocationCode(arrivalLocation, showIATACode);

    const data: AviationBookingData = {
      title: title || `${tripType === 'taken' ? 'Flight' : 'Pickup'}: ${depCode} → ${arrCode}`,
      tripType,
      departureLocation,
      arrivalLocation,
      legs: editableLegs,
      notes,
      startDatetime: firstLeg.departureTime.toISOString(),
      endDatetime: lastLeg.arrivalTime.toISOString(),
      metadata: {
        tripType,
        legs: editableLegs.map((leg) => ({
          type: leg.type,
          departure: getLocationCode(leg.departure, showIATACode),
          arrival: getLocationCode(leg.arrival, showIATACode),
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

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setTripType('taken');
      setDepartureLocation(null);
      setArrivalLocation(null);
      setTitle('');
      setNotes('');
      setEditableLegs([]);
      setIsEditingItinerary(false);
      setMultiLegs([
        { departureLocation: null, arrivalLocation: null, departureDate: '', departureTime: '09:00' },
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate totals for summary
  const totalDistance = editableLegs.reduce((sum, leg) => sum + leg.distanceNm, 0);
  const totalFlightTime = editableLegs.reduce((sum, leg) => sum + leg.flightTimeMinutes, 0);
  const customerLegs = editableLegs.filter((l) => l.type === 'customer');
  const emptyLegs = editableLegs.filter((l) => l.type === 'empty');

  // Check for valid form
  const isFormValid =
    tripType === 'multileg'
      ? multiLegs.some(
          (l) => l.departureLocation && l.arrivalLocation && l.departureDate && l.departureTime
        )
      : editableLegs.length > 0 && departureLocation && arrivalLocation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Icon className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                Book Flight
              </h2>
              <p className="text-sm text-stone-500">{asset.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
          {/* Home Location Info */}
          {homeLocation && (
            <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 p-3 rounded-xl">
              <Home className="w-4 h-4" />
              <span>
                Home {locationLabel}: {getLocationCode(homeLocation, showIATACode)} -{' '}
                {homeLocation.name}
              </span>
            </div>
          )}

          {!homeLocation && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
              <span>
                No home {entityName} configured for this asset. Please set it in asset settings.
              </span>
            </div>
          )}

          {/* Trip Type Selector */}
          <div>
            <Label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
              Trip Type
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {(['taken', 'pickup', 'multileg'] as const).map((type) => (
                <Button
                  key={type}
                  variant={tripType === type ? 'primary' : 'outline'}
                  onClick={() => setTripType(type)}
                  className={cn(
                    'h-auto py-3 flex flex-col items-center gap-1',
                    tripType === type &&
                      'bg-[#0a1628] hover:bg-[#0a1628]/90 text-white'
                  )}
                >
                  <span className="font-medium capitalize">{type}</span>
                  <span className="text-xs opacity-70">
                    {type === 'taken' && 'Depart & Return'}
                    {type === 'pickup' && 'Aircraft Picks Up'}
                    {type === 'multileg' && 'Multiple Stops'}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Simple Trip Inputs (Taken/Pickup) */}
          {tripType !== 'multileg' && (
            <>
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
                    {tripType === 'taken' ? 'Departure Date' : 'Pickup Date'}
                  </Label>
                  <Input
                    type="date"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
                    {tripType === 'taken' ? 'Departure Time' : 'Pickup Time'}
                  </Label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Location Selectors */}
              <div className="grid grid-cols-2 gap-4">
                {/* Departure */}
                <div className="relative">
                  <Label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
                    Departure {locationLabel}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                      placeholder={`Search ${entityName}s...`}
                      value={departureSearch}
                      onChange={(e) => setDepartureSearch(e.target.value)}
                      onFocus={() => setShowDepartureDropdown(true)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  {departureLocation && (
                    <div className="mt-2 p-2 bg-stone-50 dark:bg-stone-800 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {getLocationCode(departureLocation, showIATACode)}
                        </span>
                        <span className="text-sm text-stone-500 ml-2">
                          {departureLocation.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDepartureLocation(null)}
                        className="h-6 w-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {showDepartureDropdown && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filterLocations(departureSearch).map((loc) => (
                        <button
                          key={loc.id}
                          className="w-full px-4 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-3"
                          onClick={() => {
                            setDepartureLocation(loc);
                            setDepartureSearch('');
                            setShowDepartureDropdown(false);
                          }}
                        >
                          <MapPin className="w-4 h-4 text-stone-400" />
                          <div>
                            <span className="font-medium">
                              {getLocationCode(loc, showIATACode)}
                            </span>
                            <span className="text-sm text-stone-500 ml-2">
                              {loc.name}
                              {loc.city && `, ${loc.city}`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Arrival */}
                <div className="relative">
                  <Label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
                    Arrival {locationLabel}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                      placeholder={`Search ${entityName}s...`}
                      value={arrivalSearch}
                      onChange={(e) => setArrivalSearch(e.target.value)}
                      onFocus={() => setShowArrivalDropdown(true)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  {arrivalLocation && (
                    <div className="mt-2 p-2 bg-stone-50 dark:bg-stone-800 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {getLocationCode(arrivalLocation, showIATACode)}
                        </span>
                        <span className="text-sm text-stone-500 ml-2">
                          {arrivalLocation.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setArrivalLocation(null)}
                        className="h-6 w-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {showArrivalDropdown && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filterLocations(arrivalSearch).map((loc) => (
                        <button
                          key={loc.id}
                          className="w-full px-4 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-700 flex items-center gap-3"
                          onClick={() => {
                            setArrivalLocation(loc);
                            setArrivalSearch('');
                            setShowArrivalDropdown(false);
                          }}
                        >
                          <MapPin className="w-4 h-4 text-stone-400" />
                          <div>
                            <span className="font-medium">
                              {getLocationCode(loc, showIATACode)}
                            </span>
                            <span className="text-sm text-stone-500 ml-2">
                              {loc.name}
                              {loc.city && `, ${loc.city}`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Itinerary Preview */}
              {editableLegs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      Flight Itinerary
                    </Label>
                    <div className="flex items-center gap-2">
                      {isEditingItinerary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetItinerary}
                          className="text-stone-500 hover:text-stone-700"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reset
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addLeg}
                        className="text-[#0a1628] hover:text-[#0a1628]/80"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Leg
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {editableLegs.map((leg, index) => (
                      <Card key={index} className="rounded-xl border-stone-200 dark:border-stone-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer',
                                  leg.type === 'customer'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                                )}
                                onClick={() => toggleLegType(index)}
                              >
                                {leg.type === 'customer' ? 'Customer' : 'Empty'}
                              </span>
                              <span className="text-sm text-stone-500">Leg {index + 1}</span>
                            </div>
                            {editableLegs.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLeg(index)}
                                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-5 gap-3 items-center">
                            {/* Departure */}
                            <div className="col-span-2">
                              <div className="text-sm text-stone-500 mb-1">From</div>
                              <div className="font-medium">
                                {getLocationCode(leg.departure, showIATACode)}
                              </div>
                              <div className="text-xs text-stone-500">{formatTime(leg.departureTime)}</div>
                            </div>

                            {/* Arrow */}
                            <div className="flex flex-col items-center">
                              <ArrowRight className="w-4 h-4 text-stone-400" />
                              <span className="text-xs text-stone-500 mt-1">
                                {formatDuration(leg.flightTimeMinutes)}
                              </span>
                            </div>

                            {/* Arrival */}
                            <div className="col-span-2">
                              <div className="text-sm text-stone-500 mb-1">To</div>
                              <div className="font-medium">
                                {getLocationCode(leg.arrival, showIATACode)}
                              </div>
                              <div className="text-xs text-stone-500">{formatTime(leg.arrivalTime)}</div>
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                            <span>{leg.distanceNm} nm</span>
                            <span>{formatDuration(leg.flightTimeMinutes)} flight time</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-xl">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-sm text-stone-500">Total Distance</div>
                        <div className="font-semibold">{totalDistance.toLocaleString()} nm</div>
                      </div>
                      <div>
                        <div className="text-sm text-stone-500">Total Flight Time</div>
                        <div className="font-semibold">{formatDuration(totalFlightTime)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-stone-500">Customer Legs</div>
                        <div className="font-semibold">{customerLegs.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-stone-500">Empty Legs</div>
                        <div className="font-semibold">{emptyLegs.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Multi-leg Inputs */}
          {tripType === 'multileg' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Flight Legs
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addMultiLeg}
                  className="text-[#0a1628] hover:text-[#0a1628]/80"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Leg
                </Button>
              </div>

              {multiLegs.map((leg, index) => (
                <Card
                  key={index}
                  className="rounded-xl border-stone-200 dark:border-stone-700"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        Leg {index + 1}
                      </span>
                      {multiLegs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMultiLeg(index)}
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          type="date"
                          value={leg.departureDate}
                          onChange={(e) =>
                            setMultiLegs((prev) => {
                              const newLegs = [...prev];
                              newLegs[index].departureDate = e.target.value;
                              return newLegs;
                            })
                          }
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Input
                          type="time"
                          value={leg.departureTime}
                          onChange={(e) =>
                            setMultiLegs((prev) => {
                              const newLegs = [...prev];
                              newLegs[index].departureTime = e.target.value;
                              return newLegs;
                            })
                          }
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Departure */}
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                          <Input
                            placeholder={`From ${entityName}...`}
                            value={
                              editingMultiLegLocation?.legIndex === index &&
                              editingMultiLegLocation?.field === 'departure'
                                ? multiLegLocationSearch
                                : leg.departureLocation
                                ? getLocationCode(leg.departureLocation, showIATACode)
                                : ''
                            }
                            onChange={(e) => setMultiLegLocationSearch(e.target.value)}
                            onFocus={() =>
                              setEditingMultiLegLocation({ legIndex: index, field: 'departure' })
                            }
                            className="pl-10 rounded-xl"
                          />
                        </div>
                        {editingMultiLegLocation?.legIndex === index &&
                          editingMultiLegLocation?.field === 'departure' && (
                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                              {filterLocations(multiLegLocationSearch).map((loc) => (
                                <button
                                  key={loc.id}
                                  className="w-full px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-700 text-sm"
                                  onClick={() => selectMultiLegLocation(loc)}
                                >
                                  <span className="font-medium">
                                    {getLocationCode(loc, showIATACode)}
                                  </span>
                                  <span className="text-stone-500 ml-2">{loc.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>

                      {/* Arrival */}
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                          <Input
                            placeholder={`To ${entityName}...`}
                            value={
                              editingMultiLegLocation?.legIndex === index &&
                              editingMultiLegLocation?.field === 'arrival'
                                ? multiLegLocationSearch
                                : leg.arrivalLocation
                                ? getLocationCode(leg.arrivalLocation, showIATACode)
                                : ''
                            }
                            onChange={(e) => setMultiLegLocationSearch(e.target.value)}
                            onFocus={() =>
                              setEditingMultiLegLocation({ legIndex: index, field: 'arrival' })
                            }
                            className="pl-10 rounded-xl"
                          />
                        </div>
                        {editingMultiLegLocation?.legIndex === index &&
                          editingMultiLegLocation?.field === 'arrival' && (
                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                              {filterLocations(multiLegLocationSearch).map((loc) => (
                                <button
                                  key={loc.id}
                                  className="w-full px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-700 text-sm"
                                  onClick={() => selectMultiLegLocation(loc)}
                                >
                                  <span className="font-medium">
                                    {getLocationCode(loc, showIATACode)}
                                  </span>
                                  <span className="text-stone-500 ml-2">{loc.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Title & Notes */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
                Title (optional)
              </Label>
              <Input
                placeholder="e.g., Business Trip to Miami"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
                Notes
              </Label>
              <textarea
                placeholder="Any special requests or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-24 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#c8b273]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-200 dark:border-stone-700">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white rounded-xl min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Book Flight
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showDepartureDropdown || showArrivalDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowDepartureDropdown(false);
            setShowArrivalDropdown(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// WRAPPER COMPONENTS FOR BACKWARDS COMPATIBILITY
// ============================================================================

// Re-export types for the original interfaces
export type { AviationLocation as Airport };
export type { AviationLocation as Heliport };
export type PlaneBookingData = AviationBookingData;
export type HelicopterBookingData = AviationBookingData;

export interface PlaneBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AviationBookingData) => Promise<void>;
  asset: AviationAsset;
  airports: AviationLocation[];
  selectedDate?: Date;
  isSubmitting: boolean;
}

export interface HelicopterBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AviationBookingData) => Promise<void>;
  asset: AviationAsset;
  heliports: AviationLocation[];
  selectedDate?: Date;
  isSubmitting: boolean;
}

/**
 * Wrapper for plane bookings
 */
export function PlaneBookingModal({
  airports,
  ...props
}: PlaneBookingModalProps) {
  return (
    <AviationBookingModal
      {...props}
      locations={airports}
      config={PLANE_CONFIG}
    />
  );
}

/**
 * Wrapper for helicopter bookings
 */
export function HelicopterBookingModal({
  heliports,
  ...props
}: HelicopterBookingModalProps) {
  return (
    <AviationBookingModal
      {...props}
      locations={heliports}
      config={HELICOPTER_CONFIG}
    />
  );
}
