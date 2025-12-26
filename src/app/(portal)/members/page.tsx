'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, isDevMode, ROLES } from '@/lib/utils';
import {
  Plus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  Crown,
  UserCog,
  User,
  Eye,
  Edit,
  Trash2,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const ROLE_ICONS: Record<string, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  manager: UserCog,
  member: User,
  viewer: Eye,
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'text-gold-500 bg-gold-500/10',
  admin: 'text-purple-400 bg-purple-400/10',
  manager: 'text-blue-400 bg-blue-400/10',
  member: 'text-emerald-400 bg-emerald-400/10',
  viewer: 'text-muted bg-muted/10',
};

// Mock data
const mockMembers = [
  {
    id: '1',
    email: 'john.smith@example.com',
    firstName: 'John',
    lastName: 'Smith',
    role: 'owner',
    tierName: 'Principals',
    status: 'active',
    joinedAt: new Date(2024, 0, 15),
    avatar: null,
  },
  {
    id: '2',
    email: 'sarah.johnson@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'admin',
    tierName: 'Family',
    status: 'active',
    joinedAt: new Date(2024, 2, 10),
    avatar: null,
  },
  {
    id: '3',
    email: 'michael.chen@example.com',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'manager',
    tierName: 'Family',
    status: 'active',
    joinedAt: new Date(2024, 5, 20),
    avatar: null,
  },
  {
    id: '4',
    email: 'emma.williams@example.com',
    firstName: 'Emma',
    lastName: 'Williams',
    role: 'member',
    tierName: 'Staff',
    status: 'active',
    joinedAt: new Date(2024, 8, 5),
    avatar: null,
  },
  {
    id: '5',
    email: 'david.brown@example.com',
    firstName: 'David',
    lastName: 'Brown',
    role: 'viewer',
    tierName: 'Staff',
    status: 'active',
    joinedAt: new Date(2024, 10, 1),
    avatar: null,
  },
];

const mockPendingInvites = [
  {
    id: 'inv1',
    email: 'pending.user@example.com',
    role: 'member',
    tierName: 'Staff',
    sentAt: new Date(2024, 11, 20),
  },
];

const mockTiers = [
  { id: '1', name: 'Principals', priority: 1 },
  { id: '2', name: 'Family', priority: 2 },
  { id: '3', name: 'Staff', priority: 3 },
];

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member',
    tierId: '',
  });

  const filteredMembers = useMemo(() => {
    return mockMembers.filter(
      (member) =>
        member.firstName.toLowerCase().includes(search.toLowerCase()) ||
        member.lastName.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleInvite = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowInviteModal(false);
    setInviteForm({ email: '', role: 'member', tierId: '' });
  };

  const memberStats = useMemo(() => {
    const roleCount: Record<string, number> = {};
    mockMembers.forEach((m) => {
      roleCount[m.role] = (roleCount[m.role] || 0) + 1;
    });
    return roleCount;
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Members</h1>
          <p className="text-muted mt-1">
            Manage your organization's members and their access levels
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDevMode() && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Demo</span>
            </div>
          )}
          <Button onClick={() => setShowInviteModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(ROLES).map(([key, role]) => {
          const Icon = ROLE_ICONS[key];
          const count = memberStats[key] || 0;
          return (
            <Card key={key} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', ROLE_COLORS[key])}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-white">{count}</p>
                    <p className="text-xs text-muted capitalize">{role.label}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members List */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-display">
            Active Members ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredMembers.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role];
              return (
                <div
                  key={member.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-surface/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-gold-500 font-semibold text-lg">
                      {member.firstName.charAt(0)}
                      {member.lastName.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-sm text-muted truncate">{member.email}</p>
                  </div>

                  {/* Tier */}
                  <div className="hidden sm:block">
                    <p className="text-sm text-white">{member.tierName}</p>
                    <p className="text-xs text-muted">Tier</p>
                  </div>

                  {/* Role Badge */}
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize',
                      ROLE_COLORS[member.role]
                    )}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                    {ROLES[member.role as keyof typeof ROLES]?.label}
                  </div>

                  {/* Actions */}
                  <div className="relative">
                    <button
                      onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                      className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {selectedMember === member.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-navy-900 border border-border rounded-lg shadow-lg z-10 py-1">
                        <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-surface flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit Member
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-surface flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Change Role
                        </button>
                        {member.role !== 'owner' && (
                          <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-surface flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {mockPendingInvites.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Invitations ({mockPendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {mockPendingInvites.map((invite) => {
                const RoleIcon = ROLE_ICONS[invite.role];
                return (
                  <div
                    key={invite.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-surface/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{invite.email}</p>
                      <p className="text-sm text-muted">
                        Sent {invite.sentAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm text-white">{invite.tierName}</p>
                      <p className="text-xs text-muted">Tier</p>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize',
                        ROLE_COLORS[invite.role]
                      )}
                    >
                      <RoleIcon className="w-3.5 h-3.5" />
                      {ROLES[invite.role as keyof typeof ROLES]?.label}
                    </div>
                    <Button variant="secondary" size="sm">
                      Resend
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          />
          <Card className="relative max-w-md w-full animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">Invite Member</CardTitle>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="member@example.com"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Role</Label>
                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-gold-500"
                >
                  {Object.entries(ROLES)
                    .filter(([key]) => key !== 'owner')
                    .map(([key, role]) => (
                      <option key={key} value={key}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label>Tier</Label>
                <select
                  value={inviteForm.tierId}
                  onChange={(e) =>
                    setInviteForm((prev) => ({ ...prev, tierId: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="">Select a tier...</option>
                  {mockTiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} (Priority {tier.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleInvite}
                  disabled={!inviteForm.email || !inviteForm.tierId || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
