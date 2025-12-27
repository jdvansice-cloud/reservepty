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
  const [newAirport, setNewAirport] = useState({
    iata_code: '',
    icao_code: '',
    name: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
  });
  const [isAdding, setIsAdding] = useState(false);

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
          `${baseUrl}/rest/v1/airports?is_active=eq.true&order=iata_code.asc`,
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
            
            // Find home airport from first plane
            if (planesData.length > 0 && planesData[0].details?.homeAirport) {
              const homeCode = planesData[0].details.homeAirport;
              const airportsData = await airportsResponse.json().catch(() => airports);
              const home = airports.find(a => 
                a.iata_code === homeCode || a.icao_code === homeCode
              );
              if (home) setSelectedHomeAirport(home);
            }
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

  const handleAddAirport = async () => {
    if (!session?.access_token) return;
    if (!newAirport.iata_code && !newAirport.icao_code) {
      toast({ title: 'Error', description: 'IATA or ICAO code is required.', variant: 'error' });
      return;
    }

    setIsAdding(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/airports`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            iata_code: newAirport.iata_code?.toUpperCase() || null,
            icao_code: newAirport.icao_code?.toUpperCase() || `K${newAirport.iata_code?.toUpperCase()}`,
            name: newAirport.name,
            city: newAirport.city || null,
            country: newAirport.country,
            latitude: newAirport.latitude ? parseFloat(newAirport.latitude) : null,
            longitude: newAirport.longitude ? parseFloat(newAirport.longitude) : null,
            type: 'airport',
            is_active: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const added = await response.json();
      setAirports([...airports, added[0]]);
      toast({ title: 'Airport added', description: `${newAirport.name} has been added.` });
      setShowAddModal(false);
      setNewAirport({ iata_code: '', icao_code: '', name: '', city: '', country: '', latitude: '', longitude: '' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    } finally {
      setIsAdding(false);
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
        <Button onClick={() => setShowAddModal(true)}>
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
                    {airport.iata_code || airport.icao_code} - {airport.name}
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
                'transition-all hover:border-gold-500/30',
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
                        'text-lg font-bold',
                        isHome ? 'text-gold-500' : 'text-white'
                      )}>
                        {airport.iata_code || airport.icao_code?.slice(-3)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-sm line-clamp-1">
                        {airport.name}
                      </h3>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {airport.city}, {airport.country}
                      </p>
                    </div>
                  </div>
                  {isHome && (
                    <Star className="w-4 h-4 text-gold-500 fill-current flex-shrink-0" />
                  )}
                </div>
                
                {distance !== null && !isHome && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      Distance from home
                    </span>
                    <span className="text-sm font-medium text-gold-500">
                      {distance.toLocaleString()} nm
                    </span>
                  </div>
                )}
                
                {airport.icao_code && airport.iata_code && (
                  <div className="mt-2 text-xs text-muted">
                    ICAO: {airport.icao_code}
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
          </CardContent>
        </Card>
      )}

      {/* Add Airport Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <Card className="relative max-w-md w-full animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">Add Airport</CardTitle>
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
                  <Label>IATA Code *</Label>
                  <Input
                    placeholder="MIA"
                    value={newAirport.iata_code}
                    onChange={(e) => setNewAirport({ ...newAirport, iata_code: e.target.value.toUpperCase() })}
                    maxLength={3}
                  />
                </div>
                <div>
                  <Label>ICAO Code</Label>
                  <Input
                    placeholder="KMIA"
                    value={newAirport.icao_code}
                    onChange={(e) => setNewAirport({ ...newAirport, icao_code: e.target.value.toUpperCase() })}
                    maxLength={4}
                  />
                </div>
              </div>
              <div>
                <Label>Airport Name *</Label>
                <Input
                  placeholder="Miami International Airport"
                  value={newAirport.name}
                  onChange={(e) => setNewAirport({ ...newAirport, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    placeholder="Miami"
                    value={newAirport.city}
                    onChange={(e) => setNewAirport({ ...newAirport, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input
                    placeholder="USA"
                    value={newAirport.country}
                    onChange={(e) => setNewAirport({ ...newAirport, country: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="25.7959"
                    value={newAirport.latitude}
                    onChange={(e) => setNewAirport({ ...newAirport, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="-80.2870"
                    value={newAirport.longitude}
                    onChange={(e) => setNewAirport({ ...newAirport, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleAddAirport}
                  disabled={isAdding || (!newAirport.iata_code && !newAirport.icao_code) || !newAirport.name || !newAirport.country}
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Airport'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
