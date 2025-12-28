'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Plane,
  Navigation,
  Loader2,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface Location {
  id: string;
  icao_code: string;
  iata_code: string | null;
  name: string;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  type: string; // 'airport', 'helipad', or 'both'
  runway_length_ft: number | null;
  is_active: boolean;
}

interface PlaneAsset {
  id: string;
  name: string;
  details?: {
    homeAirport?: string;
  };
}

interface HelicopterAsset {
  id: string;
  name: string;
  details?: {
    homeHeliport?: string;
  };
}

// Calculate distance using Haversine formula
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

export default function LocationsPage() {
  const { session, organization } = useAuth();
  const { toast } = useToast();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [planeAssets, setPlaneAssets] = useState<PlaneAsset[]>([]);
  const [helicopterAssets, setHelicopterAssets] = useState<HelicopterAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'planes' | 'helicopters'>('all');
  
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    icao_code: '',
    iata_code: '',
    name: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    runway_length_ft: '',
    forPlanes: true,
    forHelicopters: false,
  });

  // Selected home base for distance calculation
  const [selectedPlaneHome, setSelectedPlaneHome] = useState<string>('');
  const [selectedHeliHome, setSelectedHeliHome] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.access_token) return;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Fetch all aviation locations
        const locationsResponse = await fetch(
          `${baseUrl}/rest/v1/airports?is_active=eq.true&order=name.asc`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (locationsResponse.ok) {
          const data = await locationsResponse.json();
          setLocations(data);
        }

        // Fetch plane assets (for home airport selection)
        if (organization?.id) {
          const planesResponse = await fetch(
            `${baseUrl}/rest/v1/assets?organization_id=eq.${organization.id}&section=eq.planes&is_active=eq.true`,
            {
              headers: {
                'apikey': apiKey!,
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );

          if (planesResponse.ok) {
            const planesData = await planesResponse.json();
            setPlaneAssets(planesData);
          }

          // Fetch helicopter assets
          const helisResponse = await fetch(
            `${baseUrl}/rest/v1/assets?organization_id=eq.${organization.id}&section=eq.helicopters&is_active=eq.true`,
            {
              headers: {
                'apikey': apiKey!,
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );

          if (helisResponse.ok) {
            const helisData = await helisResponse.json();
            setHelicopterAssets(helisData);
          }
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast({ title: 'Error', description: 'Failed to load locations', variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session?.access_token, organization?.id]);

  // Filter locations based on search and type filter
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesSearch = !searchQuery || 
        loc.icao_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.iata_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.country?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' ||
        (filterType === 'planes' && (loc.type === 'airport' || loc.type === 'both')) ||
        (filterType === 'helicopters' && (loc.type === 'helipad' || loc.type === 'both'));

      return matchesSearch && matchesType;
    });
  }, [locations, searchQuery, filterType]);

  // Find home locations for distance calculation
  const selectedPlaneHomeLocation = useMemo(() => {
    if (!selectedPlaneHome) return null;
    return locations.find(l => l.icao_code === selectedPlaneHome || l.iata_code === selectedPlaneHome);
  }, [locations, selectedPlaneHome]);

  const selectedHeliHomeLocation = useMemo(() => {
    if (!selectedHeliHome) return null;
    return locations.find(l => l.icao_code === selectedHeliHome);
  }, [locations, selectedHeliHome]);

  const resetForm = () => {
    setFormData({
      icao_code: '',
      iata_code: '',
      name: '',
      city: '',
      country: '',
      latitude: '',
      longitude: '',
      runway_length_ft: '',
      forPlanes: true,
      forHelicopters: false,
    });
    setEditingLocation(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      icao_code: location.icao_code || '',
      iata_code: location.iata_code || '',
      name: location.name || '',
      city: location.city || '',
      country: location.country || '',
      latitude: location.latitude?.toString() || '',
      longitude: location.longitude?.toString() || '',
      runway_length_ft: location.runway_length_ft?.toString() || '',
      forPlanes: location.type === 'airport' || location.type === 'both',
      forHelicopters: location.type === 'helipad' || location.type === 'both',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!session?.access_token) return;

    // Validation
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Location name is required', variant: 'error' });
      return;
    }
    if (!formData.country.trim()) {
      toast({ title: 'Error', description: 'Country is required', variant: 'error' });
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      toast({ title: 'Error', description: 'Coordinates are required for flight calculations', variant: 'error' });
      return;
    }
    if (!formData.forPlanes && !formData.forHelicopters) {
      toast({ title: 'Error', description: 'Location must be available for at least one asset type', variant: 'error' });
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast({ title: 'Error', description: 'Latitude must be between -90 and 90', variant: 'error' });
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast({ title: 'Error', description: 'Longitude must be between -180 and 180', variant: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Determine type based on checkboxes
      let type = 'airport';
      if (formData.forPlanes && formData.forHelicopters) {
        type = 'both';
      } else if (formData.forHelicopters) {
        type = 'helipad';
      }

      // Generate ICAO code if not provided
      let icaoCode = formData.icao_code.trim().toUpperCase();
      if (!icaoCode) {
        icaoCode = type === 'helipad' ? `H${Date.now().toString().slice(-6)}` : `X${Date.now().toString().slice(-6)}`;
      }

      const locationData = {
        icao_code: icaoCode,
        iata_code: formData.iata_code.trim().toUpperCase() || null,
        name: formData.name.trim(),
        city: formData.city.trim() || null,
        country: formData.country.trim(),
        latitude: lat,
        longitude: lng,
        runway_length_ft: formData.runway_length_ft ? parseInt(formData.runway_length_ft) : null,
        type,
        is_active: true,
      };

      const url = editingLocation 
        ? `${baseUrl}/rest/v1/airports?id=eq.${editingLocation.id}`
        : `${baseUrl}/rest/v1/airports`;

      const response = await fetch(url, {
        method: editingLocation ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const savedLocation = await response.json();

      if (editingLocation) {
        setLocations(prev => prev.map(l => l.id === editingLocation.id ? savedLocation[0] : l));
        toast({ title: 'Location updated', description: 'Aviation location has been updated.' });
      } else {
        setLocations(prev => [...prev, savedLocation[0]]);
        toast({ title: 'Location created', description: 'New aviation location has been added.' });
      }

      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save location', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (location: Location) => {
    if (!session?.access_token) return;
    if (!confirm(`Delete "${location.name}"? This action cannot be undone.`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/airports?id=eq.${location.id}`,
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

      setLocations(prev => prev.filter(l => l.id !== location.id));
      toast({ title: 'Location deleted', description: `${location.name} has been removed.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete location', variant: 'error' });
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === 'both') return 'Planes & Helicopters';
    if (type === 'helipad') return 'Helicopters';
    return 'Planes';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'both') return (
      <div className="flex gap-1">
        <Plane className="w-3 h-3 text-gold-400" />
        <Navigation className="w-3 h-3 text-emerald-400" />
      </div>
    );
    if (type === 'helipad') return <Navigation className="w-4 h-4 text-emerald-400" />;
    return <Plane className="w-4 h-4 text-gold-400" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Aviation Locations</h1>
          <p className="text-muted mt-1">Manage airports and heliports for flight operations</p>
        </div>
        <Button onClick={openAddModal} className="bg-gold-500 hover:bg-gold-600 text-navy-900">
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-surface border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search by code, name, city, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-navy-800 border-border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className={cn(
                  filterType === 'all' ? 'bg-gold-500 text-navy-900' : 'border-border text-muted'
                )}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterType === 'planes' ? 'default' : 'outline'}
                onClick={() => setFilterType('planes')}
                className={cn(
                  filterType === 'planes' ? 'bg-gold-500 text-navy-900' : 'border-border text-muted'
                )}
                size="sm"
              >
                <Plane className="w-4 h-4 mr-1" />
                Planes
              </Button>
              <Button
                variant={filterType === 'helicopters' ? 'default' : 'outline'}
                onClick={() => setFilterType('helicopters')}
                className={cn(
                  filterType === 'helicopters' ? 'bg-gold-500 text-navy-900' : 'border-border text-muted'
                )}
                size="sm"
              >
                <Navigation className="w-4 h-4 mr-1" />
                Helicopters
              </Button>
            </div>
          </div>

          {/* Home base selectors for distance calculation */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {planeAssets.length > 0 && (
              <div>
                <Label className="text-xs text-muted">Calculate distance from plane home:</Label>
                <select
                  value={selectedPlaneHome}
                  onChange={(e) => setSelectedPlaneHome(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-navy-800 border border-border rounded-lg text-white text-sm"
                >
                  <option value="">None</option>
                  {planeAssets.map(asset => (
                    <option key={asset.id} value={asset.details?.homeAirport || ''}>
                      {asset.name} ({asset.details?.homeAirport || 'No home'})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {helicopterAssets.length > 0 && (
              <div>
                <Label className="text-xs text-muted">Calculate distance from helicopter home:</Label>
                <select
                  value={selectedHeliHome}
                  onChange={(e) => setSelectedHeliHome(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-navy-800 border border-border rounded-lg text-white text-sm"
                >
                  <option value="">None</option>
                  {helicopterAssets.map(asset => (
                    <option key={asset.id} value={asset.details?.homeHeliport || ''}>
                      {asset.name} ({asset.details?.homeHeliport || 'No home'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((location) => {
          // Calculate distances
          let planeDistance: number | null = null;
          let heliDistance: number | null = null;

          if (selectedPlaneHomeLocation?.latitude && location.latitude && 
              (location.type === 'airport' || location.type === 'both')) {
            planeDistance = calculateDistance(
              selectedPlaneHomeLocation.latitude, selectedPlaneHomeLocation.longitude!,
              location.latitude, location.longitude!
            );
          }
          if (selectedHeliHomeLocation?.latitude && location.latitude &&
              (location.type === 'helipad' || location.type === 'both')) {
            heliDistance = calculateDistance(
              selectedHeliHomeLocation.latitude, selectedHeliHomeLocation.longitude!,
              location.latitude, location.longitude!
            );
          }

          return (
            <Card key={location.id} className="bg-surface border-border hover:border-gold-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      location.type === 'both' ? 'bg-purple-500/20' :
                      location.type === 'helipad' ? 'bg-emerald-500/20' : 'bg-gold-500/20'
                    )}>
                      {getTypeIcon(location.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {location.iata_code || location.icao_code}
                      </h3>
                      <p className="text-sm text-muted">{location.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(location)}
                      className="text-muted hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(location)}
                      className="text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted">
                    <MapPin className="w-3 h-3" />
                    <span>{location.city ? `${location.city}, ` : ''}{location.country}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs",
                      location.type === 'both' ? 'bg-purple-500/20 text-purple-300' :
                      location.type === 'helipad' ? 'bg-emerald-500/20 text-emerald-300' : 
                      'bg-gold-500/20 text-gold-300'
                    )}>
                      {getTypeLabel(location.type)}
                    </span>
                    {location.icao_code && location.iata_code && (
                      <span className="text-muted text-xs">ICAO: {location.icao_code}</span>
                    )}
                  </div>

                  {(!location.latitude || !location.longitude) && (
                    <div className="flex items-center gap-1 text-amber-400 text-xs mt-2">
                      <AlertTriangle className="w-3 h-3" />
                      Missing coordinates
                    </div>
                  )}

                  {/* Distance display */}
                  {(planeDistance !== null || heliDistance !== null) && (
                    <div className="flex gap-3 mt-2 pt-2 border-t border-border">
                      {planeDistance !== null && (
                        <span className="text-xs text-gold-400">
                          <Plane className="w-3 h-3 inline mr-1" />
                          {planeDistance} nm
                        </span>
                      )}
                      {heliDistance !== null && (
                        <span className="text-xs text-emerald-400">
                          <Navigation className="w-3 h-3 inline mr-1" />
                          {heliDistance} nm
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredLocations.length === 0 && (
        <Card className="bg-surface border-border">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No locations found</h3>
            <p className="text-muted mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first aviation location'}
            </p>
            <Button onClick={openAddModal} className="bg-gold-500 hover:bg-gold-600 text-navy-900">
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <Card className="relative z-10 w-full max-w-lg mx-4 bg-surface border-border max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-display">
                {editingLocation ? 'Edit Location' : 'Add Aviation Location'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Asset Type Selection */}
              <div className="space-y-2">
                <Label>Available For *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.forPlanes}
                      onChange={(e) => setFormData(prev => ({ ...prev, forPlanes: e.target.checked }))}
                      className="w-4 h-4 rounded border-border bg-navy-800 text-gold-500 focus:ring-gold-500"
                    />
                    <Plane className="w-4 h-4 text-gold-400" />
                    <span className="text-white">Planes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.forHelicopters}
                      onChange={(e) => setFormData(prev => ({ ...prev, forHelicopters: e.target.checked }))}
                      className="w-4 h-4 rounded border-border bg-navy-800 text-emerald-500 focus:ring-emerald-500"
                    />
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    <span className="text-white">Helicopters</span>
                  </label>
                </div>
                {!formData.forPlanes && !formData.forHelicopters && (
                  <p className="text-xs text-red-400">Select at least one asset type</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ICAO Code</Label>
                  <Input
                    value={formData.icao_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, icao_code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., MPTO"
                    maxLength={6}
                    className="bg-navy-800 border-border"
                  />
                  <p className="text-xs text-muted mt-1">Auto-generated if empty</p>
                </div>
                <div>
                  <Label>IATA Code</Label>
                  <Input
                    value={formData.iata_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, iata_code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., PTY"
                    maxLength={3}
                    className="bg-navy-800 border-border"
                    disabled={formData.forHelicopters && !formData.forPlanes}
                  />
                  <p className="text-xs text-muted mt-1">
                    {formData.forHelicopters && !formData.forPlanes ? 'Not used for heliports' : '3-letter airport code'}
                  </p>
                </div>
              </div>

              <div>
                <Label>Location Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Tocumen International Airport"
                  className="bg-navy-800 border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Panama City"
                    className="bg-navy-800 border-border"
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., Panama"
                    className="bg-navy-800 border-border"
                  />
                </div>
              </div>

              {formData.forPlanes && (
                <div>
                  <Label>Runway Length (ft)</Label>
                  <Input
                    type="number"
                    value={formData.runway_length_ft}
                    onChange={(e) => setFormData(prev => ({ ...prev, runway_length_ft: e.target.value }))}
                    placeholder="e.g., 10000"
                    className="bg-navy-800 border-border"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude * (-90 to 90)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="e.g., 9.0714"
                    className="bg-navy-800 border-border"
                  />
                </div>
                <div>
                  <Label>Longitude * (-180 to 180)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="e.g., -79.3835"
                    className="bg-navy-800 border-border"
                  />
                </div>
              </div>
              <p className="text-xs text-muted -mt-2">
                Coordinates are required for flight time calculations
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border-border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || (!formData.forPlanes && !formData.forHelicopters)}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 text-navy-900"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editingLocation ? 'Update Location' : 'Add Location'}
                    </>
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
