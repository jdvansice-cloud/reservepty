'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { cn, isDevMode, SECTIONS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Plane,
  Ship,
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Zap,
  Bell,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import { useState } from 'react';

const SECTION_ICONS = {
  planes: Plane,
  helicopters: Plane, // Using Plane as fallback
  residences: Home,
  boats: Ship,
};

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: Layers },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Tiers', href: '/tiers', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, organization, isLoading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center animate-pulse">
            <span className="text-gold-500 font-display text-xl font-bold">R</span>
          </div>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 border-r border-border transform transition-transform lg:translate-x-0 lg:static lg:inset-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
                <span className="text-navy-950 font-display font-bold text-lg">R</span>
              </div>
              <span className="font-display text-lg font-semibold text-white">
                Reserve<span className="text-gold-500">PTY</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organization selector */}
          {organization && (
            <div className="p-4 border-b border-border">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-navy-800 transition-colors">
                {organization.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={organization.commercial_name || organization.legal_name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
                    <span className="text-gold-500 font-semibold text-sm">
                      {(organization.commercial_name || organization.legal_name).charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white truncate">
                    {organization.commercial_name || organization.legal_name}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
                      : 'text-muted hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Dev mode indicator */}
          {isDevMode() && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-medium">Development Mode</span>
              </div>
            </div>
          )}

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center">
                <span className="text-gold-500 font-semibold">
                  {profile?.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : user.email}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-navy-900/50 backdrop-blur-xl border-b border-border flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
