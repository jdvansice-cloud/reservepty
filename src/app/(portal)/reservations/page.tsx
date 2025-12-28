'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { cn, SECTIONS, formatDate } from '@/lib/utils';
import {
  Calendar,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronRight,
  X,
  User,
  Plane,
  Ship,
  Home,
  Navigation,
  History,
  Eye,
  ArrowRight,
} from 'lucide-react';

interface Reservation {
  id: string;
  organization_id: string;
  asset_id: string;
  user_id: string;
  title: string | null;
  start_datetime: string;
  end_datetime: string;
  status: 'pending' | 'approved' | 'rejected' | 'canceled';
  notes: string | null;
  guest_count: number | null;
  metadata: any;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
  canceled_at: string | null;
  asset?: {
    id: string;
    name: string;
    section: string;
  };
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  approver?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  created_at: string;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Navigation,
  residences: Home,
  watercraft: Ship,
};

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
  },
  canceled: {
    label: 'Canceled',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: Trash2,
  },
};

type FilterStatus = 'all' | 'active' | 'past' | 'canceled';

export default function ReservationsHistoryPage() {
  const { session, organization } = useAuth();
  const { toast } = useToast();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSection, setFilterSection] = useState<string>('all');

  // Detail modal state
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch all reservations
  useEffect(() => {
    const fetchReservations = async () => {
      if (!session?.access_token || !organization?.id) return;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${baseUrl}/rest/v1/reservations?organization_id=eq.${organization.id}&select=*,asset:assets(id,name,section),profile:profiles!reservations_user_id_fkey(id,first_name,last_name,email),approver:profiles!reservations_approved_by_fkey(id,first_name,last_name,email)&order=created_at.desc`,
          {
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Format data to handle array returns from joins
          const formatted = data.map((r: any) => ({
            ...r,
            asset: Array.isArray(r.asset) ? r.asset[0] : r.asset,
            profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
            approver: Array.isArray(r.approver) ? r.approver[0] : r.approver,
          }));
          setReservations(formatted);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast({ title: 'Error', description: 'Failed to load reservations', variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [session?.access_token, organization?.id]);

  // Fetch audit logs for a reservation
  const fetchAuditLogs = async (reservationId: string) => {
    if (!session?.access_token) return;

    setIsLoadingLogs(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/audit_logs?entity_type=eq.reservation&entity_id=eq.${reservationId}&select=*,profile:profiles!audit_logs_user_id_fkey(id,first_name,last_name,email)&order=created_at.desc`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const formatted = data.map((log: any) => ({
          ...log,
          profile: Array.isArray(log.profile) ? log.profile[0] : log.profile,
        }));
        setAuditLogs(formatted);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Open detail modal
  const openDetailModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    fetchAuditLogs(reservation.id);
  };

  // Filter reservations
  const filteredReservations = useMemo(() => {
    const now = new Date();

    return reservations.filter((r) => {
      // Search filter
      const matchesSearch = !searchQuery ||
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.asset?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Section filter
      const matchesSection = filterSection === 'all' || r.asset?.section === filterSection;

      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = (r.status === 'pending' || r.status === 'approved') && 
                        new Date(r.end_datetime) >= now;
      } else if (filterStatus === 'past') {
        matchesStatus = new Date(r.end_datetime) < now && r.status !== 'canceled';
      } else if (filterStatus === 'canceled') {
        matchesStatus = r.status === 'canceled' || r.status === 'rejected';
      }

      return matchesSearch && matchesSection && matchesStatus;
    });
  }, [reservations, searchQuery, filterSection, filterStatus]);

  // Get counts for filter badges
  const counts = useMemo(() => {
    const now = new Date();
    return {
      all: reservations.length,
      active: reservations.filter(r => 
        (r.status === 'pending' || r.status === 'approved') && 
        new Date(r.end_datetime) >= now
      ).length,
      past: reservations.filter(r => 
        new Date(r.end_datetime) < now && r.status !== 'canceled'
      ).length,
      canceled: reservations.filter(r => 
        r.status === 'canceled' || r.status === 'rejected'
      ).length,
    };
  }, [reservations]);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'approve': return 'Approved';
      case 'reject': return 'Rejected';
      case 'cancel': return 'Canceled';
      case 'delete': return 'Deleted';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'text-blue-400';
      case 'approve': return 'text-emerald-400';
      case 'reject': return 'text-red-400';
      case 'cancel': return 'text-gray-400';
      case 'delete': return 'text-red-400';
      default: return 'text-gold-400';
    }
  };

  const getUserName = (profile: any) => {
    if (!profile) return 'System';
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
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
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Reservation History</h1>
        <p className="text-muted mt-1">View and track all booking activity</p>
      </div>

      {/* Filters */}
      <Card className="bg-surface border-border">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search by title, asset, or member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-navy-800 border-border"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'past', 'canceled'] as FilterStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    filterStatus === status
                      ? 'bg-gold-500 text-navy-900'
                      : 'border-border text-muted hover:text-white'
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-xs">
                    {counts[status]}
                  </span>
                </Button>
              ))}
            </div>

            {/* Section Filter */}
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="px-3 py-2 bg-navy-800 border border-border rounded-lg text-white text-sm"
            >
              <option value="all">All Sections</option>
              {Object.entries(SECTIONS).map(([key, section]) => (
                <option key={key} value={key}>{section.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      <div className="space-y-3">
        {filteredReservations.map((reservation) => {
          const StatusIcon = STATUS_CONFIG[reservation.status]?.icon || AlertCircle;
          const SectionIcon = SECTION_ICONS[reservation.asset?.section || 'planes'] || Plane;
          const isPast = new Date(reservation.end_datetime) < new Date();

          return (
            <Card
              key={reservation.id}
              className={cn(
                "bg-surface border-border hover:border-gold-500/50 transition-colors cursor-pointer",
                isPast && reservation.status !== 'canceled' && "opacity-75"
              )}
              onClick={() => openDetailModal(reservation)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Section Icon */}
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    reservation.asset?.section === 'planes' && 'bg-gold-500/20',
                    reservation.asset?.section === 'helicopters' && 'bg-emerald-500/20',
                    reservation.asset?.section === 'residences' && 'bg-blue-500/20',
                    reservation.asset?.section === 'watercraft' && 'bg-purple-500/20',
                  )}>
                    <SectionIcon className={cn(
                      "w-5 h-5",
                      reservation.asset?.section === 'planes' && 'text-gold-400',
                      reservation.asset?.section === 'helicopters' && 'text-emerald-400',
                      reservation.asset?.section === 'residences' && 'text-blue-400',
                      reservation.asset?.section === 'watercraft' && 'text-purple-400',
                    )} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {reservation.title || reservation.asset?.name || 'Untitled Booking'}
                      </h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs border shrink-0",
                        STATUS_CONFIG[reservation.status]?.color
                      )}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {STATUS_CONFIG[reservation.status]?.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(reservation.start_datetime)}
                        <ArrowRight className="w-3 h-3" />
                        {formatDateTime(reservation.end_datetime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {getUserName(reservation.profile)}
                      </span>
                      {reservation.asset && (
                        <span>{reservation.asset.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Time ago & Arrow */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted">
                      {formatTimeAgo(reservation.updated_at || reservation.created_at)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredReservations.length === 0 && (
          <Card className="bg-surface border-border">
            <CardContent className="py-12 text-center">
              <History className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No reservations found</h3>
              <p className="text-muted">
                {searchQuery || filterStatus !== 'all' || filterSection !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Reservations will appear here once created'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedReservation(null)} />
          <Card className="relative z-10 w-full max-w-2xl bg-surface border-border max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-xl font-display">Reservation Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReservation(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto space-y-6">
              {/* Reservation Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted text-xs">Title</Label>
                  <p className="text-white">{selectedReservation.title || 'Untitled'}</p>
                </div>
                <div>
                  <Label className="text-muted text-xs">Status</Label>
                  <p className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border",
                    STATUS_CONFIG[selectedReservation.status]?.color
                  )}>
                    {STATUS_CONFIG[selectedReservation.status]?.label}
                  </p>
                </div>
                <div>
                  <Label className="text-muted text-xs">Asset</Label>
                  <p className="text-white">{selectedReservation.asset?.name}</p>
                </div>
                <div>
                  <Label className="text-muted text-xs">Section</Label>
                  <p className="text-white capitalize">{selectedReservation.asset?.section}</p>
                </div>
                <div>
                  <Label className="text-muted text-xs">Start</Label>
                  <p className="text-white">{formatDateTime(selectedReservation.start_datetime)}</p>
                </div>
                <div>
                  <Label className="text-muted text-xs">End</Label>
                  <p className="text-white">{formatDateTime(selectedReservation.end_datetime)}</p>
                </div>
                <div>
                  <Label className="text-muted text-xs">Requested By</Label>
                  <p className="text-white">{getUserName(selectedReservation.profile)}</p>
                </div>
                {selectedReservation.approved_by && (
                  <div>
                    <Label className="text-muted text-xs">
                      {selectedReservation.status === 'approved' ? 'Approved By' : 'Reviewed By'}
                    </Label>
                    <p className="text-white">{getUserName(selectedReservation.approver)}</p>
                  </div>
                )}
                {selectedReservation.guest_count && (
                  <div>
                    <Label className="text-muted text-xs">Guests</Label>
                    <p className="text-white">{selectedReservation.guest_count}</p>
                  </div>
                )}
                {selectedReservation.notes && (
                  <div className="col-span-2">
                    <Label className="text-muted text-xs">Notes</Label>
                    <p className="text-white">{selectedReservation.notes}</p>
                  </div>
                )}
                {selectedReservation.rejected_reason && (
                  <div className="col-span-2">
                    <Label className="text-muted text-xs">Rejection Reason</Label>
                    <p className="text-red-400">{selectedReservation.rejected_reason}</p>
                  </div>
                )}
              </div>

              {/* Flight Metadata (for aviation) */}
              {selectedReservation.metadata?.legs && (
                <div>
                  <Label className="text-muted text-xs mb-2 block">Flight Itinerary</Label>
                  <div className="space-y-2">
                    {selectedReservation.metadata.legs.map((leg: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm bg-navy-800 p-2 rounded">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-xs",
                          leg.type === 'customer' ? 'bg-gold-500/20 text-gold-400' : 'bg-gray-500/20 text-gray-400'
                        )}>
                          {leg.type === 'customer' ? 'PAX' : 'Empty'}
                        </span>
                        <span className="text-white">{leg.departure}</span>
                        <ArrowRight className="w-3 h-3 text-muted" />
                        <span className="text-white">{leg.arrival}</span>
                        <span className="text-muted ml-auto">{leg.distanceNm} nm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Change History */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-gold-400" />
                  <Label className="text-white">Change History</Label>
                </div>

                {isLoadingLogs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
                  </div>
                ) : auditLogs.length > 0 ? (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative pl-6 pb-3 border-l border-border last:pb-0">
                        <div className="absolute left-0 top-0 w-3 h-3 -translate-x-1.5 rounded-full bg-surface border-2 border-gold-500" />
                        
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={cn("font-medium", getActionColor(log.action))}>
                              {getActionLabel(log.action)}
                            </span>
                            <span className="text-muted"> by </span>
                            <span className="text-white">{getUserName(log.profile)}</span>
                          </div>
                          <span className="text-xs text-muted shrink-0">
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>

                        {/* Show changes */}
                        {log.old_values && log.new_values && (
                          <div className="mt-2 text-sm">
                            {Object.keys(log.new_values).map((key) => {
                              const oldVal = log.old_values[key];
                              const newVal = log.new_values[key];
                              if (oldVal === newVal) return null;
                              if (key === 'updated_at' || key === 'created_at') return null;
                              
                              return (
                                <div key={key} className="flex items-center gap-2 text-muted">
                                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                  {oldVal && (
                                    <>
                                      <span className="text-red-400/70 line-through">
                                        {typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)}
                                      </span>
                                      <ArrowRight className="w-3 h-3" />
                                    </>
                                  )}
                                  <span className="text-emerald-400">
                                    {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted">
                    <p>No change history recorded</p>
                    <p className="text-xs mt-1">Changes will be tracked going forward</p>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t border-border text-xs text-muted flex gap-4">
                <span>Created: {formatDateTime(selectedReservation.created_at)}</span>
                {selectedReservation.updated_at !== selectedReservation.created_at && (
                  <span>Updated: {formatDateTime(selectedReservation.updated_at)}</span>
                )}
                {selectedReservation.canceled_at && (
                  <span>Canceled: {formatDateTime(selectedReservation.canceled_at)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
