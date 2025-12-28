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
  Plus,
  Search,
  MapPin,
  Loader2,
  Star,
  X,
  Navigation,
  Edit2,
  Trash2,
  CircleDot,
} from 'lucide-react';

interface Heliport {
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

interface HelicopterAsset {
  id: string;
  name: string;
  details: {
    homeHeliport?: string;
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

export default function HeliportsPage() {
  const { toast } = useToast();
  const { organization, session } = useAuth();
  
  const [heliports, setHeliports] = useState<Heliport[]>([]);
  const [helicopters, setHelicopters] = useState<HelicopterAsset[]>([]);
  const [selectedHomeHeliport, setSelectedHomeHeliport] = useState<Heliport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHeliport, setEditingHeliport] = useState<Heliport | null>(null);
  const [heliportForm, setHeliportForm] = useState({
    icao_code: '',
    name: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch heliports and helicopters
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Fetch heliports (type = helipad)
        const heliportsResponse = await fetch(
          `${baseUrl}/rest/v1/airports?type=eq.helipad&is_active=eq.true&order=name.asc`,
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

        // Fetch helicopters to get home heliport
        if (organization?.id) {
          const helicoptersResponse = await fetch(
            `${baseUrl}/rest/v1/assets?organization_id=eq.${organization.id}&section=eq.helicopters&is_active=eq.true&select=id,name,details`,
            {
              headers: {
                'apikey': apiKey!,
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );

          if (helicoptersResponse.ok) {
            const helicoptersData = await helicoptersResponse.json();
            setHelicopters(helicoptersData);
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

  // Update home heliport when data loads
  useEffect(() => {
    if (helicopters.length > 0 && heliports.length > 0 && !selectedHomeHeliport) {
      const homeCode = helicopters[0].details?.homeHeliport;
      if (homeCode) {
        const home = heliports.find(h => 
          h.icao_code === homeCode
        );
        if (home) setSelectedHomeHeliport(home);
      }
    }
  }, [helicopters, heliports, selectedHomeHeliport]);

  const filteredHeliports = heliports.filter((heliport) => {
    const searchLower = search.toLowerCase();
    return (
      heliport.icao_code?.toLowerCase().includes(searchLower) ||
      heliport.name?.toLowerCase().includes(searchLower) ||
      heliport.city?.toLowerCase().includes(searchLower) ||
      heliport.country?.toLowerCase().includes(searchLower)
    );
  });

  const getDistanceFromHome = (heliport: Heliport): number | null => {
    if (!selectedHomeHeliport || !heliport.latitude || !heliport.longitude || 
        !selectedHomeHeliport.latitude || !selectedHomeHeliport.longitude) {
      return null;
    }
    if (heliport.id === selectedHomeHeliport.id) return 0;
    return calculateDistance(
      selectedHomeHeliport.latitude,
      selectedHomeHeliport.longitude,
      heliport.latitude,
      heliport.longitude
    );
  };

  const openAddModal = () => {
    setEditingHeliport(null);
    setHeliportForm({
      icao_code: '',
      name: '',
      city: '',
      country: '',
      latitude: '',
      longitude: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (heliport: Heliport) => {
    setEditingHeliport(heliport);
    setHeliportForm({
      icao_code: heliport.icao_code || '',
      name: heliport.name,
      city: heliport.city || '',
      country: heliport.country,
      latitude: heliport.latitude?.toString() || '',
      longitude: heliport.longitude?.toString() || '',
    });
    setShowAddModal(true);
  };

  const handleSaveHeliport = async () => {
    if (!session?.access_token) return;
    if (!heliportForm.name) {
      toast({ title: 'Error', description: 'Heliport name is required.', variant: 'error' });
      return;
    }
    if (!heliportForm.country) {
      toast({ title: 'Error', description: 'Country is required.', variant: 'error' });
      return;
    }
    if (!heliportForm.latitude || !heliportForm.longitude) {
      toast({ title: 'Error', description: 'Latitude and longitude are required for flight calculations.', variant: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const heliportData = {
        icao_code: heliportForm.icao_code?.toUpperCase() || `H${Date.now().toString(36).toUpperCase().slice(-5)}`,
        iata_code: null,
        name: heliportForm.name,
        city: heliportForm.city || null,
        country: heliportForm.country,
        latitude: parseFloat(heliportForm.latitude),
        longitude: parseFloat(heliportForm.longitude),
        type: 'helipad',
        is_active: true,
      };

      let response;
      if (editingHeliport) {
        response = await fetch(
          `${baseUrl}/rest/v1/airports?id=eq.${editingHeliport.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(heliportData),
          }
        );
      } else {
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
            body: JSON.stringify(heliportData),
          }
        );
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      
      if (editingHeliport) {
        setHeliports(heliports.map(h => h.id === editingHeliport.id ? result[0] : h));
        toast({ title: 'Heliport updated', description: `${heliportForm.name} has been updated.` });
      } else {
        setHeliports([...heliports, result[0]]);
        toast({ title: 'Heliport added', description: `${heliportForm.name} has been added.` });
      }
      
      setShowAddModal(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHeliport = async (heliport: Heliport) => {
    if (!session?.access_token) return;
    if (!confirm(`Delete ${heliport.name}?`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/airports?id=eq.${heliport.id}`,
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

      setHeliports(heliports.filter(h => h.id !== heliport.id));
      toast({ title: 'Heliport deleted', description: `${heliport.name} has been removed.` });
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Heliports</h1>
          <p className="text-muted mt-1">Heliport directory for helicopter flight planning</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Heliport
        </Button>
      </div>

      {/* Home Heliport Selector */}
      {helicopters.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gold-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-medium">Home Heliport:</span>
              </div>
              <select
                value={selectedHomeHeliport?.id || ''}
                onChange={(e) => {
                  const heliport = heliports.find(h => h.id === e.target.value);
                  setSelectedHomeHeliport(heliport || null);
                }}
                className="flex-1 max-w-md px-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-gold-500"
              >
                <option value="">Select home heliport...</option>
                {heliports.map((heliport) => (
                  <option key={heliport.id} value={heliport.id}>
                    {heliport.icao_code} - {heliport.name}
                  </option>
                ))}
              </select>
              {selectedHomeHeliport && (
                <span className="text-sm text-muted">
                  {selectedHomeHeliport.city}, {selectedHomeHeliport.country}
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
          placeholder="Search heliports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Heliports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHeliports.map((heliport) => {
          const distance = getDistanceFromHome(heliport);
          const isHome = selectedHomeHeliport?.id === heliport.id;
          
          return (
            <Card 
              key={heliport.id} 
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
                      <CircleDot className={cn(
                        'w-6 h-6',
                        isHome ? 'text-gold-500' : 'text-emerald-400'
                      )} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-white text-sm line-clamp-1">
                        {heliport.name}
                      </h3>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {heliport.city}, {heliport.country}
                      </p>
                      <p className="text-xs text-emerald-400/70">Code: {heliport.icao_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isHome && <Star className="w-4 h-4 text-gold-500 fill-current" />}
                    <button
                      onClick={() => openEditModal(heliport)}
                      className="p-1.5 rounded hover:bg-surface text-muted hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHeliport(heliport)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {/* Distance from home */}
                {distance !== null && !isHome && (
                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
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
                {heliport.latitude && heliport.longitude ? (
                  <div className="mt-2 text-xs text-muted/60">
                    {heliport.latitude.toFixed(4)}°, {heliport.longitude.toFixed(4)}°
                  </div>
                ) : (
                  <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Missing coordinates - flight calculations unavailable
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredHeliports.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CircleDot className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted">
              {search ? `No heliports found matching "${search}"` : 'No heliports in directory'}
            </p>
            <Button className="mt-4" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Heliport
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Heliport Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <Card className="relative max-w-md w-full animate-fade-up max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">
                {editingHeliport ? 'Edit Heliport' : 'Add Heliport'}
              </CardTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Heliport Code</Label>
                <Input
                  placeholder="HPAC"
                  value={heliportForm.icao_code}
                  onChange={(e) => setHeliportForm({ ...heliportForm, icao_code: e.target.value.toUpperCase() })}
                  maxLength={6}
                />
                <p className="text-xs text-muted mt-1">Identifier code (auto-generated if empty)</p>
              </div>
              <div>
                <Label>Heliport Name *</Label>
                <Input
                  placeholder="Panama City Downtown Heliport"
                  value={heliportForm.name}
                  onChange={(e) => setHeliportForm({ ...heliportForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    placeholder="Panama City"
                    value={heliportForm.city}
                    onChange={(e) => setHeliportForm({ ...heliportForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input
                    placeholder="Panama"
                    value={heliportForm.country}
                    onChange={(e) => setHeliportForm({ ...heliportForm, country: e.target.value })}
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Geolocation * <span className="text-xs text-muted">(required for flight calculations)</span>
                </Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Latitude (e.g., 8.9824)"
                      value={heliportForm.latitude}
                      onChange={(e) => setHeliportForm({ ...heliportForm, latitude: e.target.value })}
                    />
                    <p className="text-xs text-muted mt-1">-90 to 90</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Longitude (e.g., -79.5199)"
                      value={heliportForm.longitude}
                      onChange={(e) => setHeliportForm({ ...heliportForm, longitude: e.target.value })}
                    />
                    <p className="text-xs text-muted mt-1">-180 to 180</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSaveHeliport}
                  disabled={isSaving || !heliportForm.name || !heliportForm.country || !heliportForm.latitude || !heliportForm.longitude}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingHeliport ? 'Update' : 'Add Heliport')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
