'use client';

import { useState } from 'react';
import {
  Settings,
  Globe,
  CreditCard,
  Mail,
  Shield,
  Users,
  Database,
  Bell,
  Palette,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Key,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'billing' | 'email' | 'security' | 'admins';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'billing' as const, label: 'Billing & Pricing', icon: CreditCard },
    { id: 'email' as const, label: 'Email Settings', icon: Mail },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'admins' as const, label: 'Platform Admins', icon: Users },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Platform Settings
          </h1>
          <p className="text-muted mt-1">
            Configure global platform settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'text-muted hover:text-white hover:bg-white/5'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-6">
                  Platform Information
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Platform Name</label>
                    <input
                      type="text"
                      className="input w-full"
                      defaultValue="ReservePTY"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Support Email</label>
                    <input
                      type="email"
                      className="input w-full"
                      defaultValue="support@reservepty.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Default Timezone</label>
                    <select className="input w-full">
                      <option value="America/Panama">America/Panama (UTC-5)</option>
                      <option value="America/New_York">America/New York (UTC-5)</option>
                      <option value="America/Los_Angeles">America/Los Angeles (UTC-8)</option>
                      <option value="Europe/London">Europe/London (UTC+0)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-6">
                  Trial Settings
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Trial Period (days)</label>
                    <input
                      type="number"
                      className="input w-full"
                      defaultValue="14"
                    />
                    <p className="text-xs text-muted">
                      Number of days for free trial period
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-navy-800/50">
                    <div>
                      <p className="text-white font-medium">Require Credit Card for Trial</p>
                      <p className="text-sm text-muted">Collect payment info during trial signup</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-6">
                  Maintenance Mode
                </h2>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-400">Caution</p>
                      <p className="text-sm text-amber-400/80">
                        Enabling maintenance mode will prevent all users from accessing the platform.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Enable Maintenance Mode</p>
                    <p className="text-sm text-muted">Platform is currently operational</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-6">
                  Pricing Configuration
                </h2>
                <div className="space-y-6">
                  {/* Section pricing */}
                  <div>
                    <h3 className="text-white font-medium mb-4">Section Prices (Monthly)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {['Planes', 'Helicopters', 'Residences & Spaces', 'Boats'].map((section) => (
                        <div key={section} className="space-y-2">
                          <label className="text-sm font-medium text-white">{section}</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
                            <input
                              type="number"
                              className="input w-full pl-8"
                              defaultValue="99"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seat pricing */}
                  <div>
                    <h3 className="text-white font-medium mb-4">Seat Tier Prices (Monthly)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { seats: 5, price: 0 },
                        { seats: 10, price: 49 },
                        { seats: 25, price: 99 },
                        { seats: 50, price: 199 },
                        { seats: 100, price: 399 },
                      ].map(({ seats, price }) => (
                        <div key={seats} className="space-y-2">
                          <label className="text-sm font-medium text-white">{seats} Seats</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
                            <input
                              type="number"
                              className="input w-full pl-8"
                              defaultValue={price}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Yearly discount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Yearly Discount (%)</label>
                    <input
                      type="number"
                      className="input w-full max-w-xs"
                      defaultValue="20"
                    />
                    <p className="text-xs text-muted">
                      Percentage discount for yearly billing
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-6">
                  Payment Provider
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-navy-800/50 border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-white font-medium">Tilopay Connected</p>
                      <p className="text-sm text-muted">Payment processing is active</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Tilopay API Key</label>
                    <input
                      type="password"
                      className="input w-full"
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Webhook Secret</label>
                    <input
                      type="password"
                      className="input w-full"
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-6">
                  Email Provider
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Provider</label>
                    <select className="input w-full">
                      <option value="resend">Resend</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="postmark">Postmark</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">API Key</label>
                    <input
                      type="password"
                      className="input w-full"
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">From Email</label>
                    <input
                      type="email"
                      className="input w-full"
                      defaultValue="noreply@reservepty.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">From Name</label>
                    <input
                      type="text"
                      className="input w-full"
                      defaultValue="ReservePTY"
                    />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-6">
                  Email Templates
                </h2>
                <div className="space-y-3">
                  {[
                    'Welcome Email',
                    'Password Reset',
                    'Member Invitation',
                    'Booking Confirmation',
                    'Booking Approved',
                    'Booking Rejected',
                    'Payment Receipt',
                    'Trial Ending',
                  ].map((template) => (
                    <div
                      key={template}
                      className="flex items-center justify-between p-4 rounded-lg bg-navy-800/50 hover:bg-navy-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted" />
                        <span className="text-white">{template}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-6">
                  Authentication Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-navy-800/50">
                    <div>
                      <p className="text-white font-medium">Email Verification Required</p>
                      <p className="text-sm text-muted">Users must verify email before access</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-navy-800/50">
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted">Allow users to enable 2FA</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Session Timeout (hours)</label>
                    <input
                      type="number"
                      className="input w-full max-w-xs"
                      defaultValue="24"
                    />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-6">
                  Password Policy
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Minimum Length</label>
                    <input
                      type="number"
                      className="input w-full max-w-xs"
                      defaultValue="8"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-navy-800/50">
                    <div>
                      <p className="text-white font-medium">Require Uppercase</p>
                      <p className="text-sm text-muted">At least one uppercase letter</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-navy-800/50">
                    <div>
                      <p className="text-white font-medium">Require Number</p>
                      <p className="text-sm text-muted">At least one number</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-navy-800/50">
                    <div>
                      <p className="text-white font-medium">Require Special Character</p>
                      <p className="text-sm text-muted">At least one special character</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-semibold text-white">
                    Platform Administrators
                  </h2>
                  <Button size="sm">
                    <Users className="w-4 h-4" />
                    Add Admin
                  </Button>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Super Admin', email: 'admin@reservepty.com', role: 'super_admin', lastActive: '2 hours ago' },
                    { name: 'Support Agent', email: 'support@reservepty.com', role: 'support', lastActive: '1 day ago' },
                  ].map((admin) => (
                    <div
                      key={admin.email}
                      className="flex items-center justify-between p-4 rounded-lg bg-navy-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <span className="text-red-400 font-semibold">
                            {admin.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{admin.name}</p>
                          <p className="text-sm text-muted">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                            admin.role === 'super_admin' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          )}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Support'}
                          </span>
                          <p className="text-xs text-muted mt-1">Active {admin.lastActive}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-4">
                  Role Permissions
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted font-medium">Permission</th>
                        <th className="text-center p-3 text-muted font-medium">Super Admin</th>
                        <th className="text-center p-3 text-muted font-medium">Admin</th>
                        <th className="text-center p-3 text-muted font-medium">Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'View Organizations', super: true, admin: true, support: true },
                        { name: 'Create Organizations', super: true, admin: true, support: false },
                        { name: 'Delete Organizations', super: true, admin: false, support: false },
                        { name: 'Manage Subscriptions', super: true, admin: true, support: false },
                        { name: 'Grant Complimentary', super: true, admin: true, support: false },
                        { name: 'View Activity Logs', super: true, admin: true, support: true },
                        { name: 'Manage Platform Settings', super: true, admin: false, support: false },
                        { name: 'Manage Platform Admins', super: true, admin: false, support: false },
                      ].map((perm) => (
                        <tr key={perm.name} className="border-b border-border/50">
                          <td className="p-3 text-white">{perm.name}</td>
                          <td className="p-3 text-center">
                            {perm.super ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {perm.admin ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {perm.support ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
