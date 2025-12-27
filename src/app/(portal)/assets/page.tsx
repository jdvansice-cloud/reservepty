'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, SECTIONS, isDevMode } from '@/lib/utils';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Plane,
  Ship,
  Home,
  MapPin,
  Users,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Sparkles,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  boats: Ship,
};

// Mock data for development
const mockAssets = [
  {
    id: '1',
    name: 'Gulfstream G650',
    section: 'planes',
    description: 'Long-range business jet with exceptional performance',
    primaryPhoto: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
    location: 'Miami International Airport (KMIA)',
    capacity: 19,
    status: 'available',
    details: {
      manufacturer: 'Gulfstream',
      model: 'G650',
      year: 2020,
      range: '7,000 nm',
      cruiseSpeed: '516 ktas',
    },
  },
  {
    id: '2',
    name: 'Bell 429',
    section: 'helicopters',
    description: 'Light twin-engine helicopter for VIP transport',
    primaryPhoto: 'https://images.unsplash.com/photo-1608236415053-3691791bbffe?w=800',
    location: 'Downtown Manhattan Heliport',
    capacity: 7,
    status: 'available',
    details: {
      manufacturer: 'Bell',
      model: '429',
      year: 2021,
    },
  },
  {
    id: '3',
    name: 'Miami Beach Villa',
    section: 'residences',
    description: 'Oceanfront luxury villa with private beach access',
    primaryPhoto: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    location: 'Miami Beach, FL',
    capacity: 12,
    status: 'booked',
    details: {
      bedrooms: 6,
      bathrooms: 8,
      sqft: 12000,
      amenities: ['Pool', 'Beach', 'Gym', 'Theater'],
    },
  },
  {
    id: '4',
    name: 'Azimut 72',
    section: 'boats',
    description: 'Italian luxury motor yacht for Mediterranean cruising',
    primaryPhoto: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
    location: 'Port de Monaco',
    capacity: 8,
    status: 'available',
    details: {
      manufacturer: 'Azimut',
      model: '72',
      year: 2022,
      length: '72 ft',
    },
  },
  {
    id: '5',
    name: 'Citation Latitude',
    section: 'planes',
    description: 'Midsize business jet with stand-up cabin',
    primaryPhoto: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800',
    location: 'Teterboro Airport (KTEB)',
    capacity: 9,
    status: 'maintenance',
    details: {
      manufacturer: 'Cessna',
      model: 'Citation Latitude',
      year: 2019,
    },
  },
  {
    id: '6',
    name: 'Aspen Mountain Lodge',
    section: 'residences',
    description: 'Ski-in/ski-out luxury chalet with stunning views',
    primaryPhoto: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
    location: 'Aspen, CO',
    capacity: 16,
    status: 'available',
    details: {
      bedrooms: 8,
      bathrooms: 10,
      sqft: 15000,
      amenities: ['Hot Tub', 'Wine Cellar', 'Home Theater'],
    },
  },
];

export default function AssetsPage() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get('section') || 'all';
  
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState(initialSection);
  const [showActions, setShowActions] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    return mockAssets.filter((asset) => {
      const matchesSection = activeSection === 'all' || asset.section === activeSection;
      const matchesSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.description.toLowerCase().includes(search.toLowerCase()) ||
        asset.location.toLowerCase().includes(search.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [activeSection, search]);

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Assets</h1>
          <p className="text-muted mt-1">Manage your fleet and properties</p>
        </div>
        <div className="flex items-center gap-3">
          {isDevMode() && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Demo</span>
            </div>
          )}
          <Link href="/assets/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveSection('all')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
              activeSection === 'all'
                ? 'bg-gold-500 text-navy-950'
                : 'text-muted hover:text-white hover:bg-white/5'
            )}
          >
            All
          </button>
          {Object.entries(SECTIONS).map(([key, section]) => {
            const Icon = SECTION_ICONS[key];
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                  activeSection === key
                    ? 'bg-gold-500 text-navy-950'
                    : 'text-muted hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface mx-auto flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-display font-semibold text-white mb-2">
              No assets found
            </h3>
            <p className="text-muted max-w-md mx-auto">
              {search
                ? `No assets match "${search}". Try a different search term.`
                : 'Get started by adding your first asset.'}
            </p>
            {!search && (
              <Link href="/assets/new">
                <Button className="mt-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Asset
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const Icon = SECTION_ICONS[asset.section];
            const sectionInfo = SECTIONS[asset.section as keyof typeof SECTIONS];
            return (
              <Card key={asset.id} className="card-hover overflow-hidden group">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={asset.primaryPhoto}
                    alt={asset.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />
                  
                  {/* Section Badge */}
                  <div
                    className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${sectionInfo?.color}20`,
                      color: sectionInfo?.color,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {sectionInfo?.label}
                  </div>

                  {/* Status Badge */}
                  <div
                    className={cn(
                      'absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium border capitalize',
                      getStatusColor(asset.status)
                    )}
                  >
                    {asset.status}
                  </div>

                  {/* Actions */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/assets/${asset.id}`}>
                      <button className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link href={`/assets/${asset.id}/edit`}>
                      <button className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5">
                  <h3 className="font-display font-semibold text-white text-lg group-hover:text-gold-500 transition-colors">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-muted mt-1 line-clamp-2">
                    {asset.description}
                  </p>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-muted">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate max-w-[120px]">{asset.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{asset.capacity}</span>
                    </div>
                  </div>

                  <Link href={`/calendar?asset=${asset.id}`}>
                    <Button variant="secondary" size="sm" className="w-full mt-4">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
