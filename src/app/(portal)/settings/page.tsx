'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { cn, isDevMode, SECTIONS } from '@/lib/utils';
import {
  Building2,
  CreditCard,
  User,
  Users,
  Layers,
  Upload,
  Save,
  Loader2,
  Sparkles,
  CheckCircle2,
  Plane,
  Ship,
  Home,
  Plus,
  Mail,
  Trash2,
  Crown,
  X,
  Edit2,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  watercraft: Ship,
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-gold-500/10 text-gold-500 border-gold-500/20',
  admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  member: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  viewer: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

interface Member {
  id: string;
  user_id: string;
  role: string;
  tier_id: string | null;
  profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  tier?: {
    id: string;
    name: string;
    color: string;
  };
}

interface Tier {
  id: string;
  name: string;
  priority: number;
  color: string;
  description?: string;
  tier_rules?: {
    max_days_per_month: number | null;
    max_consecutive_days: number | null;
    min_lead_time_hours: number;
    requires_approval: boolean;
    can_override: boolean;
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, profile, organization, membership, session } = useAuth();
  const [activeTab, setActiveTab] = useState('organization');
  const [isSaving, setIsSaving] = useState(false);
  
  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member', tierId: '' });
  const [isInviting, setIsInviting] = useState(false);
  
  // Tiers state
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [tierForm, setTierForm] = useState({
    name: '',
    priority: 1,
    color: '#c8b273',
    description: '',
    maxDaysPerMonth: '',
    maxConsecutiveDays: '',
    minLeadTimeHours: '0',
    requiresApproval: false,
    canOverride: false,
  });

  // Organization form
  const [orgForm, setOrgForm] = useState({
    legalName: organization?.legal_name || '',
    commercialName: organization?.commercial_name || '',
    ruc: organization?.ruc || '',
    dv: organization?.dv || '',
    billingEmail: organization?.billing_email || '',
  });

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    phone: profile?.phone || '',
  });

  // Check if user is admin
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin';

  // Build tabs based on role
  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
    ...(isAdmin ? [
      { id: 'members', label: 'Members', icon: Users },
      { id: 'tiers', label: 'Tiers', icon: Layers },
    ] : []),
  ];

  // Fetch members when tab is active
  useEffect(() => {
    if (activeTab === 'members' && organization?.id && session?.access_token) {
      fetchMembers();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  // Fetch tiers when tab is active
  useEffect(() => {
    if (activeTab === 'tiers' && organization?.id && session?.access_token) {
      fetchTiers();
    }
  }, [activeTab, organization?.id, session?.access_token]);

  // Fetch tiers for invite modal
  useEffect(() => {
    if (showInviteModal && tiers.length === 0 && organization?.id && session?.access_token) {
      fetchTiers();
    }
  }, [showInviteModal]);

  const fetchMembers = async () => {
    if (!organization?.id || !session?.access_token) return;
    setIsLoadingMembers(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/organization_members?organization_id=eq.${organization.id}&select=*,profile:profiles(*),tier:tiers(*)`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMembers(data.map((m: any) => ({
          ...m,
          profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
          tier: Array.isArray(m.tier) ? m.tier[0] : m.tier,
        })));
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchTiers = async () => {
    if (!organization?.id || !session?.access_token) return;
    setIsLoadingTiers(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/tiers?organization_id=eq.${organization.id}&select=*,tier_rules(*)&order=priority.asc`,
        {
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTiers(data.map((t: any) => ({
          ...t,
          tier_rules: Array.isArray(t.tier_rules) ? t.tier_rules[0] : t.tier_rules,
        })));
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setIsLoadingTiers(false);
    }
  };

  const handleInvite = async () => {
    if (!organization?.id || !session?.access_token || !user?.id) return;
    if (!inviteForm.email) {
      toast({ title: 'Error', description: 'Email is required', variant: 'error' });
      return;
    }

    setIsInviting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/invitations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            organization_id: organization.id,
            email: inviteForm.email.toLowerCase(),
            role: inviteForm.role,
            tier_id: inviteForm.tierId || null,
            invited_by: user.id,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to send invitation');

      toast({ title: 'Invitation sent', description: `Invitation sent to ${inviteForm.email}` });
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'member', tierId: '' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!session?.access_token) return;
    if (!confirm(`Remove ${memberEmail} from the organization?`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/organization_members?id=eq.${memberId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to remove member');

      setMembers(members.filter(m => m.id !== memberId));
      toast({ title: 'Member removed', description: `${memberEmail} has been removed` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    }
  };

  const openTierModal = (tier?: Tier) => {
    if (tier) {
      setEditingTier(tier);
      setTierForm({
        name: tier.name,
        priority: tier.priority,
        color: tier.color,
        description: tier.description || '',
        maxDaysPerMonth: tier.tier_rules?.max_days_per_month?.toString() || '',
        maxConsecutiveDays: tier.tier_rules?.max_consecutive_days?.toString() || '',
        minLeadTimeHours: tier.tier_rules?.min_lead_time_hours?.toString() || '0',
        requiresApproval: tier.tier_rules?.requires_approval || false,
        canOverride: tier.tier_rules?.can_override || false,
      });
    } else {
      setEditingTier(null);
      setTierForm({
        name: '',
        priority: tiers.length + 1,
        color: '#c8b273',
        description: '',
        maxDaysPerMonth: '',
        maxConsecutiveDays: '',
        minLeadTimeHours: '0',
        requiresApproval: false,
        canOverride: false,
      });
    }
    setShowTierModal(true);
  };

  const handleSaveTier = async () => {
    if (!organization?.id || !session?.access_token) return;
    if (!tierForm.name) {
      toast({ title: 'Error', description: 'Tier name is required', variant: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const tierData = {
        organization_id: organization.id,
        name: tierForm.name,
        priority: tierForm.priority,
        color: tierForm.color,
        description: tierForm.description || null,
      };

      let tierId: string;

      if (editingTier) {
        const response = await fetch(
          `${baseUrl}/rest/v1/tiers?id=eq.${editingTier.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(tierData),
          }
        );
        if (!response.ok) throw new Error('Failed to update tier');
        tierId = editingTier.id;
      } else {
        const response = await fetch(
          `${baseUrl}/rest/v1/tiers`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey!,
              'Authorization': `Bearer ${session.access_token}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(tierData),
          }
        );
        if (!response.ok) throw new Error('Failed to create tier');
        const data = await response.json();
        tierId = data[0].id;
      }

      // Save tier rules
      const rulesData = {
        tier_id: tierId,
        max_days_per_month: tierForm.maxDaysPerMonth ? parseInt(tierForm.maxDaysPerMonth) : null,
        max_consecutive_days: tierForm.maxConsecutiveDays ? parseInt(tierForm.maxConsecutiveDays) : null,
        min_lead_time_hours: parseInt(tierForm.minLeadTimeHours) || 0,
        requires_approval: tierForm.requiresApproval,
        can_override: tierForm.canOverride,
      };

      // Upsert tier rules
      await fetch(
        `${baseUrl}/rest/v1/tier_rules?tier_id=eq.${tierId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      await fetch(
        `${baseUrl}/rest/v1/tier_rules`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(rulesData),
        }
      );

      toast({ title: editingTier ? 'Tier updated' : 'Tier created', description: `${tierForm.name} has been saved` });
      setShowTierModal(false);
      fetchTiers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTier = async (tier: Tier) => {
    if (!session?.access_token) return;
    if (!confirm(`Delete tier "${tier.name}"? Members in this tier will need to be reassigned.`)) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      await fetch(
        `${baseUrl}/rest/v1/tiers?id=eq.${tier.id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      setTiers(tiers.filter(t => t.id !== tier.id));
      toast({ title: 'Tier deleted', description: `${tier.name} has been deleted` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'error' });
    }
  };

  const handleSaveOrg = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast({ title: 'Saved', description: 'Organization settings updated' });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast({ title: 'Saved', description: 'Profile updated' });
  };

  // Mock billing data
  const mockBilling = {
    plan: 'Professional',
    billingCycle: 'monthly',
    seatLimit: 100,
    seatsUsed: members.length,
    sections: ['planes', 'helicopters', 'residences', 'watercraft'],
    nextBillingDate: new Date(2025, 1, 1),
    amount: 0,
    status: 'complimentary',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Settings</h1>
          <p className="text-muted mt-1">Manage your organization and account settings</p>
        </div>
        {isDevMode() && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Development Mode</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded-lg w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-gold-500 text-navy-950'
                : 'text-muted hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Organization Details</CardTitle>
                <CardDescription>
                  Update your organization's legal and commercial information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Legal Name</Label>
                    <Input
                      value={orgForm.legalName}
                      onChange={(e) =>
                        setOrgForm((prev) => ({ ...prev, legalName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Commercial Name</Label>
                    <Input
                      value={orgForm.commercialName}
                      onChange={(e) =>
                        setOrgForm((prev) => ({ ...prev, commercialName: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>RUC (Tax ID)</Label>
                    <Input
                      value={orgForm.ruc}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, ruc: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>DV</Label>
                    <Input
                      value={orgForm.dv}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, dv: e.target.value }))}
                      maxLength={2}
                    />
                  </div>
                </div>

                <div>
                  <Label>Billing Email</Label>
                  <Input
                    type="email"
                    value={orgForm.billingEmail}
                    onChange={(e) =>
                      setOrgForm((prev) => ({ ...prev, billingEmail: e.target.value }))
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveOrg} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logo Upload */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Organization Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-xl bg-surface border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-6 hover:border-gold-500 transition-colors cursor-pointer">
                  {organization?.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted mb-3" />
                      <p className="text-sm font-medium text-white">Upload Logo</p>
                      <p className="text-xs text-muted mt-1">PNG, JPG up to 2MB</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gold-500/5 border border-gold-500/20">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    <span className="text-lg font-bold text-white">{mockBilling.plan}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-500 uppercase">
                      {mockBilling.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1">
                    {mockBilling.seatsUsed} of {mockBilling.seatLimit} seats used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Active Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(SECTIONS).map(([key, section]) => {
                  const Icon = SECTION_ICONS[key];
                  const isActive = mockBilling.sections.includes(key);
                  return (
                    <div
                      key={key}
                      className={cn(
                        'p-4 rounded-xl border text-center transition-colors',
                        isActive
                          ? 'border-gold-500/30 bg-gold-500/5'
                          : 'border-border bg-surface opacity-50'
                      )}
                    >
                      <div
                        className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${section.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: section.color }} />
                      </div>
                      <p className="text-sm font-medium text-white">{section.label}</p>
                      {isActive && (
                        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="opacity-60" />
                  <p className="text-xs text-muted mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-full bg-surface border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-gold-500 transition-colors cursor-pointer max-w-[200px] mx-auto">
                  <div className="w-full h-full bg-gold-500/10 rounded-full flex items-center justify-center">
                    <span className="text-gold-500 font-display text-4xl font-bold">
                      {profile?.first_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <Button variant="secondary" className="w-full mt-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Members Tab (Admin Only) */}
      {activeTab === 'members' && isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-white">Team Members</h2>
              <p className="text-sm text-muted">{members.length} members in your organization</p>
            </div>
            <Button onClick={() => setShowInviteModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>

          {isLoadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {members.map((member) => (
                    <div key={member.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center">
                          <span className="text-gold-500 font-medium">
                            {member.profile?.first_name?.charAt(0) || member.profile?.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {member.profile?.first_name
                              ? `${member.profile.first_name} ${member.profile.last_name || ''}`
                              : member.profile?.email}
                          </p>
                          <p className="text-sm text-muted">{member.profile?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.tier && (
                          <span
                            className="text-xs px-2 py-1 rounded-full border"
                            style={{
                              backgroundColor: `${member.tier.color}20`,
                              borderColor: `${member.tier.color}40`,
                              color: member.tier.color,
                            }}
                          >
                            {member.tier.name}
                          </span>
                        )}
                        <span className={cn('text-xs px-2 py-1 rounded-full border capitalize', ROLE_COLORS[member.role])}>
                          {member.role === 'owner' && <Crown className="w-3 h-3 inline mr-1" />}
                          {member.role}
                        </span>
                        {member.role !== 'owner' && member.user_id !== user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.profile?.email || '')}
                            className="p-1.5 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tiers Tab (Admin Only) */}
      {activeTab === 'tiers' && isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-white">Booking Tiers</h2>
              <p className="text-sm text-muted">Configure member priority levels for bookings</p>
            </div>
            <Button onClick={() => openTierModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tier
            </Button>
          </div>

          {isLoadingTiers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          ) : tiers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-muted">No tiers configured yet</p>
                <Button className="mt-4" onClick={() => openTierModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Tier
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tiers.map((tier) => (
                <Card key={tier.id} className="hover:border-gold-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: `${tier.color}20`, color: tier.color }}
                        >
                          {tier.priority}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{tier.name}</h3>
                          <p className="text-sm text-muted">
                            {tier.tier_rules?.requires_approval ? 'Requires approval' : 'Auto-approved'}
                            {tier.tier_rules?.max_days_per_month && ` • ${tier.tier_rules.max_days_per_month} days/month`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openTierModal(tier)}
                          className="p-2 rounded hover:bg-surface text-muted hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTier(tier)}
                          className="p-2 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <Card className="relative max-w-md w-full animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">Invite Member</CardTitle>
              <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {tiers.length > 0 && (
                <div>
                  <Label>Tier (Optional)</Label>
                  <select
                    value={inviteForm.tierId}
                    onChange={(e) => setInviteForm({ ...inviteForm, tierId: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white"
                  >
                    <option value="">No tier</option>
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>{tier.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleInvite} disabled={isInviting || !inviteForm.email}>
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send Invite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tier Modal */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTierModal(false)} />
          <Card className="relative max-w-lg w-full animate-fade-up max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">{editingTier ? 'Edit Tier' : 'Add Tier'}</CardTitle>
              <button onClick={() => setShowTierModal(false)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tier Name *</Label>
                  <Input
                    placeholder="Principals"
                    value={tierForm.name}
                    onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Priority (1 = highest)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tierForm.priority}
                    onChange={(e) => setTierForm({ ...tierForm, priority: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={tierForm.color}
                    onChange={(e) => setTierForm({ ...tierForm, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={tierForm.color}
                    onChange={(e) => setTierForm({ ...tierForm, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of this tier"
                  value={tierForm.description}
                  onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-white mb-3">Booking Rules</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Days/Month</Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={tierForm.maxDaysPerMonth}
                      onChange={(e) => setTierForm({ ...tierForm, maxDaysPerMonth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Min Lead Time (hours)</Label>
                    <Input
                      type="number"
                      value={tierForm.minLeadTimeHours}
                      onChange={(e) => setTierForm({ ...tierForm, minLeadTimeHours: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierForm.requiresApproval}
                      onChange={(e) => setTierForm({ ...tierForm, requiresApproval: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-surface text-gold-500"
                    />
                    <span className="text-sm text-white">Requires approval</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tierForm.canOverride}
                      onChange={(e) => setTierForm({ ...tierForm, canOverride: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-surface text-gold-500"
                    />
                    <span className="text-sm text-white">Can override lower tiers</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowTierModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSaveTier} disabled={isSaving || !tierForm.name}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingTier ? 'Update' : 'Create'} Tier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
