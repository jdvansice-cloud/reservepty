'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/auth-provider';
import { cn, isDevMode, SECTIONS } from '@/lib/utils';
import {
  Building2,
  CreditCard,
  User,
  Upload,
  Save,
  Loader2,
  Sparkles,
  CheckCircle2,
  Plane,
  Ship,
  Home,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  boats: Ship,
};

const tabs = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function SettingsPage() {
  const { user, profile, organization } = useAuth();
  const [activeTab, setActiveTab] = useState('organization');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveOrg = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  // Mock billing data
  const mockBilling = {
    plan: 'Professional',
    billingCycle: 'monthly',
    seatLimit: 100,
    seatsUsed: 15,
    sections: ['planes', 'helicopters', 'residences', 'boats'],
    nextBillingDate: new Date(2025, 1, 1),
    amount: 0, // Complimentary
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
      <div className="flex items-center gap-1 p-1 bg-surface rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
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
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-display font-bold text-white">
                      {mockBilling.plan}
                    </h3>
                    {mockBilling.status === 'complimentary' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gold-500/10 text-gold-500">
                        Complimentary
                      </span>
                    )}
                  </div>
                  <p className="text-muted mt-1">
                    {mockBilling.seatsUsed} of {mockBilling.seatLimit} seats used
                  </p>
                </div>
                <Button variant="secondary">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Plan
                </Button>
              </div>

              {/* Usage Bar */}
              <div className="mt-6">
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-500 rounded-full transition-all"
                    style={{ width: `${(mockBilling.seatsUsed / mockBilling.seatLimit) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted mt-2">
                  {mockBilling.seatLimit - mockBilling.seatsUsed} seats remaining
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Active Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Active Sections</CardTitle>
              <CardDescription>
                Asset categories included in your subscription
              </CardDescription>
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

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              {mockBilling.status === 'complimentary' ? (
                <div className="text-center py-8">
                  <Sparkles className="w-10 h-10 text-gold-500 mx-auto mb-3" />
                  <p className="text-white font-medium">Complimentary Access</p>
                  <p className="text-sm text-muted mt-1">
                    No billing history - your account has complimentary access
                  </p>
                </div>
              ) : (
                <p className="text-muted text-center py-8">No billing history yet</p>
              )}
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
                <CardDescription>Update your personal details</CardDescription>
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
                  <p className="text-xs text-muted mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div>
                  <Label>Phone Number</Label>
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

            {/* Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input type="password" />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input type="password" />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input type="password" />
                </div>
                <div className="pt-4">
                  <Button variant="secondary">Update Password</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Avatar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-full bg-surface border-2 border-dashed border-border flex flex-col items-center justify-center text-center hover:border-gold-500 transition-colors cursor-pointer max-w-[200px] mx-auto">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gold-500/10 rounded-full flex items-center justify-center">
                      <span className="text-gold-500 font-display text-4xl font-bold">
                        {profile?.first_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="secondary" className="w-full mt-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="mt-6 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-lg font-display text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted mb-4">
                  Permanently delete your account and all associated data.
                </p>
                <Button variant="danger" size="sm">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
