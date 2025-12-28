'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building2,
  Users,
  Gift,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Bell,
  FileText,
  ChevronDown,
  Search,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Complimentary', href: '/admin/complimentary', icon: Gift },
  { name: 'Activity Logs', href: '/admin/logs', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  firstName?: string;
  lastName?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/admin/login');
          return;
        }

        // Check if user is a platform admin
        const { data: adminData, error } = await supabase
          .from('platform_admins')
          .select('*, profile:profiles(*)')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();

        if (error || !adminData) {
          router.push('/admin/login');
          return;
        }

        const profile = Array.isArray(adminData.profile) 
          ? adminData.profile[0] 
          : adminData.profile;

        setAdminUser({
          id: session.user.id,
          email: session.user.email || '',
          role: adminData.role,
          firstName: profile?.first_name,
          lastName: profile?.last_name,
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Admin auth check failed:', error);
        router.push('/admin/login');
      }
    };

    checkAdminAuth();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('adminRole');
    router.push('/admin/login');
  };

  const getAdminInitials = () => {
    if (adminUser?.firstName && adminUser?.lastName) {
      return `${adminUser.firstName.charAt(0)}${adminUser.lastName.charAt(0)}`.toUpperCase();
    }
    return adminUser?.email?.charAt(0).toUpperCase() || 'A';
  };

  const getAdminDisplayName = () => {
    if (adminUser?.firstName && adminUser?.lastName) {
      return `${adminUser.firstName} ${adminUser.lastName}`;
    }
    return adminUser?.email || 'Admin';
  };

  const getRoleLabel = () => {
    switch (adminUser?.role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'support': return 'Support';
      default: return 'Admin';
    }
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
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display text-lg font-semibold text-white">
                  Reserve<span className="text-red-400">PTY</span>
                </span>
                <p className="text-xs text-red-400">Admin</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{getRoleLabel()}</p>
                <p className="text-xs text-red-400">
                  {adminUser?.role === 'super_admin' ? 'Full Access' : 
                   adminUser?.role === 'admin' ? 'Admin Access' : 'View Only'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
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

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400 font-semibold">{getAdminInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {getAdminDisplayName()}
                </p>
                <p className="text-xs text-muted truncate">{adminUser?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start hover:bg-red-500/10 hover:text-red-400"
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-800/50 border border-border w-64">
              <Search className="w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search organizations, users..."
                className="bg-transparent border-none text-sm text-white placeholder:text-muted focus:outline-none flex-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <Link href="/" className="text-sm text-muted hover:text-white transition-colors">
              View Site →
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
