'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Gift,
  Search,
  Plus,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Plane,
  Ship,
  Home,
  Users,
  Infinity,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock complimentary memberships data
const mockComplimentary = [
  {
    id: '1',
    organizationId: '5',
    organizationName: 'Alpine Retreats SA',
    owner: 'Hans Mueller',
    ownerEmail: 'hans@alpineretreats.com',
    sections: ['residences', 'helicopters'],
    seats: 50,
    reason: 'Strategic partnership for marketing collaboration',
    grantedBy: 'Admin User',
    grantedAt: '2024-12-01',
    expiresAt: null, // Never expires
    status: 'active' as const,
  },
  {
    id: '2',
    organizationId: '8',
    organizationName: 'Aviation Press Weekly',
    owner: 'Jennifer Adams',
    ownerEmail: 'jennifer@aviationpress.com',
    sections: ['planes', 'helicopters'],
    seats: 10,
    reason: 'Media partner - industry publication',
    grantedBy: 'Admin User',
    grantedAt: '2024-11-15',
    expiresAt: '2025-11-15',
    status: 'active' as const,
  },
  {
    id: '3',
    organizationId: '9',
    organizationName: 'Luxury Travel Advisors',
    owner: 'Michael Scott',
    ownerEmail: 'michael@luxuryadvisors.com',
    sections: ['planes', 'helicopters', 'residences', 'boats'],
    seats: 25,
    reason: 'Referral partner program - top performer',
    grantedBy: 'Super Admin',
    grantedAt: '2025-01-01',
    expiresAt: '2026-01-01',
    status: 'active' as const,
  },
  {
    id: '4',
    organizationId: '10',
    organizationName: 'Demo Company Inc',
    owner: 'Test User',
    ownerEmail: 'test@demo.com',
    sections: ['planes', 'residences'],
    seats: 5,
    reason: 'Demo account for sales presentations',
    grantedBy: 'Admin User',
    grantedAt: '2024-10-01',
    expiresAt: '2024-12-31',
    status: 'expired' as const,
  },
  {
    id: '5',
    organizationId: '11',
    organizationName: 'Old Partner LLC',
    owner: 'Former Partner',
    ownerEmail: 'partner@oldpartner.com',
    sections: ['boats'],
    seats: 10,
    reason: 'Partnership that was terminated',
    grantedBy: 'Super Admin',
    grantedAt: '2024-06-01',
    expiresAt: null,
    status: 'revoked' as const,
    revokedAt: '2024-09-15',
    revokedBy: 'Admin User',
    revokedReason: 'Partnership terminated',
  },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  expired: { label: 'Expired', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  revoked: { label: 'Revoked', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
};

const sectionIcons: Record<string, any> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  boats: Ship,
};

type FilterStatus = 'all' | 'active' | 'expired' | 'revoked';

export default function AdminComplimentaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState<string | null>(null);

  const filteredMemberships = mockComplimentary.filter((membership) => {
    const matchesSearch = 
      membership.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      membership.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      membership.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || membership.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockComplimentary.length,
    active: mockComplimentary.filter(m => m.status === 'active').length,
    expired: mockComplimentary.filter(m => m.status === 'expired').length,
    revoked: mockComplimentary.filter(m => m.status === 'revoked').length,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Complimentary Access
          </h1>
          <p className="text-muted mt-1">
            Manage free memberships for partners and special cases
          </p>
        </div>
        <Button onClick={() => setShowGrantModal(true)}>
          <Plus className="w-4 h-4" />
          Grant Access
        </Button>
      </div>

      {/* Info banner */}
      <div className="card p-4 border-purple-500/20 bg-purple-500/5">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-white">About Complimentary Access</h3>
            <p className="text-sm text-muted mt-1">
              Complimentary memberships bypass payment requirements. Use for strategic partners, 
              media contacts, demo accounts, and special circumstances. All access is logged for audit purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-white">{stats.total}</p>
          <p className="text-sm text-muted">Total Granted</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-emerald-400">{stats.active}</p>
          <p className="text-sm text-muted">Active</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-amber-400">{stats.expired}</p>
          <p className="text-sm text-muted">Expired</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-red-400">{stats.revoked}</p>
          <p className="text-sm text-muted">Revoked</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by organization, email, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'expired', 'revoked'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'text-muted hover:text-white hover:bg-white/5'
                )}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Complimentary list */}
      <div className="space-y-4">
        {filteredMemberships.map((membership) => {
          const StatusIcon = statusConfig[membership.status].icon;
          return (
            <div
              key={membership.id}
              className={cn(
                'card p-6 transition-colors',
                membership.status === 'active' && 'border-purple-500/20 hover:border-purple-500/30'
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Organization info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Link 
                          href={`/admin/organizations/${membership.organizationId}`}
                          className="font-display text-lg font-semibold text-white hover:text-purple-400 transition-colors"
                        >
                          {membership.organizationName}
                        </Link>
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          statusConfig[membership.status].color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[membership.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-muted mb-3">
                        {membership.owner} • {membership.ownerEmail}
                      </p>
                      <p className="text-sm text-white/80 mb-4">
                        <span className="text-muted">Reason:</span> {membership.reason}
                      </p>

                      {/* Sections */}
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm text-muted">Sections:</span>
                        <div className="flex items-center gap-2">
                          {membership.sections.map((section) => {
                            const Icon = sectionIcons[section];
                            return (
                              <div
                                key={section}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-navy-800 text-xs"
                              >
                                <Icon className="w-3.5 h-3.5 text-muted" />
                                <span className="text-white capitalize">{section}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{membership.seats} seats</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Granted {new Date(membership.grantedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {membership.expiresAt ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Expires {new Date(membership.expiresAt).toLocaleDateString()}</span>
                            </>
                          ) : (
                            <>
                              <Infinity className="w-3.5 h-3.5" />
                              <span>Never expires</span>
                            </>
                          )}
                        </div>
                        <span>by {membership.grantedBy}</span>
                      </div>

                      {/* Revoked info */}
                      {membership.status === 'revoked' && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-400">
                            Revoked on {new Date(membership.revokedAt!).toLocaleDateString()} by {membership.revokedBy}
                          </p>
                          <p className="text-xs text-red-400/70 mt-1">
                            Reason: {membership.revokedReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {membership.status === 'active' && (
                  <div className="flex items-center gap-2 lg:flex-col">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => setShowRevokeModal(membership.id)}
                    >
                      <XCircle className="w-4 h-4" />
                      Revoke
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredMemberships.length === 0 && (
          <div className="card p-12 text-center">
            <Gift className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No complimentary memberships found</h3>
            <p className="text-muted text-sm mb-4">
              {statusFilter === 'all' 
                ? 'Grant access to organizations that need complimentary memberships'
                : 'Try adjusting your filters'
              }
            </p>
            {statusFilter === 'all' && (
              <Button onClick={() => setShowGrantModal(true)}>
                <Plus className="w-4 h-4" />
                Grant Access
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGrantModal(false)} />
          <div className="relative bg-navy-900 rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-white">
                  Grant Complimentary Access
                </h2>
                <button
                  onClick={() => setShowGrantModal(false)}
                  className="p-2 text-muted hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Organization</label>
                <select className="input w-full">
                  <option value="">Select an organization...</option>
                  <option value="new">+ Create new organization</option>
                </select>
                <p className="text-xs text-muted">Select an existing organization or create a new one</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Sections</label>
                <div className="grid grid-cols-2 gap-2">
                  {['planes', 'helicopters', 'residences', 'boats'].map((section) => {
                    const Icon = sectionIcons[section];
                    return (
                      <label
                        key={section}
                        className="flex items-center gap-3 p-3 rounded-lg bg-navy-800 border border-border cursor-pointer hover:border-purple-500/30 transition-colors"
                      >
                        <input type="checkbox" className="rounded border-border" />
                        <Icon className="w-4 h-4 text-muted" />
                        <span className="text-white text-sm capitalize">{section}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Seat Limit</label>
                <select className="input w-full">
                  <option value="5">5 seats</option>
                  <option value="10">10 seats</option>
                  <option value="25">25 seats</option>
                  <option value="50">50 seats</option>
                  <option value="100">100 seats</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Expiration</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="expiration" value="never" defaultChecked className="text-purple-500" />
                    <span className="text-white text-sm">Never expires</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="expiration" value="date" className="text-purple-500" />
                    <span className="text-white text-sm">Set date</span>
                  </label>
                </div>
                <input type="date" className="input w-full" disabled />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Reason *</label>
                <textarea
                  className="input w-full resize-none"
                  rows={3}
                  placeholder="Explain why this organization should receive complimentary access..."
                  required
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowGrantModal(false)}>
                Cancel
              </Button>
              <Button className="bg-purple-500 hover:bg-purple-600">
                <Gift className="w-4 h-4" />
                Grant Access
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRevokeModal(null)} />
          <div className="relative bg-navy-900 rounded-2xl border border-border w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white text-center mb-2">
                Revoke Access?
              </h2>
              <p className="text-muted text-center mb-6">
                This will immediately remove complimentary access for this organization. 
                They will need to set up payment to continue using the platform.
              </p>
              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-white">Reason for revocation</label>
                <textarea
                  className="input w-full resize-none"
                  rows={2}
                  placeholder="Enter reason..."
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowRevokeModal(null)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600">
                  Revoke Access
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
