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
  Anchor,
  Plus,
  Search,
  MapPin,
  Loader2,
  Star,
  X,
  Navigation,
  Edit2,
  Trash2,
  Ship,
} from 'lucide-react';

interface Port {
  id: string;
  code: string | null;
  name: string;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  is_active: boolean;
}

interface BoatAsset {
  id: string;
  name: string;
  details: {
    homePort?: string;
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

export default function PortsPage() {
  const { toast } = useToast();
  const { organization, session } = useAuth();
  
  const [ports, setPorts] = useState<Port[]>([]);
  const [boats, setBoats] = useState<BoatAsset[]>([]);
  const [selectedHomePort, setSelectedHomePort] = useState<Port | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [portForm, setPortForm] = useState({
    code: '',
    name: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch ports and boats
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Fetch ports
        const portsResponse = await fetch(
          `${baseUrl}/rest/v1/ports?is_active=eq.true&order=name.asc`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (portsResponse.ok) {
          const portsData = await portsResponse.json();
          setPorts(portsData);
        }

        // Fetch boats to get home port
        if (organization?.id) {
          const boatsResponse = await fetch(
            `${baseUrl}/rest/v1/assets?organization_id=eq.${organization.id}&section=eq.boats&is_active=eq.true&select=id,name,details`,
            {
              headers: {
                'apikey': apiKey!,
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );

          if (boatsResponse.ok) {
            const boatsData = await boatsResponse.json();
            setBoats(boatsData);
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

  // Update home port when data loads
  useEffect(() => {
    if (boats.length > 0 && ports.length > 0 && !selectedHomePort) {
      const homeCode = boats[0].details?.homePort;
      if (homeCode) {
        const home = ports.find(p => p.code === homeCode || p.name === homeCode);
        if (home) setSelectedHomePort(home);
      }
    }
  }, [boats, ports, selectedHomePort]);

  const filteredPorts = ports.filter((port) => {
    const searchLower = search.toLowerCase();
    return (
      port.code?.toLowerCase().includes(searchLower) ||
      port.name?.toLowerCase().includes(searchLower) ||
      port.city?.toLowerCase().includes(searchLower) ||
      port.country?.toLowerCase().includes(searchLower)
    );
  });

  const getDistanceFromHome = (port: Port): number | null => {
    if (!selectedHomePort || !port.latitude || !port.longitude || 
        !selectedHomePort.latitude || !selectedHomePort.longitude) {
      return null;
    }
    if (port.id === selectedHomePort.id) return 0;
    return calculateDistance(
      selectedHomePort.latitude,
      selectedHomePort.longitude,
      port.latitude,
      port.longitude
    );
  };

  const openAddModal = () => {
    setEditingPort(null);
    setPortForm({
      code: '',
      name: '',
      city: '',
      country: '',
      latitude: '',
      longitude: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (port: Port) => {
    setEditingPort(port);
    setPortForm({
      code: port.code || '',
      name: port.name,
      city: port.city || '',
      country: port.country,
      latitude: port.latitude?.toString() || '',
      longitude: port.longitude?.toString() || '',
    });
    setShowAddModal(true);
  };

  const handleSavePort = async () => {
    if (!session?.access_token) return;
    if (!portForm.name) {
      toast({ title: 'Error', description: 'Port name is required.', variant: 'error' });
      return;
    }
    if (!portForm.country) {
      toast({ title: 'Error', description: 'Country is required.', variant: 'error' });
      return;
    }
    if (!portForm.latitude || !portForm.longitude) {
      toast({ title: 'Error', description: 'Latitude and longitude are required for navigation.', variant: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const portData = {
        code: portForm.code?.toUpperCase() || null,
        name: portForm.name,
        city: portForm.city || null,
        country: portForm.country,
        latitude: parseFloat(portForm.latitude),
        longitude: parseFloat(portForm.longitude),
        is_active: true,
      };

      let response;
      if (editingPort) {
        response = await fetch(
          `${baseUrl}/rest/v1/ports?id=eq.${editingPort.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(portData),
          }
        );
      } else {
        response = await fetch(
          `${baseUrl}/rest/v1/ports`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(portData),
          }
        );
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      
      if (editingPort) {
        setPorts(ports.map(p => p.id === editingPort.id ? result[0] : p));
        toast({ title: 'Port updated', description: `${portForm.name} has been updated.` });
      } else {
        setPorts([...ports, result[0]]);
        toast({ title: 'Port added', description: `${portForm.name} has been added.` });
      }
      
      setShowAddModal(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePort = async (port: Port) => {
    if (!session?.access_token) return;
    if (!confirm(`Delete ${port.name}?`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/ports?id=eq.${port.id}`,
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

      setPorts(ports.filter(p => p.id !== port.id));
      toast({ title: 'Port deleted', description: `${port.name} has been removed.` });
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Ports & Marinas</h1>
          <p className="text-muted mt-1">Port directory for boat navigation</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Port
        </Button>
      </div>

      {/* Home Port Selector */}
      {boats.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gold-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-medium">Home Port:</span>
              </div>
              <select
                value={selectedHomePort?.id || ''}
                onChange={(e) => {
                  const port = ports.find(p => p.id === e.target.value);
                  setSelectedHomePort(port || null);
                }}
                className="flex-1 max-w-md px-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-gold-500"
              >
                <option value="">Select home port...</option>
                {ports.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.code ? `${port.code} - ` : ''}{port.name}
                  </option>
                ))}
              </select>
              {selectedHomePort && (
                <span className="text-sm text-muted">
                  {selectedHomePort.city}, {selectedHomePort.country}
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
          placeholder="Search ports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Ports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPorts.map((port) => {
          const distance = getDistanceFromHome(port);
          const isHome = selectedHomePort?.id === port.id;
          
          return (
            <Card 
              key={port.id} 
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
                      <Anchor className={cn(
                        'w-6 h-6',
                        isHome ? 'text-gold-500' : 'text-blue-400'
                      )} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-white text-sm line-clamp-1">
                        {port.name}
                      </h3>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {port.city}, {port.country}
                      </p>
                      {port.code && (
                        <p className="text-xs text-blue-400/70">Code: {port.code}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isHome && <Star className="w-4 h-4 text-gold-500 fill-current" />}
                    <button
                      onClick={() => openEditModal(port)}
                      className="p-1.5 rounded hover:bg-surface text-muted hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePort(port)}
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
                {port.latitude && port.longitude ? (
                  <div className="mt-2 text-xs text-muted/60">
                    {port.latitude.toFixed(4)}°, {port.longitude.toFixed(4)}°
                  </div>
                ) : (
                  <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Missing coordinates - navigation unavailable
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPorts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Ship className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted">
              {search ? `No ports found matching "${search}"` : 'No ports in directory'}
            </p>
            <Button className="mt-4" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Port
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Port Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <Card className="relative max-w-md w-full animate-fade-up max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">
                {editingPort ? 'Edit Port' : 'Add Port'}
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
                <Label>Port Code</Label>
                <Input
                  placeholder="PABLB"
                  value={portForm.code}
                  onChange={(e) => setPortForm({ ...portForm, code: e.target.value.toUpperCase() })}
                  maxLength={10}
                />
                <p className="text-xs text-muted mt-1">UN/LOCODE or identifier (optional)</p>
              </div>
              <div>
                <Label>Port / Marina Name *</Label>
                <Input
                  placeholder="Balboa Yacht Club"
                  value={portForm.name}
                  onChange={(e) => setPortForm({ ...portForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    placeholder="Panama City"
                    value={portForm.city}
                    onChange={(e) => setPortForm({ ...portForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input
                    placeholder="Panama"
                    value={portForm.country}
                    onChange={(e) => setPortForm({ ...portForm, country: e.target.value })}
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Geolocation * <span className="text-xs text-muted">(required for navigation)</span>
                </Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Latitude (e.g., 8.9514)"
                      value={portForm.latitude}
                      onChange={(e) => setPortForm({ ...portForm, latitude: e.target.value })}
                    />
                    <p className="text-xs text-muted mt-1">-90 to 90</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Longitude (e.g., -79.5456)"
                      value={portForm.longitude}
                      onChange={(e) => setPortForm({ ...portForm, longitude: e.target.value })}
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
                  onClick={handleSavePort}
                  disabled={isSaving || !portForm.name || !portForm.country || !portForm.latitude || !portForm.longitude}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingPort ? 'Update' : 'Add Port')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
