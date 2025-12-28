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
  Anchor,
  Plus,
  Search,
  MapPin,
  Loader2,
  X,
  Edit2,
  Trash2,
  Ship,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface Marina {
  id: string;
  code: string | null;
  name: string;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

interface WatercraftAsset {
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

export default function MarinasPage() {
  const { toast } = useToast();
  const { organization, session } = useAuth();
  
  const [marinas, setMarinas] = useState<Marina[]>([]);
  const [watercraft, setWatercraft] = useState<WatercraftAsset[]>([]);
  const [selectedHomePort, setSelectedHomePort] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingMarina, setEditingMarina] = useState<Marina | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
  });

  // Fetch marinas and watercraft
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.access_token) return;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Fetch ports/marinas
        const marinasResponse = await fetch(
          `${baseUrl}/rest/v1/ports?is_active=eq.true&order=name.asc`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (marinasResponse.ok) {
          const data = await marinasResponse.json();
          setMarinas(data);
        }

        // Fetch watercraft assets
        if (organization?.id) {
          const watercraftResponse = await fetch(
            `${baseUrl}/rest/v1/assets?organization_id=eq.${organization.id}&section=eq.watercraft&is_active=eq.true`,
            {
              headers: {
                'apikey': apiKey!,
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );

          if (watercraftResponse.ok) {
            const data = await watercraftResponse.json();
            setWatercraft(data);
          }
        }
      } catch (error) {
        console.error('Error fetching marinas:', error);
        toast({ title: 'Error', description: 'Failed to load marinas', variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session?.access_token, organization?.id]);

  // Filter marinas
  const filteredMarinas = useMemo(() => {
    if (!searchQuery) return marinas;
    const query = searchQuery.toLowerCase();
    return marinas.filter(m =>
      m.name?.toLowerCase().includes(query) ||
      m.city?.toLowerCase().includes(query) ||
      m.country?.toLowerCase().includes(query)
    );
  }, [marinas, searchQuery]);

  // Find home port for distance calculation
  const homePortMarina = useMemo(() => {
    if (!selectedHomePort) return null;
    return marinas.find(m => m.name === selectedHomePort || m.code === selectedHomePort);
  }, [marinas, selectedHomePort]);

  const resetForm = () => {
    setFormData({
      name: '',
      city: '',
      country: '',
      latitude: '',
      longitude: '',
    });
    setEditingMarina(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (marina: Marina) => {
    setEditingMarina(marina);
    setFormData({
      name: marina.name || '',
      city: marina.city || '',
      country: marina.country || '',
      latitude: marina.latitude?.toString() || '',
      longitude: marina.longitude?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!session?.access_token) return;

    // Validation
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Marina name is required', variant: 'error' });
      return;
    }
    if (!formData.country.trim()) {
      toast({ title: 'Error', description: 'Country is required', variant: 'error' });
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      toast({ title: 'Error', description: 'Coordinates are required for navigation', variant: 'error' });
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

      const marinaData = {
        name: formData.name.trim(),
        city: formData.city.trim() || null,
        country: formData.country.trim(),
        latitude: lat,
        longitude: lng,
        is_active: true,
      };

      const url = editingMarina
        ? `${baseUrl}/rest/v1/ports?id=eq.${editingMarina.id}`
        : `${baseUrl}/rest/v1/ports`;

      const response = await fetch(url, {
        method: editingMarina ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(marinaData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const savedMarina = await response.json();

      if (editingMarina) {
        setMarinas(prev => prev.map(m => m.id === editingMarina.id ? savedMarina[0] : m));
        toast({ title: 'Marina updated', description: 'Marina has been updated successfully.' });
      } else {
        setMarinas(prev => [...prev, savedMarina[0]]);
        toast({ title: 'Marina created', description: 'New marina has been added.' });
      }

      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving marina:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save marina', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (marina: Marina) => {
    if (!session?.access_token) return;
    if (!confirm(`Delete "${marina.name}"? This action cannot be undone.`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/ports?id=eq.${marina.id}`,
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

      setMarinas(prev => prev.filter(m => m.id !== marina.id));
      toast({ title: 'Marina deleted', description: `${marina.name} has been removed.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete marina', variant: 'error' });
    }
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
          <h1 className="text-2xl font-display font-bold text-white">Marinas & Ports</h1>
          <p className="text-muted mt-1">Manage docking locations for watercraft</p>
        </div>
        <Button onClick={openAddModal} className="bg-gold-500 hover:bg-gold-600 text-navy-900">
          <Plus className="w-4 h-4 mr-2" />
          Add Marina
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-surface border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search by name, city, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-navy-800 border-border"
              />
            </div>

            {watercraft.length > 0 && (
              <div className="w-full sm:w-64">
                <select
                  value={selectedHomePort}
                  onChange={(e) => setSelectedHomePort(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-border rounded-lg text-white text-sm"
                >
                  <option value="">Calculate distance from...</option>
                  {watercraft.map(asset => (
                    <option key={asset.id} value={asset.details?.homePort || ''}>
                      {asset.name} ({asset.details?.homePort || 'No home port'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Marinas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMarinas.map((marina) => {
          // Calculate distance from home port
          let distance: number | null = null;
          if (homePortMarina?.latitude && marina.latitude) {
            distance = calculateDistance(
              homePortMarina.latitude, homePortMarina.longitude!,
              marina.latitude, marina.longitude!
            );
          }

          return (
            <Card key={marina.id} className="bg-surface border-border hover:border-gold-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Anchor className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{marina.name}</h3>
                      <p className="text-sm text-muted">
                        {marina.city ? `${marina.city}, ` : ''}{marina.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(marina)}
                      className="text-muted hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(marina)}
                      className="text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  {(!marina.latitude || !marina.longitude) && (
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      Missing coordinates - navigation unavailable
                    </div>
                  )}

                  {distance !== null && (
                    <div className="flex items-center gap-2 text-blue-400 text-xs pt-2 border-t border-border mt-2">
                      <Ship className="w-3 h-3" />
                      <span>{distance} nm from home port</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMarinas.length === 0 && (
        <Card className="bg-surface border-border">
          <CardContent className="py-12 text-center">
            <Anchor className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No marinas found</h3>
            <p className="text-muted mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first marina or port'}
            </p>
            <Button onClick={openAddModal} className="bg-gold-500 hover:bg-gold-600 text-navy-900">
              <Plus className="w-4 h-4 mr-2" />
              Add Marina
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <Card className="relative z-10 w-full max-w-md mx-4 bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-display">
                {editingMarina ? 'Edit Marina' : 'Add Marina'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Marina/Port Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Marina Bay"
                  className="bg-navy-800 border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Miami"
                    className="bg-navy-800 border-border"
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., USA"
                    className="bg-navy-800 border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude * (-90 to 90)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="e.g., 25.7617"
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
                    placeholder="e.g., -80.1918"
                    className="bg-navy-800 border-border"
                  />
                </div>
              </div>
              <p className="text-xs text-muted -mt-2">
                Coordinates are required for navigation calculations
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
                  disabled={isSaving}
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
                      {editingMarina ? 'Update Marina' : 'Add Marina'}
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
