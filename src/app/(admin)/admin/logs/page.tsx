'use client';

import { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Building2,
  Users,
  CreditCard,
  Gift,
  Settings,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock activity logs data
const mockLogs = [
  {
    id: '1',
    type: 'org_created' as const,
    action: 'Organization Created',
    description: 'New organization "Luxury Holdings LLC" was registered',
    actor: 'System',
    actorType: 'system' as const,
    resource: 'Luxury Holdings LLC',
    resourceType: 'organization' as const,
    timestamp: '2025-01-15T14:30:00Z',
    metadata: { plan: 'Enterprise', seats: 100 },
  },
  {
    id: '2',
    type: 'subscription_upgraded' as const,
    action: 'Subscription Upgraded',
    description: 'Pacific Aviation Group upgraded from Starter to Professional',
    actor: 'sarah@pacificaviation.com',
    actorType: 'user' as const,
    resource: 'Pacific Aviation Group',
    resourceType: 'subscription' as const,
    timestamp: '2025-01-15T12:15:00Z',
    metadata: { from: 'Starter', to: 'Professional' },
  },
  {
    id: '3',
    type: 'complimentary_granted' as const,
    action: 'Complimentary Access Granted',
    description: 'Admin granted complimentary access to Alpine Retreats SA',
    actor: 'admin@reservepty.com',
    actorType: 'admin' as const,
    resource: 'Alpine Retreats SA',
    resourceType: 'complimentary' as const,
    timestamp: '2025-01-15T10:00:00Z',
    metadata: { sections: ['residences', 'helicopters'], seats: 50 },
  },
  {
    id: '4',
    type: 'user_invited' as const,
    action: 'User Invited',
    description: 'john@luxuryholdings.com invited james@luxuryholdings.com',
    actor: 'john@luxuryholdings.com',
    actorType: 'user' as const,
    resource: 'james@luxuryholdings.com',
    resourceType: 'user' as const,
    timestamp: '2025-01-14T16:45:00Z',
    metadata: { role: 'admin', organization: 'Luxury Holdings LLC' },
  },
  {
    id: '5',
    type: 'asset_created' as const,
    action: 'Asset Created',
    description: 'New plane "Gulfstream G650" added to Pacific Aviation Group',
    actor: 'sarah@pacificaviation.com',
    actorType: 'user' as const,
    resource: 'Gulfstream G650',
    resourceType: 'asset' as const,
    timestamp: '2025-01-14T14:20:00Z',
    metadata: { section: 'planes', tailNumber: 'N123PA' },
  },
  {
    id: '6',
    type: 'booking_approved' as const,
    action: 'Booking Approved',
    description: 'Manager approved booking request for Miami Beach Villa',
    actor: 'emily@luxuryholdings.com',
    actorType: 'user' as const,
    resource: 'Miami Beach Villa',
    resourceType: 'booking' as const,
    timestamp: '2025-01-14T11:30:00Z',
    metadata: { dates: 'Jan 20-25, 2025', bookedBy: 'james@luxuryholdings.com' },
  },
  {
    id: '7',
    type: 'admin_login' as const,
    action: 'Admin Login',
    description: 'Platform admin logged in',
    actor: 'admin@reservepty.com',
    actorType: 'admin' as const,
    resource: 'Admin Portal',
    resourceType: 'system' as const,
    timestamp: '2025-01-14T09:00:00Z',
    metadata: { ip: '192.168.1.1' },
  },
  {
    id: '8',
    type: 'payment_failed' as const,
    action: 'Payment Failed',
    description: 'Subscription payment failed for Tech Ventures Corp',
    actor: 'System',
    actorType: 'system' as const,
    resource: 'Tech Ventures Corp',
    resourceType: 'payment' as const,
    timestamp: '2025-01-13T08:00:00Z',
    metadata: { amount: 599, reason: 'Card declined' },
  },
  {
    id: '9',
    type: 'org_settings_updated' as const,
    action: 'Organization Settings Updated',
    description: 'Billing email updated for Caribbean Charters Inc',
    actor: 'maria@caribbeancharters.com',
    actorType: 'user' as const,
    resource: 'Caribbean Charters Inc',
    resourceType: 'organization' as const,
    timestamp: '2025-01-12T15:45:00Z',
    metadata: { field: 'billing_email' },
  },
  {
    id: '10',
    type: 'subscription_canceled' as const,
    action: 'Subscription Canceled',
    description: 'Global Assets Management canceled their subscription',
    actor: 'lisa@globalassets.com',
    actorType: 'user' as const,
    resource: 'Global Assets Management',
    resourceType: 'subscription' as const,
    timestamp: '2025-01-10T12:00:00Z',
    metadata: { reason: 'Not using the service' },
  },
];

const typeConfig: Record<string, { icon: any; color: string }> = {
  org_created: { icon: Building2, color: 'text-emerald-400 bg-emerald-500/10' },
  subscription_upgraded: { icon: CreditCard, color: 'text-blue-400 bg-blue-500/10' },
  subscription_canceled: { icon: XCircle, color: 'text-red-400 bg-red-500/10' },
  complimentary_granted: { icon: Gift, color: 'text-purple-400 bg-purple-500/10' },
  user_invited: { icon: Users, color: 'text-cyan-400 bg-cyan-500/10' },
  asset_created: { icon: Plus, color: 'text-emerald-400 bg-emerald-500/10' },
  booking_approved: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10' },
  admin_login: { icon: LogIn, color: 'text-amber-400 bg-amber-500/10' },
  payment_failed: { icon: AlertCircle, color: 'text-red-400 bg-red-500/10' },
  org_settings_updated: { icon: Settings, color: 'text-blue-400 bg-blue-500/10' },
};

const actorTypeColors = {
  admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  user: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  system: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

type FilterType = 'all' | 'organization' | 'subscription' | 'user' | 'asset' | 'booking' | 'admin';

export default function AdminLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || log.resourceType === typeFilter || 
      (typeFilter === 'admin' && log.actorType === 'admin');

    return matchesSearch && matchesType;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Activity Logs
          </h1>
          <p className="text-muted mt-1">
            Monitor all platform activity and audit trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'organization', 'subscription', 'user', 'booking', 'admin'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  typeFilter === type
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'text-muted hover:text-white hover:bg-white/5'
                )}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex gap-2">
            {(['today', 'week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  dateRange === range
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-muted hover:text-white hover:bg-white/5'
                )}
              >
                {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity log list */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-border/50">
          {filteredLogs.map((log) => {
            const typeStyle = typeConfig[log.type] || { icon: FileText, color: 'text-muted bg-navy-800' };
            const Icon = typeStyle.icon;
            
            return (
              <div
                key={log.id}
                className="p-4 hover:bg-navy-800/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    typeStyle.color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{log.action}</h3>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border w-fit',
                        actorTypeColors[log.actorType]
                      )}>
                        {log.actorType}
                      </span>
                    </div>
                    <p className="text-sm text-muted mb-2">{log.description}</p>
                    
                    {/* Metadata */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-navy-800 text-xs text-muted"
                          >
                            {key}: <span className="text-white ml-1">{String(value)}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>by {log.actor}</span>
                      <span>•</span>
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No activity logs found</h3>
            <p className="text-muted text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Load more */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-border text-center">
            <Button variant="ghost">
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
