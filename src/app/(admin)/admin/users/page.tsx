'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  Mail,
  Calendar,
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  Shield,
  User,
  UserCheck,
  Clock,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock users data
const mockUsers = [
  {
    id: '1',
    email: 'john@luxuryholdings.com',
    firstName: 'John',
    lastName: 'Smith',
    organizationId: '1',
    organizationName: 'Luxury Holdings LLC',
    role: 'owner' as const,
    status: 'active' as const,
    createdAt: '2024-06-15',
    lastActive: '2025-01-15T14:30:00',
    bookingsCount: 45,
  },
  {
    id: '2',
    email: 'sarah@pacificaviation.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    organizationId: '2',
    organizationName: 'Pacific Aviation Group',
    role: 'owner' as const,
    status: 'active' as const,
    createdAt: '2024-09-20',
    lastActive: '2025-01-14T10:15:00',
    bookingsCount: 23,
  },
  {
    id: '3',
    email: 'robert@smithoffice.com',
    firstName: 'Robert',
    lastName: 'Smith',
    organizationId: '3',
    organizationName: 'Smith Family Office',
    role: 'owner' as const,
    status: 'active' as const,
    createdAt: '2025-01-11',
    lastActive: '2025-01-13T16:45:00',
    bookingsCount: 3,
  },
  {
    id: '4',
    email: 'maria@caribbeancharters.com',
    firstName: 'Maria',
    lastName: 'Rodriguez',
    organizationId: '4',
    organizationName: 'Caribbean Charters Inc',
    role: 'owner' as const,
    status: 'active' as const,
    createdAt: '2024-11-05',
    lastActive: '2025-01-12T09:20:00',
    bookingsCount: 67,
  },
  {
    id: '5',
    email: 'james@luxuryholdings.com',
    firstName: 'James',
    lastName: 'Wilson',
    organizationId: '1',
    organizationName: 'Luxury Holdings LLC',
    role: 'admin' as const,
    status: 'active' as const,
    createdAt: '2024-07-01',
    lastActive: '2025-01-15T11:00:00',
    bookingsCount: 28,
  },
  {
    id: '6',
    email: 'emily@luxuryholdings.com',
    firstName: 'Emily',
    lastName: 'Johnson',
    organizationId: '1',
    organizationName: 'Luxury Holdings LLC',
    role: 'manager' as const,
    status: 'active' as const,
    createdAt: '2024-08-15',
    lastActive: '2025-01-14T15:30:00',
    bookingsCount: 15,
  },
  {
    id: '7',
    email: 'michael@pacificaviation.com',
    firstName: 'Michael',
    lastName: 'Brown',
    organizationId: '2',
    organizationName: 'Pacific Aviation Group',
    role: 'member' as const,
    status: 'active' as const,
    createdAt: '2024-10-10',
    lastActive: '2025-01-13T08:45:00',
    bookingsCount: 12,
  },
  {
    id: '8',
    email: 'lisa@globalassets.com',
    firstName: 'Lisa',
    lastName: 'Brown',
    organizationId: '7',
    organizationName: 'Global Assets Management',
    role: 'owner' as const,
    status: 'inactive' as const,
    createdAt: '2024-07-01',
    lastActive: '2024-12-15T12:00:00',
    bookingsCount: 5,
  },
  {
    id: '9',
    email: 'pending@example.com',
    firstName: null,
    lastName: null,
    organizationId: '1',
    organizationName: 'Luxury Holdings LLC',
    role: 'member' as const,
    status: 'pending' as const,
    createdAt: '2025-01-14',
    lastActive: null,
    bookingsCount: 0,
  },
];

const roleConfig = {
  owner: { label: 'Owner', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: Shield },
  admin: { label: 'Admin', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Shield },
  manager: { label: 'Manager', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: UserCheck },
  member: { label: 'Member', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: User },
  viewer: { label: 'Viewer', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Eye },
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  inactive: { label: 'Inactive', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

type FilterRole = 'all' | 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
type FilterStatus = 'all' | 'active' | 'inactive' | 'pending';

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.firstName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.organizationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: mockUsers.length,
    owners: mockUsers.filter(u => u.role === 'owner').length,
    admins: mockUsers.filter(u => u.role === 'admin').length,
    members: mockUsers.filter(u => u.role === 'member' || u.role === 'manager').length,
    pending: mockUsers.filter(u => u.status === 'pending').length,
  };

  const formatLastActive = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Users
          </h1>
          <p className="text-muted mt-1">
            Manage all users across the platform
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-white">{stats.total}</p>
          <p className="text-sm text-muted">Total Users</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-red-400">{stats.owners}</p>
          <p className="text-sm text-muted">Owners</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-purple-400">{stats.admins}</p>
          <p className="text-sm text-muted">Admins</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-emerald-400">{stats.members}</p>
          <p className="text-sm text-muted">Members</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display font-semibold text-amber-400">{stats.pending}</p>
          <p className="text-sm text-muted">Pending</p>
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
              placeholder="Search by name, email, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Role filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'owner', 'admin', 'manager', 'member'] as FilterRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  roleFilter === role
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'text-muted hover:text-white hover:bg-white/5'
                )}
              >
                {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'inactive'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-muted hover:text-white hover:bg-white/5'
                )}
              >
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users list */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Organization</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Role</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Last Active</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Bookings</th>
                <th className="text-left p-4 text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const RoleIcon = roleConfig[user.role].icon;
                return (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-red-400 font-semibold">
                            {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : 'Pending User'
                            }
                          </p>
                          <p className="text-sm text-muted truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Link 
                        href={`/admin/organizations/${user.organizationId}`}
                        className="flex items-center gap-2 text-white hover:text-red-400 transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-muted" />
                        <span className="text-sm truncate max-w-[150px]">{user.organizationName}</span>
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                        roleConfig[user.role].color
                      )}>
                        <RoleIcon className="w-3 h-3" />
                        {roleConfig[user.role].label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                        statusConfig[user.status].color
                      )}>
                        {statusConfig[user.status].label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted" />
                        <span className="text-muted">{formatLastActive(user.lastActive)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white font-medium">{user.bookingsCount}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                          {selectedUser === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-navy-800 rounded-lg border border-border shadow-xl z-10">
                              <div className="py-1">
                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-navy-700 transition-colors">
                                  <ExternalLink className="w-4 h-4" />
                                  Login as User
                                </button>
                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-navy-700 transition-colors">
                                  <Edit className="w-4 h-4" />
                                  Edit User
                                </button>
                                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:bg-navy-700 transition-colors">
                                  <Ban className="w-4 h-4" />
                                  Suspend
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

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No users found</h3>
            <p className="text-muted text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
