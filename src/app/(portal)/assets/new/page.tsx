'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ArrowRight,
  Plane,
  Ship,
  Home,
  Upload,
  X,
  Check,
  Loader2,
  Image as ImageIcon,
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
  // Planes specific
  manufacturer?: string;
  model?: string;
  year?: string;
  tailNumber?: string;
  cruiseSpeed?: string;
  range?: string;
  passengerCapacity?: string;
  homeAirport?: string;
  turnaroundMinutes?: string;
  // Helicopters specific
  rotorType?: string;
  maxAltitude?: string;
  homeHelipad?: string;
  // Residences specific
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
  // Boats specific
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

export default function NewAssetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedSection = searchParams.get('section') as SectionType | null;
  const { toast } = useToast();
  const { organization, session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // If section is pre-selected via URL, start at step 2
  const [step, setStep] = useState(preSelectedSection && SECTIONS[preSelectedSection] ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    section: preSelectedSection && SECTIONS[preSelectedSection] ? preSelectedSection : null,
    name: '',
    description: '',
    amenities: [],
  });

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
      toast({
        title: 'Error',
        description: 'You must be logged in to upload photos.',
        variant: 'error',
      });
      return;
    }

    setIsUploading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not an image file.`,
            variant: 'error',
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 5MB limit.`,
            variant: 'error',
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${organization.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
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
          const errorText = await uploadResponse.text();
          console.error('Upload failed:', errorText);
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}. Please try again.`,
            variant: 'error',
          });
          continue;
        }

        // Get public URL
        const publicUrl = `${baseUrl}/storage/v1/object/public/asset-photos/${fileName}`;
        setPhotos((prev) => [...prev, publicUrl]);

        toast({
          title: 'Photo uploaded',
          description: `${file.name} uploaded successfully.`,
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload error',
        description: error.message || 'An error occurred while uploading.',
        variant: 'error',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        if (formData.rotorType) details.rotorType = formData.rotorType;
        if (formData.maxAltitude) details.maxAltitude = formData.maxAltitude;
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
        if (formData.fuelCapacity) details.fuelCapacity = formData.fuelCapacity;
        break;
    }
    
    return details;
  };

  const handleSubmit = async () => {
    if (!organization?.id || !session?.access_token) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an asset.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const assetData = {
        organization_id: organization.id,
        section: formData.section,
        name: formData.name,
        description: formData.description || null,
        primary_photo_url: photos.length > 0 ? photos[0] : null,
        details: buildDetailsObject(),
        is_active: true,
      };

      const response = await fetch(
        `${baseUrl}/rest/v1/assets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(assetData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const createdAsset = await response.json();

      // If there are additional photos, create asset_photos entries
      if (photos.length > 1) {
        const photoEntries = photos.slice(1).map((url, index) => ({
          asset_id: createdAsset[0].id,
          url,
          display_order: index + 1,
        }));

        await fetch(
          `${baseUrl}/rest/v1/asset_photos`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(photoEntries),
          }
        );
      }

      toast({
        title: 'Asset created successfully',
        description: `${formData.name} has been added to your ${SECTIONS[formData.section!]?.label.toLowerCase()}.`,
      });
      
      router.push('/assets');
    } catch (error: any) {
      console.error('Error creating asset:', error);
      toast({
        title: 'Error creating asset',
        description: error.message || 'An error occurred while creating the asset.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.section !== null;
      case 2:
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 3:
        return true; // Section-specific fields are optional
      case 4:
        return true; // Photos are optional
      default:
        return false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/assets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Add New Asset</h1>
          <p className="text-muted">Register a new asset to your organization</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {['Type', 'Basic Info', 'Details', 'Photos'].map((label, index) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors',
                  step > index + 1
                    ? 'bg-gold-500 text-navy-950'
                    : step === index + 1
                    ? 'bg-gold-500/20 text-gold-500 border-2 border-gold-500'
                    : 'bg-surface text-muted'
                )}
              >
                {step > index + 1 ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-2 font-medium',
                  step >= index + 1 ? 'text-white' : 'text-muted'
                )}
              >
                {label}
              </span>
            </div>
            {index < 3 && (
              <div
                className={cn(
                  'w-16 sm:w-24 h-0.5 mx-2',
                  step > index + 1 ? 'bg-gold-500' : 'bg-surface'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Select Section */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-semibold text-white">
                  Select Asset Type
                </h2>
                <p className="text-muted text-sm mt-1">
                  Choose the category for your new asset
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(SECTIONS).map(([key, section]) => {
                  const Icon = SECTION_ICONS[key];
                  const isSelected = formData.section === key;
                  return (
                    <button
                      key={key}
                      onClick={() => updateFormData('section', key as SectionType)}
                      className={cn(
                        'p-6 rounded-xl border-2 text-left transition-all',
                        isSelected
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-border hover:border-gold-500/50 hover:bg-white/5'
                      )}
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                          isSelected ? 'bg-gold-500 text-navy-950' : 'bg-surface text-muted'
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display font-semibold text-white">
                        {section.label}
                      </h3>
                      <p className="text-sm text-muted mt-1">
                        {key === 'planes' && 'Jets, turboprops, and propeller aircraft'}
                        {key === 'helicopters' && 'Helicopters and rotorcraft'}
                        {key === 'residences' && 'Homes, villas, and vacation properties'}
                        {key === 'boats' && 'Yachts, boats, and watercraft'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-semibold text-white">
                  Basic Information
                </h2>
                <p className="text-muted text-sm mt-1">
                  Enter the basic details for your {SECTIONS[formData.section!]?.label.toLowerCase()}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    placeholder={
                      formData.section === 'planes' ? 'e.g., Gulfstream G650' :
                      formData.section === 'helicopters' ? 'e.g., Bell 429' :
                      formData.section === 'residences' ? 'e.g., Miami Beach Villa' :
                      'e.g., Azimut 72'
                    }
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Describe your asset..."
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Section-Specific Details */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-semibold text-white">
                  {SECTIONS[formData.section!]?.label} Details
                </h2>
                <p className="text-muted text-sm mt-1">
                  Add specific details for your {SECTIONS[formData.section!]?.label.toLowerCase()}
                </p>
              </div>

              {/* Planes Fields */}
              {formData.section === 'planes' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Manufacturer</Label>
                    <Input
                      placeholder="e.g., Gulfstream"
                      value={formData.manufacturer || ''}
                      onChange={(e) => updateFormData('manufacturer', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input
                      placeholder="e.g., G650"
                      value={formData.model || ''}
                      onChange={(e) => updateFormData('model', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input
                      placeholder="e.g., 2020"
                      value={formData.year || ''}
                      onChange={(e) => updateFormData('year', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tail Number</Label>
                    <Input
                      placeholder="e.g., N650GS"
                      value={formData.tailNumber || ''}
                      onChange={(e) => updateFormData('tailNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Passenger Capacity</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 19"
                      value={formData.passengerCapacity || ''}
                      onChange={(e) => updateFormData('passengerCapacity', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Cruise Speed</Label>
                    <Input
                      placeholder="e.g., 516 ktas"
                      value={formData.cruiseSpeed || ''}
                      onChange={(e) => updateFormData('cruiseSpeed', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Range</Label>
                    <Input
                      placeholder="e.g., 7,000 nm"
                      value={formData.range || ''}
                      onChange={(e) => updateFormData('range', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Home Airport (IATA)</Label>
                    <Input
                      placeholder="e.g., MIA"
                      value={formData.homeAirport || ''}
                      onChange={(e) => updateFormData('homeAirport', e.target.value.toUpperCase())}
                      maxLength={3}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Turnaround Time (minutes)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 90"
                      value={formData.turnaroundMinutes || ''}
                      onChange={(e) => updateFormData('turnaroundMinutes', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Helicopters Fields */}
              {formData.section === 'helicopters' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Manufacturer</Label>
                    <Input
                      placeholder="e.g., Bell"
                      value={formData.manufacturer || ''}
                      onChange={(e) => updateFormData('manufacturer', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input
                      placeholder="e.g., 429"
                      value={formData.model || ''}
                      onChange={(e) => updateFormData('model', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input
                      placeholder="e.g., 2021"
                      value={formData.year || ''}
                      onChange={(e) => updateFormData('year', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tail Number</Label>
                    <Input
                      placeholder="e.g., N429BH"
                      value={formData.tailNumber || ''}
                      onChange={(e) => updateFormData('tailNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Passenger Capacity</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 7"
                      value={formData.passengerCapacity || ''}
                      onChange={(e) => updateFormData('passengerCapacity', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Home Helipad</Label>
                    <Input
                      placeholder="e.g., Downtown Manhattan Heliport"
                      value={formData.homeHelipad || ''}
                      onChange={(e) => updateFormData('homeHelipad', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Turnaround Time (minutes)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 30"
                      value={formData.turnaroundMinutes || ''}
                      onChange={(e) => updateFormData('turnaroundMinutes', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Residences Fields */}
              {formData.section === 'residences' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Address</Label>
                      <Input
                        placeholder="e.g., 123 Ocean Drive"
                        value={formData.address || ''}
                        onChange={(e) => updateFormData('address', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        placeholder="e.g., Miami Beach"
                        value={formData.city || ''}
                        onChange={(e) => updateFormData('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        placeholder="e.g., USA"
                        value={formData.country || ''}
                        onChange={(e) => updateFormData('country', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Bedrooms</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 6"
                        value={formData.bedrooms || ''}
                        onChange={(e) => updateFormData('bedrooms', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Bathrooms</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 8"
                        value={formData.bathrooms || ''}
                        onChange={(e) => updateFormData('bathrooms', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Square Feet</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 12000"
                        value={formData.squareFeet || ''}
                        onChange={(e) => updateFormData('squareFeet', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Max Guests</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 12"
                        value={formData.maxGuests || ''}
                        onChange={(e) => updateFormData('maxGuests', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Check-in Time</Label>
                      <Input
                        type="time"
                        step="900"
                        value={formData.checkInTime || '15:00'}
                        onChange={(e) => updateFormData('checkInTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Check-out Time</Label>
                      <Input
                        type="time"
                        step="900"
                        value={formData.checkOutTime || '11:00'}
                        onChange={(e) => updateFormData('checkOutTime', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Cleaning Buffer (hours)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 4"
                        value={formData.cleaningBufferHours || ''}
                        onChange={(e) => updateFormData('cleaningBufferHours', e.target.value)}
                      />
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
                    <Input
                      placeholder="e.g., Azimut"
                      value={formData.manufacturer || ''}
                      onChange={(e) => updateFormData('manufacturer', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input
                      placeholder="e.g., 72"
                      value={formData.model || ''}
                      onChange={(e) => updateFormData('model', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input
                      placeholder="e.g., 2022"
                      value={formData.year || ''}
                      onChange={(e) => updateFormData('year', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Length (ft)</Label>
                    <Input
                      placeholder="e.g., 72"
                      value={formData.length || ''}
                      onChange={(e) => updateFormData('length', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Beam (ft)</Label>
                    <Input
                      placeholder="e.g., 18"
                      value={formData.beam || ''}
                      onChange={(e) => updateFormData('beam', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Draft (ft)</Label>
                    <Input
                      placeholder="e.g., 5"
                      value={formData.draft || ''}
                      onChange={(e) => updateFormData('draft', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Cabins</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 4"
                      value={formData.cabins || ''}
                      onChange={(e) => updateFormData('cabins', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Passenger Capacity</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 12"
                      value={formData.passengerCapacity || ''}
                      onChange={(e) => updateFormData('passengerCapacity', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Crew</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 3"
                      value={formData.crew || ''}
                      onChange={(e) => updateFormData('crew', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Home Port</Label>
                    <Input
                      placeholder="e.g., Port de Monaco"
                      value={formData.homePort || ''}
                      onChange={(e) => updateFormData('homePort', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-semibold text-white">
                  Asset Photos
                </h2>
                <p className="text-muted text-sm mt-1">
                  Add photos of your {SECTIONS[formData.section!]?.label.toLowerCase()}
                </p>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Photo Upload */}
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
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-gold-500 transition-colors flex flex-col items-center justify-center gap-2 text-muted hover:text-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-sm font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8" />
                      <span className="text-sm font-medium">Upload Photo</span>
                    </>
                  )}
                </button>
              </div>

              {photos.length === 0 && (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-muted">No photos added yet</p>
                  <p className="text-xs text-muted mt-1">
                    The first photo will be used as the primary image
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Max 5MB per image • JPG, PNG, GIF supported
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create Asset
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
