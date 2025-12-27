'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Plane,
  X,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
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

interface FlightLeg {
  type: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  flightTimeMinutes?: number;
  distanceNm?: number;
}

interface EditableItineraryProps {
  legs: FlightLeg[];
  airports: Airport[];
  cruiseSpeed: number;
  onSave: (legs: FlightLeg[]) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
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

// Format duration
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Add minutes to a date string
function addMinutesToISOString(isoString: string, minutes: number): string {
  const date = new Date(isoString);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export function EditableItinerary({
  legs: initialLegs,
  airports,
  cruiseSpeed,
  onSave,
  onCancel,
  isSaving,
}: EditableItineraryProps) {
  const [legs, setLegs] = useState<FlightLeg[]>(initialLegs);
  const [editingLegIndex, setEditingLegIndex] = useState<number | null>(null);
  const [showAirportDropdown, setShowAirportDropdown] = useState<'departure' | 'arrival' | null>(null);
  const [airportSearch, setAirportSearch] = useState('');

  // Get airport by code
  const getAirport = (code: string): Airport | undefined => {
    return airports.find(a => a.icao_code === code || a.iata_code === code);
  };

  // Filter airports for dropdown
  const filteredAirports = useMemo(() => {
    if (!airportSearch) return airports.slice(0, 15);
    const search = airportSearch.toLowerCase();
    return airports.filter(a =>
      a.icao_code?.toLowerCase().includes(search) ||
      a.iata_code?.toLowerCase().includes(search) ||
      a.name?.toLowerCase().includes(search) ||
      a.city?.toLowerCase().includes(search)
    ).slice(0, 15);
  }, [airports, airportSearch]);

  // Recalculate leg times when airports change
  const recalculateLeg = (leg: FlightLeg, prevLeg?: FlightLeg): FlightLeg => {
    const depAirport = getAirport(leg.departure);
    const arrAirport = getAirport(leg.arrival);
    
    if (!depAirport?.latitude || !arrAirport?.latitude) {
      return leg;
    }

    const distance = calculateDistance(
      depAirport.latitude, depAirport.longitude!,
      arrAirport.latitude, arrAirport.longitude!
    );
    const flightTime = calculateFlightTime(distance, cruiseSpeed);

    // If there's a previous leg, start after turnaround (60 min default)
    let departureTime = leg.departureTime;
    if (prevLeg) {
      departureTime = addMinutesToISOString(prevLeg.arrivalTime, 60);
    }

    const arrivalTime = addMinutesToISOString(departureTime, flightTime);

    return {
      ...leg,
      distanceNm: distance,
      flightTimeMinutes: flightTime,
      departureTime,
      arrivalTime,
    };
  };

  // Update a leg
  const updateLeg = (index: number, updates: Partial<FlightLeg>) => {
    setLegs(currentLegs => {
      const newLegs = [...currentLegs];
      newLegs[index] = { ...newLegs[index], ...updates };
      
      // Recalculate this leg
      const prevLeg = index > 0 ? newLegs[index - 1] : undefined;
      newLegs[index] = recalculateLeg(newLegs[index], prevLeg);
      
      // Recalculate subsequent legs
      for (let i = index + 1; i < newLegs.length; i++) {
        newLegs[i] = recalculateLeg(newLegs[i], newLegs[i - 1]);
      }
      
      return newLegs;
    });
  };

  // Add a new leg
  const addLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const newDepartureTime = lastLeg 
      ? addMinutesToISOString(lastLeg.arrivalTime, 60)
      : new Date().toISOString();

    const newLeg: FlightLeg = {
      type: 'empty',
      departure: lastLeg?.arrival || '',
      arrival: '',
      departureTime: newDepartureTime,
      arrivalTime: newDepartureTime,
      flightTimeMinutes: 0,
      distanceNm: 0,
    };

    setLegs([...legs, newLeg]);
    setEditingLegIndex(legs.length);
  };

  // Remove a leg
  const removeLeg = (index: number) => {
    if (legs.length <= 1) return;
    
    const newLegs = legs.filter((_, i) => i !== index);
    
    // Recalculate remaining legs
    for (let i = Math.max(0, index - 1); i < newLegs.length; i++) {
      const prevLeg = i > 0 ? newLegs[i - 1] : undefined;
      newLegs[i] = recalculateLeg(newLegs[i], prevLeg);
    }
    
    setLegs(newLegs);
    setEditingLegIndex(null);
  };

  // Toggle leg type
  const toggleLegType = (index: number) => {
    const leg = legs[index];
    updateLeg(index, { type: leg.type === 'customer' ? 'empty' : 'customer' });
  };

  // Select airport
  const selectAirport = (airport: Airport, field: 'departure' | 'arrival') => {
    if (editingLegIndex === null) return;
    
    const code = airport.icao_code;
    updateLeg(editingLegIndex, { [field]: code });
    setShowAirportDropdown(null);
    setAirportSearch('');
  };

  // Handle save
  const handleSave = async () => {
    // Validate all legs have departure and arrival
    const hasInvalid = legs.some(leg => !leg.departure || !leg.arrival);
    if (hasInvalid) {
      return;
    }
    await onSave(legs);
  };

  // Reset to original
  const handleReset = () => {
    setLegs(initialLegs);
    setEditingLegIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-gold-500" />
          Edit Flight Itinerary
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Legs List */}
      <div className="space-y-3">
        {legs.map((leg, index) => {
          const isEditing = editingLegIndex === index;
          const depAirport = getAirport(leg.departure);
          const arrAirport = getAirport(leg.arrival);
          
          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg border transition-all',
                leg.type === 'customer'
                  ? 'bg-sky-500/10 border-sky-500/30'
                  : 'bg-gray-500/10 border-gray-500/30',
                isEditing && 'ring-2 ring-gold-500'
              )}
            >
              {/* Leg Header */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => toggleLegType(index)}
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full transition-colors',
                    leg.type === 'customer'
                      ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  )}
                >
                  {leg.type === 'customer' ? '✈️ Customer Flight' : '↩️ Empty Leg'}
                  <span className="ml-1 text-xs opacity-60">(click to toggle)</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingLegIndex(isEditing ? null : index)}
                    className="p-1 rounded hover:bg-white/10 text-muted hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {legs.length > 1 && (
                    <button
                      onClick={() => removeLeg(index)}
                      className="p-1 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Leg Content */}
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Departure */}
                    <div className="relative">
                      <Label className="text-xs">Departure</Label>
                      <Input
                        value={airportSearch || leg.departure}
                        onChange={(e) => setAirportSearch(e.target.value)}
                        onFocus={() => setShowAirportDropdown('departure')}
                        placeholder="Search airport..."
                        className="text-sm"
                      />
                      {showAirportDropdown === 'departure' && (
                        <div className="absolute z-20 w-full mt-1 bg-navy-900 border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto">
                          {filteredAirports.map((airport) => (
                            <button
                              key={airport.id}
                              onClick={() => selectAirport(airport, 'departure')}
                              className="w-full px-2 py-1.5 text-left hover:bg-surface flex items-center gap-2 text-xs"
                            >
                              <span className="font-medium text-gold-500">{airport.icao_code}</span>
                              <span className="text-white truncate">{airport.city}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arrival */}
                    <div className="relative">
                      <Label className="text-xs">Arrival</Label>
                      <Input
                        value={airportSearch || leg.arrival}
                        onChange={(e) => setAirportSearch(e.target.value)}
                        onFocus={() => setShowAirportDropdown('arrival')}
                        placeholder="Search airport..."
                        className="text-sm"
                      />
                      {showAirportDropdown === 'arrival' && (
                        <div className="absolute z-20 w-full mt-1 bg-navy-900 border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto">
                          {filteredAirports.map((airport) => (
                            <button
                              key={airport.id}
                              onClick={() => selectAirport(airport, 'arrival')}
                              className="w-full px-2 py-1.5 text-left hover:bg-surface flex items-center gap-2 text-xs"
                            >
                              <span className="font-medium text-gold-500">{airport.icao_code}</span>
                              <span className="text-white truncate">{airport.city}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Departure Time */}
                  <div>
                    <Label className="text-xs">Departure Time</Label>
                    <Input
                      type="datetime-local"
                      value={leg.departureTime.slice(0, 16)}
                      onChange={(e) => {
                        const newTime = new Date(e.target.value).toISOString();
                        updateLeg(index, { departureTime: newTime });
                      }}
                      className="text-sm"
                    />
                  </div>

                  {/* Calculated Info */}
                  {(leg.distanceNm ?? 0) > 0 && (
                    <div className="text-xs text-muted flex items-center gap-3">
                      <span>{(leg.distanceNm ?? 0).toLocaleString()} nm</span>
                      <span>•</span>
                      <span>{formatDuration(leg.flightTimeMinutes ?? 0)} flight</span>
                      <span>•</span>
                      <span>Arrives: {new Date(leg.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-base font-bold text-white">{leg.departure || '?'}</div>
                    <div className="text-xs text-muted">
                      {new Date(leg.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {depAirport && <div className="text-xs text-muted/60">{depAirport.city}</div>}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-border" />
                    <div className="text-center">
                      <Plane className={cn('w-3 h-3 mx-auto', leg.type === 'customer' ? 'text-sky-400' : 'text-gray-400')} />
                      <div className="text-xs text-muted">{formatDuration(leg.flightTimeMinutes ?? 0)}</div>
                    </div>
                    <div className="flex-1 border-t border-dashed border-border" />
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-white">{leg.arrival || '?'}</div>
                    <div className="text-xs text-muted">
                      {new Date(leg.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {arrAirport && <div className="text-xs text-muted/60">{arrAirport.city}</div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Leg Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={addLeg}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Flight Leg
      </Button>

      {/* Validation Warning */}
      {legs.some(leg => !leg.departure || !leg.arrival) && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-400">
          <AlertCircle className="w-4 h-4" />
          All legs must have departure and arrival airports
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-border">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={isSaving || legs.some(leg => !leg.departure || !leg.arrival)}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Itinerary
            </>
          )}
        </Button>
      </div>

      {/* Click outside to close dropdowns */}
      {showAirportDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowAirportDropdown(null);
            setAirportSearch('');
          }}
        />
      )}
    </div>
  );
}
