'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Users,
  CreditCard,
  Calendar,
  Plane,
  Ship,
  Home,
  Edit,
  Trash2,
  Gift,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Activity,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock organization data (would be fetched by ID in real app)
const mockOrganization = {
  id: '1',
  legalName: 'Luxury Holdings LLC',
  commercialName: 'Luxury Holdings',
  ruc: '155123456-1-2020',
  dv: '45',
  billingEmail: 'billing@luxuryholdings.com',
  logoUrl: null,
  status: 'active' as const,
  plan: 'Enterprise',
  billingCycle: 'yearly',
  seats: { used: 45, limit: 100 },
  sections: ['planes', 'helicopters', 'residences', 'watercraft'],
  mrr: 1200,
  createdAt: '2024-06-15',
  lastActive: '2025-01-15',
  owner: {
    id: '1',
    name: 'John Smith',
    email: 'john@luxuryholdings.com',
    phone: '+1 555-123-4567',
  },
  subscription: {
    status: 'active',
    currentPeriodStart: '2025-01-01',
    currentPeriodEnd: '2025-12-31',
    trialEndsAt: null,
  },
  stats: {
    totalBookings: 234,
    bookingsThisMonth: 18,
    totalAssets: 12,
    activeTiers: 4,
  },
};

const mockMembers = [
  { id: '1', name: 'John Smith', email: 'john@luxuryholdings.com', role: 'owner', tier: 'Principals', lastActive: '2 hours ago' },
  { id: '2', name: 'James Wilson', email: 'james@luxuryholdings.com', role: 'admin', tier: 'Principals', lastActive: '5 hours ago' },
  { id: '3', name: 'Emily Johnson', email: 'emily@luxuryholdings.com', role: 'manager', tier: 'Family', lastActive: '1 day ago' },
  { id: '4', name: 'Sarah Davis', email: 'sarah@luxuryholdings.com', role: 'member', tier: 'Family', lastActive: '2 days ago' },
  { id: '5', name: 'Michael Brown', email: 'michael@luxuryholdings.com', role: 'member', tier: 'Staff', lastActive: '3 days ago' },
];

const mockAssets = [
  { id: '1', name: 'Gulfstream G650', section: 'planes', status: 'available', bookings: 45 },
  { id: '2', name: 'Bell 429', section: 'helicopters', status: 'available', bookings: 23 },
  { id: '3', name: 'Miami Beach Villa', section: 'residences', status: 'booked', bookings: 67 },
  { id: '4', name: 'Aspen Chalet', section: 'residences', status: 'available', bookings: 34 },
  { id: '5', name: 'Princess 85', section: 'watercraft', status: 'maintenance', bookings: 28 },
];

const mockActivity = [
  { id: '1', action: 'Booking created', description: 'John Smith booked Miami Beach Villa', time: '2 hours ago' },
  { id: '2', action: 'Member invited', description: 'James Wilson invited new member', time: '1 day ago' },
  { id: '3', action: 'Asset updated', description: 'Gulfstream G650 details updated', time: '2 days ago' },
  { id: '4', action: 'Tier modified', description: 'Staff tier rules updated', time: '3 days ago' },
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
  watercraft: Ship,
};

const roleColors: Record<string, string> = {
  owner: 'bg-red-500/10 text-red-400 border-red-500/20',
  admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  member: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  viewer: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function AdminOrganizationDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'assets' | 'activity'>('overview');
  
  const org = mockOrganization;
  const StatusIcon = statusConfig[org.status].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/organizations"
          className="flex items-center gap-2 text-muted hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizations
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.commercialName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-8 h-8 text-red-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display text-2xl font-semibold text-white">
                  {org.commercialName || org.legalName}
                </h1>
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                  statusConfig[org.status].color
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[org.status].label}
                </span>
              </div>
              <p className="text-muted">{org.legalName}</p>
              <p className="text-sm text-muted mt-1">RUC: {org.ruc} • DV: {org.dv}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4" />
              Login as Org
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['overview', 'members', 'assets', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-red-400 text-red-400'
                : 'border-transparent text-muted hover:text-white'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-muted" />
                  <span className="text-xs text-muted">Bookings</span>
                </div>
                <p className="text-2xl font-display font-semibold text-white">{org.stats.totalBookings}</p>
                <p className="text-xs text-emerald-400">+{org.stats.bookingsThisMonth} this month</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="w-4 h-4 text-muted" />
                  <span className="text-xs text-muted">Assets</span>
                </div>
                <p className="text-2xl font-display font-semibold text-white">{org.stats.totalAssets}</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted" />
                  <span className="text-xs text-muted">Members</span>
                </div>
                <p className="text-2xl font-display font-semibold text-white">{org.seats.used}</p>
                <p className="text-xs text-muted">of {org.seats.limit} seats</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-muted" />
                  <span className="text-xs text-muted">MRR</span>
                </div>
                <p className="text-2xl font-display font-semibold text-white">${org.mrr}</p>
              </div>
            </div>

            {/* Subscription */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-white mb-4">Subscription</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Plan</span>
                  <span className="text-white font-medium">{org.plan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Billing Cycle</span>
                  <span className="text-white capitalize">{org.billingCycle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Current Period</span>
                  <span className="text-white">
                    {new Date(org.subscription.currentPeriodStart).toLocaleDateString()} - {new Date(org.subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Seats Usage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-navy-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${(org.seats.used / org.seats.limit) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm">{org.seats.used}/{org.seats.limit}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Active Sections</span>
                  <div className="flex items-center gap-1">
                    {org.sections.map((section) => {
                      const Icon = sectionIcons[section];
                      return (
                        <div
                          key={section}
                          className="w-7 h-7 rounded bg-navy-800 flex items-center justify-center"
                          title={section}
                        >
                          <Icon className="w-4 h-4 text-muted" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {mockActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-navy-800/50">
                    <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.action}</p>
                      <p className="text-xs text-muted">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Owner Info */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-white mb-4">Owner</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-red-400 font-semibold text-lg">
                    {org.owner.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{org.owner.name}</p>
                  <p className="text-sm text-muted">Organization Owner</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted" />
                  <span className="text-white">{org.owner.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted" />
                  <span className="text-white">{org.owner.phone}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Mail className="w-4 h-4" />
                Contact Owner
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Gift className="w-4 h-4" />
                  Grant Complimentary
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CreditCard className="w-4 h-4" />
                  Manage Subscription
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="w-4 h-4" />
                  Adjust Seat Limit
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10">
                  <XCircle className="w-4 h-4" />
                  Suspend Organization
                </Button>
              </div>
            </div>

            {/* Dates */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-white mb-4">Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Created</span>
                  <span className="text-white">{new Date(org.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Last Active</span>
                  <span className="text-white">{new Date(org.lastActive).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Billing Email</span>
                  <span className="text-white truncate ml-4">{org.billingEmail}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted">Member</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Role</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Tier</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Last Active</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockMembers.map((member) => (
                <tr key={member.id} className="border-b border-border/50 hover:bg-navy-800/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-sm text-muted">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
                      roleColors[member.role]
                    )}>
                      {member.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{member.tier}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-muted text-sm">{member.lastActive}</span>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted">Asset</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Section</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Bookings</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockAssets.map((asset) => {
                const Icon = sectionIcons[asset.section];
                return (
                  <tr key={asset.id} className="border-b border-border/50 hover:bg-navy-800/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-muted" />
                        </div>
                        <span className="text-white font-medium">{asset.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-muted capitalize">{asset.section}</span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
                        asset.status === 'available' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        asset.status === 'booked' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        asset.status === 'maintenance' && 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      )}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{asset.bookings}</span>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card p-6">
          <div className="space-y-4">
            {[...mockActivity, ...mockActivity].map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-navy-800/50">
                <div className="w-10 h-10 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-muted" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-sm text-muted mt-1">{activity.description}</p>
                </div>
                <span className="text-sm text-muted whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
