'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { cn, SECTIONS } from '@/lib/utils';
import {
  ArrowLeft,
  Plane,
  Ship,
  Home,
  Upload,
  X,
  Save,
  Loader2,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  boats: Ship,
};

type SectionType = 'planes' | 'helicopters' | 'residences' | 'boats';

interface FormData {
  section: SectionType | null;
  name: string;
  description: string;
  manufacturer?: string;
  model?: string;
  year?: string;
  tailNumber?: string;
  cruiseSpeed?: string;
  range?: string;
  passengerCapacity?: string;
  homeAirport?: string;
  turnaroundMinutes?: string;
  rotorType?: string;
  maxAltitude?: string;
  homeHelipad?: string;
  address?: string;
  city?: string;
  country?: string;
  bedrooms?: string;
  bathrooms?: string;
  squareFeet?: string;
  checkInTime?: string;
  checkOutTime?: string;
  cleaningBufferHours?: string;
  maxGuests?: string;
  amenities?: string[];
  length?: string;
  beam?: string;
  draft?: string;
  grossTonnage?: string;
  cabins?: string;
  crew?: string;
  homePort?: string;
  fuelCapacity?: string;
}

const AMENITIES = [
  'Pool', 'Hot Tub', 'Gym', 'Home Theater', 'Wine Cellar', 'Beach Access',
  'Ski-in/Ski-out', 'Sauna', 'Tennis Court', 'Golf Access', 'Helipad', 'Boat Dock',
];

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  const { toast } = useToast();
  const { organization, session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    section: null,
    name: '',
    description: '',
    amenities: [],
  });

  // Fetch asset data
  useEffect(() => {
    const fetchAsset = async () => {
      if (!session?.access_token) return;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${baseUrl}/rest/v1/assets?id=eq.${assetId}&select=*`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch asset');

        const data = await response.json();
        if (data.length === 0) {
          toast({ title: 'Asset not found', variant: 'error' });
          router.push('/assets');
          return;
        }

        const asset = data[0];
        const details = asset.details || {};

        setFormData({
          section: asset.section,
          name: asset.name,
          description: asset.description || '',
          manufacturer: details.manufacturer || '',
          model: details.model || '',
          year: details.year?.toString() || '',
          tailNumber: details.tailNumber || '',
          cruiseSpeed: details.cruiseSpeed || '',
          range: details.range || '',
          passengerCapacity: details.passengerCapacity?.toString() || '',
          homeAirport: details.homeAirport || '',
          turnaroundMinutes: details.turnaroundMinutes?.toString() || '',
          rotorType: details.rotorType || '',
          maxAltitude: details.maxAltitude || '',
          homeHelipad: details.homeHelipad || '',
          address: details.address || '',
          city: details.city || '',
          country: details.country || '',
          bedrooms: details.bedrooms?.toString() || '',
          bathrooms: details.bathrooms?.toString() || '',
          squareFeet: details.squareFeet?.toString() || '',
          checkInTime: details.checkInTime || '15:00',
          checkOutTime: details.checkOutTime || '11:00',
          cleaningBufferHours: details.cleaningBufferHours?.toString() || '',
          maxGuests: details.maxGuests?.toString() || '',
          amenities: details.amenities || [],
          length: details.length || '',
          beam: details.beam || '',
          draft: details.draft || '',
          cabins: details.cabins?.toString() || '',
          crew: details.crew?.toString() || '',
          homePort: details.homePort || '',
        });

        if (asset.primary_photo_url) {
          setPhotos([asset.primary_photo_url]);
        }

        // Fetch additional photos
        const photosResponse = await fetch(
          `${baseUrl}/rest/v1/asset_photos?asset_id=eq.${assetId}&select=url&order=display_order`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (photosResponse.ok) {
          const photosData = await photosResponse.json();
          const additionalPhotos = photosData.map((p: any) => p.url);
          if (asset.primary_photo_url) {
            setPhotos([asset.primary_photo_url, ...additionalPhotos]);
          } else {
            setPhotos(additionalPhotos);
          }
        }
      } catch (error: any) {
        console.error('Error fetching asset:', error);
        toast({ title: 'Error loading asset', description: error.message, variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAsset();
  }, [assetId, session?.access_token, router, toast]);

  const updateFormData = (field: keyof FormData, value: string | string[] | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!session?.access_token || !organization?.id) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'error' });
      return;
    }

    setIsUploading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'File too large', description: `${file.name} exceeds 5MB.`, variant: 'error' });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${organization.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const uploadResponse = await fetch(
          `${baseUrl}/storage/v1/object/asset-photos/${fileName}`,
          {
            method: 'POST',
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': file.type,
              'x-upsert': 'true',
            },
            body: file,
          }
        );

        if (!uploadResponse.ok) {
          toast({ title: 'Upload failed', description: `Failed to upload ${file.name}.`, variant: 'error' });
          continue;
        }

        const publicUrl = `${baseUrl}/storage/v1/object/public/asset-photos/${fileName}`;
        setPhotos((prev) => [...prev, publicUrl]);
        toast({ title: 'Photo uploaded', description: `${file.name} uploaded.` });
      }
    } catch (error: any) {
      toast({ title: 'Upload error', description: error.message, variant: 'error' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities || [];
    if (current.includes(amenity)) {
      updateFormData('amenities', current.filter((a) => a !== amenity));
    } else {
      updateFormData('amenities', [...current, amenity]);
    }
  };

  const buildDetailsObject = () => {
    const details: Record<string, any> = {};
    
    switch (formData.section) {
      case 'planes':
        if (formData.manufacturer) details.manufacturer = formData.manufacturer;
        if (formData.model) details.model = formData.model;
        if (formData.year) details.year = parseInt(formData.year);
        if (formData.tailNumber) details.tailNumber = formData.tailNumber;
        if (formData.cruiseSpeed) details.cruiseSpeed = formData.cruiseSpeed;
        if (formData.range) details.range = formData.range;
        if (formData.passengerCapacity) details.passengerCapacity = parseInt(formData.passengerCapacity);
        if (formData.homeAirport) details.homeAirport = formData.homeAirport;
        if (formData.turnaroundMinutes) details.turnaroundMinutes = parseInt(formData.turnaroundMinutes);
        break;
      case 'helicopters':
        if (formData.manufacturer) details.manufacturer = formData.manufacturer;
        if (formData.model) details.model = formData.model;
        if (formData.year) details.year = parseInt(formData.year);
        if (formData.tailNumber) details.tailNumber = formData.tailNumber;
        if (formData.passengerCapacity) details.passengerCapacity = parseInt(formData.passengerCapacity);
        if (formData.homeHelipad) details.homeHelipad = formData.homeHelipad;
        if (formData.turnaroundMinutes) details.turnaroundMinutes = parseInt(formData.turnaroundMinutes);
        break;
      case 'residences':
        if (formData.address) details.address = formData.address;
        if (formData.city) details.city = formData.city;
        if (formData.country) details.country = formData.country;
        if (formData.bedrooms) details.bedrooms = parseInt(formData.bedrooms);
        if (formData.bathrooms) details.bathrooms = parseInt(formData.bathrooms);
        if (formData.squareFeet) details.squareFeet = parseInt(formData.squareFeet);
        if (formData.checkInTime) details.checkInTime = formData.checkInTime;
        if (formData.checkOutTime) details.checkOutTime = formData.checkOutTime;
        if (formData.cleaningBufferHours) details.cleaningBufferHours = parseInt(formData.cleaningBufferHours);
        if (formData.maxGuests) details.maxGuests = parseInt(formData.maxGuests);
        if (formData.amenities && formData.amenities.length > 0) details.amenities = formData.amenities;
        break;
      case 'boats':
        if (formData.manufacturer) details.manufacturer = formData.manufacturer;
        if (formData.model) details.model = formData.model;
        if (formData.year) details.year = parseInt(formData.year);
        if (formData.length) details.length = formData.length;
        if (formData.beam) details.beam = formData.beam;
        if (formData.draft) details.draft = formData.draft;
        if (formData.cabins) details.cabins = parseInt(formData.cabins);
        if (formData.passengerCapacity) details.passengerCapacity = parseInt(formData.passengerCapacity);
        if (formData.crew) details.crew = parseInt(formData.crew);
        if (formData.homePort) details.homePort = formData.homePort;
        break;
    }
    
    return details;
  };

  const handleSave = async () => {
    if (!session?.access_token) return;

    setIsSaving(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const updateData = {
        name: formData.name,
        description: formData.description || null,
        primary_photo_url: photos.length > 0 ? photos[0] : null,
        details: buildDetailsObject(),
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(
        `${baseUrl}/rest/v1/assets?id=eq.${assetId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast({ title: 'Asset updated', description: 'Changes saved successfully.' });
      router.push('/assets');
    } catch (error: any) {
      console.error('Error updating asset:', error);
      toast({ title: 'Error saving', description: error.message, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) return;
    if (!session?.access_token) return;

    setIsDeleting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Soft delete - set is_active to false and deleted_at
      const response = await fetch(
        `${baseUrl}/rest/v1/assets?id=eq.${assetId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            is_active: false,
            deleted_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete asset');

      toast({ title: 'Asset deleted', description: 'The asset has been removed.' });
      router.push('/assets');
    } catch (error: any) {
      toast({ title: 'Error deleting', description: error.message, variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const Icon = SECTION_ICONS[formData.section || 'planes'];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Edit Asset</h1>
            <p className="text-muted">Update {formData.name}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={handleDelete} disabled={isDeleting} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          <span className="ml-2">Delete</span>
        </Button>
      </div>

      {/* Asset Type Badge */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            backgroundColor: `${SECTIONS[formData.section as keyof typeof SECTIONS]?.color}20`,
            color: SECTIONS[formData.section as keyof typeof SECTIONS]?.color,
          }}
        >
          <Icon className="w-4 h-4" />
          {SECTIONS[formData.section as keyof typeof SECTIONS]?.label}
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-display font-semibold text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section-Specific Fields */}
          <div>
            <h2 className="text-lg font-display font-semibold text-white mb-4">
              {SECTIONS[formData.section as keyof typeof SECTIONS]?.label} Details
            </h2>

            {/* Planes Fields */}
            {formData.section === 'planes' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Manufacturer</Label>
                  <Input value={formData.manufacturer || ''} onChange={(e) => updateFormData('manufacturer', e.target.value)} />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={formData.model || ''} onChange={(e) => updateFormData('model', e.target.value)} />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input value={formData.year || ''} onChange={(e) => updateFormData('year', e.target.value)} />
                </div>
                <div>
                  <Label>Tail Number</Label>
                  <Input value={formData.tailNumber || ''} onChange={(e) => updateFormData('tailNumber', e.target.value)} />
                </div>
                <div>
                  <Label>Passenger Capacity</Label>
                  <Input type="number" value={formData.passengerCapacity || ''} onChange={(e) => updateFormData('passengerCapacity', e.target.value)} />
                </div>
                <div>
                  <Label>Cruise Speed</Label>
                  <Input value={formData.cruiseSpeed || ''} onChange={(e) => updateFormData('cruiseSpeed', e.target.value)} />
                </div>
                <div>
                  <Label>Range</Label>
                  <Input value={formData.range || ''} onChange={(e) => updateFormData('range', e.target.value)} />
                </div>
                <div>
                  <Label>Home Airport (IATA)</Label>
                  <Input value={formData.homeAirport || ''} onChange={(e) => updateFormData('homeAirport', e.target.value.toUpperCase())} maxLength={3} />
                </div>
                <div className="col-span-2">
                  <Label>Turnaround Time (minutes)</Label>
                  <Input type="number" value={formData.turnaroundMinutes || ''} onChange={(e) => updateFormData('turnaroundMinutes', e.target.value)} />
                </div>
              </div>
            )}

            {/* Helicopters Fields */}
            {formData.section === 'helicopters' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Manufacturer</Label>
                  <Input value={formData.manufacturer || ''} onChange={(e) => updateFormData('manufacturer', e.target.value)} />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={formData.model || ''} onChange={(e) => updateFormData('model', e.target.value)} />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input value={formData.year || ''} onChange={(e) => updateFormData('year', e.target.value)} />
                </div>
                <div>
                  <Label>Tail Number</Label>
                  <Input value={formData.tailNumber || ''} onChange={(e) => updateFormData('tailNumber', e.target.value)} />
                </div>
                <div>
                  <Label>Passenger Capacity</Label>
                  <Input type="number" value={formData.passengerCapacity || ''} onChange={(e) => updateFormData('passengerCapacity', e.target.value)} />
                </div>
                <div>
                  <Label>Home Helipad</Label>
                  <Input value={formData.homeHelipad || ''} onChange={(e) => updateFormData('homeHelipad', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Turnaround Time (minutes)</Label>
                  <Input type="number" value={formData.turnaroundMinutes || ''} onChange={(e) => updateFormData('turnaroundMinutes', e.target.value)} />
                </div>
              </div>
            )}

            {/* Residences Fields */}
            {formData.section === 'residences' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={formData.address || ''} onChange={(e) => updateFormData('address', e.target.value)} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={formData.city || ''} onChange={(e) => updateFormData('city', e.target.value)} />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input value={formData.country || ''} onChange={(e) => updateFormData('country', e.target.value)} />
                  </div>
                  <div>
                    <Label>Bedrooms</Label>
                    <Input type="number" value={formData.bedrooms || ''} onChange={(e) => updateFormData('bedrooms', e.target.value)} />
                  </div>
                  <div>
                    <Label>Bathrooms</Label>
                    <Input type="number" value={formData.bathrooms || ''} onChange={(e) => updateFormData('bathrooms', e.target.value)} />
                  </div>
                  <div>
                    <Label>Square Feet</Label>
                    <Input type="number" value={formData.squareFeet || ''} onChange={(e) => updateFormData('squareFeet', e.target.value)} />
                  </div>
                  <div>
                    <Label>Max Guests</Label>
                    <Input type="number" value={formData.maxGuests || ''} onChange={(e) => updateFormData('maxGuests', e.target.value)} />
                  </div>
                  <div>
                    <Label>Check-in Time</Label>
                    <Input type="time" step="900" value={formData.checkInTime || '15:00'} onChange={(e) => updateFormData('checkInTime', e.target.value)} />
                  </div>
                  <div>
                    <Label>Check-out Time</Label>
                    <Input type="time" step="900" value={formData.checkOutTime || '11:00'} onChange={(e) => updateFormData('checkOutTime', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Cleaning Buffer (hours)</Label>
                    <Input type="number" value={formData.cleaningBufferHours || ''} onChange={(e) => updateFormData('cleaningBufferHours', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AMENITIES.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                          formData.amenities?.includes(amenity)
                            ? 'bg-gold-500 text-navy-950'
                            : 'bg-surface text-muted hover:text-white'
                        )}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Boats Fields */}
            {formData.section === 'boats' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Manufacturer</Label>
                  <Input value={formData.manufacturer || ''} onChange={(e) => updateFormData('manufacturer', e.target.value)} />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={formData.model || ''} onChange={(e) => updateFormData('model', e.target.value)} />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input value={formData.year || ''} onChange={(e) => updateFormData('year', e.target.value)} />
                </div>
                <div>
                  <Label>Length (ft)</Label>
                  <Input value={formData.length || ''} onChange={(e) => updateFormData('length', e.target.value)} />
                </div>
                <div>
                  <Label>Beam (ft)</Label>
                  <Input value={formData.beam || ''} onChange={(e) => updateFormData('beam', e.target.value)} />
                </div>
                <div>
                  <Label>Draft (ft)</Label>
                  <Input value={formData.draft || ''} onChange={(e) => updateFormData('draft', e.target.value)} />
                </div>
                <div>
                  <Label>Cabins</Label>
                  <Input type="number" value={formData.cabins || ''} onChange={(e) => updateFormData('cabins', e.target.value)} />
                </div>
                <div>
                  <Label>Passenger Capacity</Label>
                  <Input type="number" value={formData.passengerCapacity || ''} onChange={(e) => updateFormData('passengerCapacity', e.target.value)} />
                </div>
                <div>
                  <Label>Crew</Label>
                  <Input type="number" value={formData.crew || ''} onChange={(e) => updateFormData('crew', e.target.value)} />
                </div>
                <div>
                  <Label>Home Port</Label>
                  <Input value={formData.homePort || ''} onChange={(e) => updateFormData('homePort', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Photos */}
          <div>
            <h2 className="text-lg font-display font-semibold text-white mb-4">Photos</h2>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-gold-500 text-navy-950 text-xs font-medium">
                      Primary
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={handlePhotoUpload}
                disabled={isUploading}
                className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-gold-500 transition-colors flex flex-col items-center justify-center gap-2 text-muted hover:text-gold-500 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Upload</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end pt-6 border-t border-border">
            <Button onClick={handleSave} disabled={isSaving || !formData.name}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
