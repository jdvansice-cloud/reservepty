'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';
import {
  Plane,
  Plus,
  Search,
  MapPin,
  Loader2,
  Star,
  X,
  Navigation,
  Ruler,
  Edit2,
  Trash2,
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
  timezone: string | null;
  type: string;
  runway_length_ft: number | null;
  is_active: boolean;
}

interface PlaneAsset {
  id: string;
  name: string;
  details: {
    homeAirport?: string;
    cruiseSpeed?: string;
  };
}

// Haversine formula for distance calculation
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

export default function AirportsPage() {
  const { toast } = useToast();
  const { organization, session } = useAuth();
  
  const [airports, setAirports] = useState<Airport[]>([]);
  const [planes, setPlanes] = useState<PlaneAsset[]>([]);
  const [selectedHomeAirport, setSelectedHomeAirport] = useState<Airport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAirport, setEditingAirport] = useState<Airport | null>(null);
  const [airportForm, setAirportForm] = useState({
    iata_code: '',
    icao_code: '',
    name: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    runway_length_ft: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch airports and planes
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Fetch airports
        const airportsResponse = await fetch(
          `${baseUrl}/rest/v1/airports?is_active=eq.true&order=name.asc`,
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

        // Fetch planes to get home airport
        if (organization?.id) {
          const planesResponse = await fetch(
            `${baseUrl}/rest/v1/assets?organization_id=eq.${organization.id}&section=eq.planes&is_active=eq.true&select=id,name,details`,
            {
              headers: {
                'apikey': apiKey!,
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );

          if (planesResponse.ok) {
            const planesData = await planesResponse.json();
            setPlanes(planesData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [organization?.id, session?.access_token]);

  // Update home airport when airports load
  useEffect(() => {
    if (planes.length > 0 && airports.length > 0 && !selectedHomeAirport) {
      const homeCode = planes[0].details?.homeAirport;
      if (homeCode) {
        const home = airports.find(a => 
          a.iata_code === homeCode || a.icao_code === homeCode
        );
        if (home) setSelectedHomeAirport(home);
      }
    }
  }, [planes, airports, selectedHomeAirport]);

  const filteredAirports = airports.filter((airport) => {
    const searchLower = search.toLowerCase();
    return (
      airport.iata_code?.toLowerCase().includes(searchLower) ||
      airport.icao_code?.toLowerCase().includes(searchLower) ||
      airport.name?.toLowerCase().includes(searchLower) ||
      airport.city?.toLowerCase().includes(searchLower) ||
      airport.country?.toLowerCase().includes(searchLower)
    );
  });

  const getDistanceFromHome = (airport: Airport): number | null => {
    if (!selectedHomeAirport || !airport.latitude || !airport.longitude || 
        !selectedHomeAirport.latitude || !selectedHomeAirport.longitude) {
      return null;
    }
    if (airport.id === selectedHomeAirport.id) return 0;
    return calculateDistance(
      selectedHomeAirport.latitude,
      selectedHomeAirport.longitude,
      airport.latitude,
      airport.longitude
    );
  };

  const openAddModal = () => {
    setEditingAirport(null);
    setAirportForm({
      iata_code: '',
      icao_code: '',
      name: '',
      city: '',
      country: '',
      latitude: '',
      longitude: '',
      runway_length_ft: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (airport: Airport) => {
    setEditingAirport(airport);
    setAirportForm({
      iata_code: airport.iata_code || '',
      icao_code: airport.icao_code || '',
      name: airport.name,
      city: airport.city || '',
      country: airport.country,
      latitude: airport.latitude?.toString() || '',
      longitude: airport.longitude?.toString() || '',
      runway_length_ft: airport.runway_length_ft?.toString() || '',
    });
    setShowAddModal(true);
  };

  const handleSaveAirport = async () => {
    if (!session?.access_token) return;
    if (!airportForm.name) {
      toast({ title: 'Error', description: 'Airport name is required.', variant: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Generate a unique identifier if no codes provided
      const icaoCode = airportForm.icao_code?.toUpperCase() || null;
      const iataCode = airportForm.iata_code?.toUpperCase() || null;

      const airportData = {
        iata_code: iataCode,
        icao_code: icaoCode || `X${Date.now().toString(36).toUpperCase().slice(-5)}`, // Generate unique code if none provided
        name: airportForm.name,
        city: airportForm.city || null,
        country: airportForm.country,
        latitude: airportForm.latitude ? parseFloat(airportForm.latitude) : null,
        longitude: airportForm.longitude ? parseFloat(airportForm.longitude) : null,
        runway_length_ft: airportForm.runway_length_ft ? parseInt(airportForm.runway_length_ft) : null,
        type: 'airport',
        is_active: true,
      };

      let response;
      if (editingAirport) {
        // Update existing
        response = await fetch(
          `${baseUrl}/rest/v1/airports?id=eq.${editingAirport.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(airportData),
          }
        );
      } else {
        // Create new
        response = await fetch(
          `${baseUrl}/rest/v1/airports`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(airportData),
          }
        );
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      
      if (editingAirport) {
        setAirports(airports.map(a => a.id === editingAirport.id ? result[0] : a));
        toast({ title: 'Airport updated', description: `${airportForm.name} has been updated.` });
      } else {
        setAirports([...airports, result[0]]);
        toast({ title: 'Airport added', description: `${airportForm.name} has been added.` });
      }
      
      setShowAddModal(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAirport = async (airport: Airport) => {
    if (!session?.access_token) return;
    if (!confirm(`Delete ${airport.name}?`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/airports?id=eq.${airport.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ is_active: false }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete');

      setAirports(airports.filter(a => a.id !== airport.id));
      toast({ title: 'Airport deleted', description: `${airport.name} has been removed.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Airports</h1>
          <p className="text-muted mt-1">Airport directory for flight planning</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Airport
        </Button>
      </div>

      {/* Home Airport Selector */}
      {planes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gold-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-medium">Home Airport:</span>
              </div>
              <select
                value={selectedHomeAirport?.id || ''}
                onChange={(e) => {
                  const airport = airports.find(a => a.id === e.target.value);
                  setSelectedHomeAirport(airport || null);
                }}
                className="flex-1 max-w-md px-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-gold-500"
              >
                <option value="">Select home airport...</option>
                {airports.map((airport) => (
                  <option key={airport.id} value={airport.id}>
                    {airport.icao_code}{airport.iata_code ? ` / ${airport.iata_code}` : ''} - {airport.name}
                  </option>
                ))}
              </select>
              {selectedHomeAirport && (
                <span className="text-sm text-muted">
                  {selectedHomeAirport.city}, {selectedHomeAirport.country}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <Input
          placeholder="Search airports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Airports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAirports.map((airport) => {
          const distance = getDistanceFromHome(airport);
          const isHome = selectedHomeAirport?.id === airport.id;
          
          return (
            <Card 
              key={airport.id} 
              className={cn(
                'transition-all hover:border-gold-500/30 group',
                isHome && 'border-gold-500 bg-gold-500/5'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      isHome ? 'bg-gold-500/20' : 'bg-surface'
                    )}>
                      <span className={cn(
                        'text-sm font-bold',
                        isHome ? 'text-gold-500' : 'text-white'
                      )}>
                        {airport.icao_code}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-white text-sm line-clamp-1">
                        {airport.name}
                      </h3>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {airport.city}, {airport.country}
                      </p>
                      {airport.iata_code && (
                        <p className="text-xs text-gold-500/70">IATA: {airport.iata_code}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isHome && <Star className="w-4 h-4 text-gold-500 fill-current" />}
                    <button
                      onClick={() => openEditModal(airport)}
                      className="p-1.5 rounded hover:bg-surface text-muted hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAirport(airport)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {/* Runway Length */}
                {airport.runway_length_ft && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                    <Ruler className="w-3 h-3" />
                    <span>Runway: {airport.runway_length_ft.toLocaleString()} ft</span>
                  </div>
                )}
                
                {/* Distance from home */}
                {distance !== null && !isHome && (
                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      Distance from home
                    </span>
                    <span className="text-sm font-medium text-gold-500">
                      {distance.toLocaleString()} nm
                    </span>
                  </div>
                )}

                {/* Coordinates */}
                {airport.latitude && airport.longitude && (
                  <div className="mt-2 text-xs text-muted/60">
                    {airport.latitude.toFixed(4)}°, {airport.longitude.toFixed(4)}°
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAirports.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Plane className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted">
              {search ? `No airports found matching "${search}"` : 'No airports in directory'}
            </p>
            <Button className="mt-4" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Airport
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Airport Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <Card className="relative max-w-md w-full animate-fade-up max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">
                {editingAirport ? 'Edit Airport' : 'Add Airport'}
              </CardTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ICAO Code</Label>
                  <Input
                    placeholder="KMIA"
                    value={airportForm.icao_code}
                    onChange={(e) => setAirportForm({ ...airportForm, icao_code: e.target.value.toUpperCase() })}
                    maxLength={4}
                  />
                  <p className="text-xs text-muted mt-1">4-letter code (optional)</p>
                </div>
                <div>
                  <Label>IATA Code</Label>
                  <Input
                    placeholder="MIA"
                    value={airportForm.iata_code}
                    onChange={(e) => setAirportForm({ ...airportForm, iata_code: e.target.value.toUpperCase() })}
                    maxLength={3}
                  />
                  <p className="text-xs text-muted mt-1">3-letter code (optional)</p>
                </div>
              </div>
              <div>
                <Label>Airport Name *</Label>
                <Input
                  placeholder="Miami International Airport"
                  value={airportForm.name}
                  onChange={(e) => setAirportForm({ ...airportForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    placeholder="Miami"
                    value={airportForm.city}
                    onChange={(e) => setAirportForm({ ...airportForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input
                    placeholder="USA"
                    value={airportForm.country}
                    onChange={(e) => setAirportForm({ ...airportForm, country: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Runway Length */}
              <div>
                <Label>Runway / Strip Length (ft)</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={airportForm.runway_length_ft}
                  onChange={(e) => setAirportForm({ ...airportForm, runway_length_ft: e.target.value })}
                />
                <p className="text-xs text-muted mt-1">Useful for aircraft compatibility</p>
              </div>

              {/* Coordinates */}
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Geolocation (for distance calculations)
                </Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Latitude (25.7959)"
                      value={airportForm.latitude}
                      onChange={(e) => setAirportForm({ ...airportForm, latitude: e.target.value })}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Longitude (-80.2870)"
                      value={airportForm.longitude}
                      onChange={(e) => setAirportForm({ ...airportForm, longitude: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSaveAirport}
                  disabled={isSaving || !airportForm.name || !airportForm.country}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingAirport ? 'Update' : 'Add Airport')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
