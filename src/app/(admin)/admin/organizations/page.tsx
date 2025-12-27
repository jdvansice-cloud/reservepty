'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Users,
  CreditCard,
  Plane,
  Ship,
  Home,
  Calendar,
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  Gift,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock organizations data
const mockOrganizations = [
  {
    id: '1',
    legalName: 'Luxury Holdings LLC',
    commercialName: 'Luxury Holdings',
    ruc: '155123456-1-2020',
    billingEmail: 'billing@luxuryholdings.com',
    status: 'active' as const,
    plan: 'Enterprise',
    billingCycle: 'yearly',
    seats: { used: 45, limit: 100 },
    sections: ['planes', 'helicopters', 'residences', 'boats'],
    mrr: 1200,
    createdAt: '2024-06-15',
    lastActive: '2025-01-15',
    owner: 'John Smith',
    ownerEmail: 'john@luxuryholdings.com',
  },
  {
    id: '2',
    legalName: 'Pacific Aviation Group Inc',
    commercialName: 'Pacific Aviation',
    ruc: '155234567-1-2021',
    billingEmail: 'accounts@pacificaviation.com',
    status: 'active' as const,
    plan: 'Professional',
    billingCycle: 'monthly',
    seats: { used: 12, limit: 25 },
    sections: ['planes', 'helicopters'],
    mrr: 599,
    createdAt: '2024-09-20',
    lastActive: '2025-01-14',
    owner: 'Sarah Chen',
    ownerEmail: 'sarah@pacificaviation.com',
  },
  {
    id: '3',
    legalName: 'Smith Family Office',
    commercialName: null,
    ruc: '155345678-1-2022',
    billingEmail: 'family@smithoffice.com',
    status: 'trial' as const,
    plan: 'Starter',
    billingCycle: 'monthly',
    seats: { used: 5, limit: 5 },
    sections: ['planes', 'residences'],
    mrr: 0,
    trialEndsAt: '2025-01-25',
    createdAt: '2025-01-11',
    lastActive: '2025-01-13',
    owner: 'Robert Smith',
    ownerEmail: 'robert@smithoffice.com',
  },
  {
    id: '4',
    legalName: 'Caribbean Charters Inc',
    commercialName: 'Caribbean Charters',
    ruc: '155456789-1-2023',
    billingEmail: 'finance@caribbeancharters.com',
    status: 'active' as const,
    plan: 'Professional',
    billingCycle: 'monthly',
    seats: { used: 18, limit: 25 },
    sections: ['boats'],
    mrr: 599,
    createdAt: '2024-11-05',
    lastActive: '2025-01-12',
    owner: 'Maria Rodriguez',
    ownerEmail: 'maria@caribbeancharters.com',
  },
  {
    id: '5',
    legalName: 'Alpine Retreats SA',
    commercialName: 'Alpine Retreats',
    ruc: '155567890-1-2024',
    billingEmail: 'info@alpineretreats.com',
    status: 'complimentary' as const,
    plan: 'Professional',
    billingCycle: 'yearly',
    seats: { used: 8, limit: 50 },
    sections: ['residences', 'helicopters'],
    mrr: 0,
    createdAt: '2024-12-01',
    lastActive: '2025-01-10',
    owner: 'Hans Mueller',
    ownerEmail: 'hans@alpineretreats.com',
  },
  {
    id: '6',
    legalName: 'Tech Ventures Corp',
    commercialName: 'Tech Ventures',
    ruc: '155678901-1-2024',
    billingEmail: 'payments@techventures.io',
    status: 'past_due' as const,
    plan: 'Professional',
    billingCycle: 'monthly',
    seats: { used: 15, limit: 25 },
    sections: ['planes', 'residences'],
    mrr: 599,
    createdAt: '2024-08-10',
    lastActive: '2025-01-05',
    owner: 'Alex Johnson',
    ownerEmail: 'alex@techventures.io',
  },
  {
    id: '7',
    legalName: 'Global Assets Management',
    commercialName: null,
    ruc: '155789012-1-2024',
    billingEmail: 'admin@globalassets.com',
    status: 'canceled' as const,
    plan: 'Starter',
    billingCycle: 'monthly',
    seats: { used: 0, limit: 5 },
    sections: ['planes'],
    mrr: 0,
    createdAt: '2024-07-01',
    lastActive: '2024-12-15',
    owner: 'Lisa Brown',
    ownerEmail: 'lisa@globalassets.com',
  },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  trial: { label: 'Trial', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  complimentary: { label: 'Complimentary', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Gift },
  past_due: { label: 'Past Due', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertCircle },
  canceled: { label: 'Canceled', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: XCircle },
};

const sectionIcons: Record<string, any> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  boats: Ship,
};

type FilterStatus = 'all' | 'active' | 'trial' | 'complimentary' | 'past_due' | 'canceled';

export default function AdminOrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const filteredOrgs = mockOrganizations.filter((org) => {
    const matchesSearch = 
      org.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.commercialName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      org.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.ruc.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockOrganizations.length,
    active: mockOrganizations.filter(o => o.status === 'active').length,
    trial: mockOrganizations.filter(o => o.status === 'trial').length,
    complimentary: mockOrganizations.filter(o => o.status === 'complimentary').length,
    pastDue: mockOrganizations.filter(o => o.status === 'past_due').length,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Organizations
          </h1>
          <p className="text-muted mt-1">
            Manage all organizations on the platform
          </p>
        </div>
        <Link href="/admin/organizations/new">
          <Button>
            <Plus className="w-4 h-4" />
            Add Organization
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-white">{stats.total}</p>
          <p className="text-sm text-muted">Total</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-emerald-400">{stats.active}</p>
          <p className="text-sm text-muted">Active</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-amber-400">{stats.trial}</p>
          <p className="text-sm text-muted">Trial</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-purple-400">{stats.complimentary}</p>
          <p className="text-sm text-muted">Complimentary</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-red-400">{stats.pastDue}</p>
          <p className="text-sm text-muted">Past Due</p>
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
              placeholder="Search by name, email, or RUC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'trial', 'complimentary', 'past_due', 'canceled'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'text-muted hover:text-white hover:bg-white/5'
                )}
              >
                {status === 'all' ? 'All' : status === 'past_due' ? 'Past Due' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Organizations list */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted">Organization</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Plan</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Sections</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Seats</th>
                <th className="text-left p-4 text-sm font-medium text-muted">MRR</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.map((org) => {
                const StatusIcon = statusConfig[org.status].icon;
                return (
                  <tr
                    key={org.id}
                    className="border-b border-border/50 hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">
                            {org.commercialName || org.legalName}
                          </p>
                          <p className="text-sm text-muted truncate">{org.ownerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                        statusConfig[org.status].color
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[org.status].label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white text-sm">{org.plan}</p>
                        <p className="text-xs text-muted capitalize">{org.billingCycle}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {org.sections.map((section) => {
                          const Icon = sectionIcons[section];
                          return (
                            <div
                              key={section}
                              className="w-6 h-6 rounded bg-navy-800 flex items-center justify-center"
                              title={section}
                            >
                              <Icon className="w-3.5 h-3.5 text-muted" />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-16 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-400 rounded-full"
                            style={{ width: `${(org.seats.used / org.seats.limit) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">
                          {org.seats.used}/{org.seats.limit}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white font-medium">
                        {org.mrr > 0 ? `$${org.mrr}` : '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/organizations/${org.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrg(selectedOrg === org.id ? null : org.id)}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                          {selectedOrg === org.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-navy-800 rounded-lg border border-border shadow-xl z-10">
                              <div className="py-1">
                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-navy-700 transition-colors">
                                  <ExternalLink className="w-4 h-4" />
                                  View as Org
                                </button>
                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-navy-700 transition-colors">
                                  <Gift className="w-4 h-4" />
                                  Grant Complimentary
                                </button>
                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-navy-700 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrgs.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No organizations found</h3>
            <p className="text-muted text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
