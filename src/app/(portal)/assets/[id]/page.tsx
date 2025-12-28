'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, SECTIONS, formatDate, isDevMode } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Plane,
  Ship,
  Home,
  Clock,
  Gauge,
  Navigation,
  Bed,
  Bath,
  Square,
  Anchor,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  watercraft: Ship,
};

// Mock asset data
const mockAsset = {
  id: '1',
  name: 'Gulfstream G650',
  section: 'planes',
  description: 'The Gulfstream G650 is a twin-engine business jet aircraft developed by Gulfstream Aerospace. It has the largest cabin of any Gulfstream aircraft, with a maximum range of 7,000 nautical miles. Perfect for transcontinental and international travel with unmatched comfort and performance.',
  primaryPhoto: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200',
  photos: [
    'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200',
    'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
  ],
  location: 'Miami International Airport (KMIA)',
  capacity: 19,
  status: 'available',
  details: {
    manufacturer: 'Gulfstream',
    model: 'G650',
    year: 2020,
    tailNumber: 'N650AB',
    range: '7,000 nm',
    cruiseSpeed: '516 ktas',
    turnaroundMinutes: 90,
  },
  upcomingBookings: [
    {
      id: '1',
      userName: 'John Smith',
      startDate: new Date(Date.now() + 86400000 * 2),
      endDate: new Date(Date.now() + 86400000 * 2 + 36000000),
      status: 'approved',
      route: 'KMIA → KJFK',
    },
    {
      id: '2',
      userName: 'Sarah Johnson',
      startDate: new Date(Date.now() + 86400000 * 5),
      endDate: new Date(Date.now() + 86400000 * 5 + 72000000),
      status: 'pending',
      route: 'KJFK → EGLL',
    },
  ],
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const asset = mockAsset; // In production, fetch from API
  const Icon = SECTION_ICONS[asset.section];
  const sectionInfo = SECTIONS[asset.section as keyof typeof SECTIONS];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'booked':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'maintenance':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default:
        return 'text-muted bg-muted/10 border-border';
    }
  };

  const handleDelete = () => {
    // In production, call API to delete
    router.push('/assets');
  };

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % asset.photos.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + asset.photos.length) % asset.photos.length);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                {asset.name}
              </h1>
              <div
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border capitalize',
                  getStatusColor(asset.status)
                )}
              >
                {asset.status}
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted mt-1">
              <Icon className="w-4 h-4" style={{ color: sectionInfo?.color }} />
              <span>{sectionInfo?.label}</span>
              <span>•</span>
              <MapPin className="w-4 h-4" />
              <span>{asset.location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDevMode() && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Demo</span>
            </div>
          )}
          <Link href={`/assets/${asset.id}/edit`}>
            <Button variant="secondary">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <Card className="overflow-hidden">
            <div className="relative aspect-video">
              <img
                src={asset.photos[activePhotoIndex]}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              {asset.photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {asset.photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActivePhotoIndex(index)}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          index === activePhotoIndex ? 'bg-white' : 'bg-white/50'
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {asset.photos.length > 1 && (
              <div className="p-4 flex gap-2 overflow-x-auto">
                {asset.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePhotoIndex(index)}
                    className={cn(
                      'flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                      index === activePhotoIndex ? 'border-gold-500' : 'border-transparent'
                    )}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted leading-relaxed">{asset.description}</p>
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-display">Upcoming Bookings</CardTitle>
              <Link href={`/calendar?asset=${asset.id}`}>
                <Button variant="ghost" size="sm">
                  View Calendar
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {asset.upcomingBookings.length === 0 ? (
                <div className="p-6 text-center">
                  <Calendar className="w-8 h-8 text-muted mx-auto mb-2" />
                  <p className="text-muted">No upcoming bookings</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {asset.upcomingBookings.map((booking) => (
                    <div key={booking.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center">
                        <span className="text-gold-500 font-semibold">
                          {booking.userName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{booking.userName}</p>
                        <p className="text-xs text-muted">
                          {formatDate(booking.startDate)} • {booking.route}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                          booking.status === 'approved'
                            ? 'text-emerald-400 bg-emerald-400/10'
                            : 'text-amber-400 bg-amber-400/10'
                        )}
                      >
                        {booking.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Book */}
          <Card>
            <CardContent className="p-6">
              <Link href={`/calendar?asset=${asset.id}`}>
                <Button className="w-full" size="lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book This Asset
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                  <Users className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <p className="text-xs text-muted">Capacity</p>
                  <p className="text-sm font-medium text-white">{asset.capacity} passengers</p>
                </div>
              </div>

              {asset.section === 'planes' && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                      <Gauge className="w-5 h-5 text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Cruise Speed</p>
                      <p className="text-sm font-medium text-white">
                        {asset.details.cruiseSpeed}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Range</p>
                      <p className="text-sm font-medium text-white">{asset.details.range}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Turnaround Time</p>
                      <p className="text-sm font-medium text-white">
                        {asset.details.turnaroundMinutes} minutes
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Metadata */}
              <div className="pt-4 mt-4 border-t border-border space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Manufacturer</span>
                  <span className="text-white">{asset.details.manufacturer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Model</span>
                  <span className="text-white">{asset.details.model}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Year</span>
                  <span className="text-white">{asset.details.year}</span>
                </div>
                {asset.details.tailNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Tail Number</span>
                    <span className="text-white font-mono">{asset.details.tailNumber}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg bg-surface flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted" />
              </div>
              <p className="text-sm text-muted mt-3">{asset.location}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <Card className="relative max-w-md w-full animate-fade-up">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-display font-semibold text-white mb-2">
                Delete Asset?
              </h3>
              <p className="text-muted mb-6">
                Are you sure you want to delete "{asset.name}"? This action cannot be undone
                and will cancel all upcoming bookings.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1" onClick={handleDelete}>
                  Delete Asset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
