'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, SECTIONS } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';
import {
  Plus,
  Search,
  Filter,
  Plane,
  Ship,
  Home,
  MapPin,
  Users,
  Calendar,
  Edit,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  watercraft: Ship,
};

interface Asset {
  id: string;
  name: string;
  section: string;
  description: string | null;
  primary_photo_url: string | null;
  details: {
    location?: string;
    capacity?: number;
    manufacturer?: string;
    model?: string;
    [key: string]: any;
  };
  is_active: boolean;
  current_location: {
    name?: string;
    [key: string]: any;
  } | null;
}

export default function AssetsPage() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get('section') || 'all';
  const { organization, session } = useAuth();
  
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState(initialSection);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!organization?.id || !session?.access_token) {
        setIsLoading(false);
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${baseUrl}/rest/v1/assets?organization_id=eq.${organization.id}&is_active=eq.true&select=*&order=created_at.desc`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }

        const data = await response.json();
        setAssets(data);
      } catch (err: any) {
        console.error('Error fetching assets:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [organization?.id, session?.access_token]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSection = activeSection === 'all' || asset.section === activeSection;
      const matchesSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        (asset.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (asset.details?.location || '').toLowerCase().includes(search.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [assets, activeSection, search]);

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      : 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  };

  const getAssetLocation = (asset: Asset) => {
    return asset.current_location?.name || asset.details?.location || asset.details?.homeAirport || asset.details?.homePort || asset.details?.city || 'Location not set';
  };

  const getAssetCapacity = (asset: Asset) => {
    return asset.details?.capacity || asset.details?.passengerCapacity || asset.details?.maxGuests || asset.details?.cabins || '-';
  };

  const getAssetSubtitle = (asset: Asset) => {
    const parts = [];
    if (asset.details?.manufacturer) parts.push(asset.details.manufacturer);
    if (asset.details?.model) parts.push(asset.details.model);
    if (asset.details?.tailNumber) parts.push(`(${asset.details.tailNumber})`);
    if (asset.details?.year) parts.push(asset.details.year);
    return parts.length > 0 ? parts.join(' ') : null;
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Assets</h1>
          <p className="text-muted mt-1">Manage your fleet and properties</p>
        </div>
        <Link href="/assets/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/10">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

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
                : activeSection !== 'all'
                ? `No ${SECTIONS[activeSection as keyof typeof SECTIONS]?.label.toLowerCase()} added yet.`
                : 'Get started by adding your first asset.'}
            </p>
            {!search && (
              <Link href={activeSection !== 'all' ? `/assets/new?section=${activeSection}` : '/assets/new'}>
                <Button className="mt-6">
                  <Plus className="w-4 h-4 mr-2" />
                  {activeSection !== 'all' 
                    ? `Add ${SECTIONS[activeSection as keyof typeof SECTIONS]?.label.slice(0, -1)}`
                    : 'Add Your First Asset'}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const Icon = SECTION_ICONS[asset.section] || Plane;
            const sectionInfo = SECTIONS[asset.section as keyof typeof SECTIONS];
            return (
              <Card key={asset.id} className="card-hover overflow-hidden group">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                  {asset.primary_photo_url ? (
                    <img
                      src={asset.primary_photo_url}
                      alt={asset.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-16 h-16 text-muted" />
                    </div>
                  )}
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
                      getStatusColor(asset.is_active)
                    )}
                  >
                    {asset.is_active ? 'Active' : 'Inactive'}
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
                  {getAssetSubtitle(asset) && (
                    <p className="text-sm text-gold-500/80 mt-0.5">
                      {getAssetSubtitle(asset)}
                    </p>
                  )}
                  <p className="text-sm text-muted mt-1 line-clamp-2">
                    {asset.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-muted">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate max-w-[120px]">{getAssetLocation(asset)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{getAssetCapacity(asset)}</span>
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
