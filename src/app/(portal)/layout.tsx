'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, isDevMode } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  LayoutDashboard,
  Plane,
  Ship,
  Home,
  Calendar,
  Settings,
  LogOut,
  ChevronDown,
  Zap,
  Bell,
  Menu,
  X,
  Layers,
  Navigation,
  History,
  CheckCircle2,
  User,
  Globe,
  Check,
  Save,
  Loader2,
} from 'lucide-react';

const SECTION_ICONS = {
  planes: Plane,
  helicopters: Navigation,
  residences: Home,
  watercraft: Ship,
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, organization, membership, session, isLoading, signOut, refreshProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Check if user is admin or owner
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin';

  // Navigation items
  const mainNavigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.assets'), href: '/assets', icon: Layers },
    { name: t('nav.calendar'), href: '/calendar', icon: Calendar },
    { name: t('nav.history'), href: '/reservations', icon: History },
    { name: t('nav.approvals'), href: '/approvals', icon: CheckCircle2 },
  ];

  // Settings only for admin/owner
  const adminNavigation = isAdmin ? [
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ] : [];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize profile form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

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

  const handleSaveProfile = async () => {
    if (!user?.id || !session?.access_token) return;

    setIsSavingProfile(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${baseUrl}/rest/v1/profiles?id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey!,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            first_name: profileForm.firstName,
            last_name: profileForm.lastName,
            phone: profileForm.phone,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update profile');

      toast({ title: t('common.success'), description: t('profile.saved') });
      setShowProfileModal(false);
      refreshProfile?.();
    } catch (error) {
      toast({ title: t('common.error'), description: 'Could not save profile', variant: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user.email || '';
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
            {/* Main navigation */}
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
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

            {/* Admin navigation (Settings) */}
            {adminNavigation.length > 0 && (
              <div className="pt-4">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
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
              </div>
            )}
          </nav>

          {/* Dev mode indicator */}
          {isDevMode() && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-medium">{t('dev.mode')}</span>
              </div>
            </div>
          )}
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

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-gold-500 rounded-full" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                  <span className="text-gold-500 font-semibold text-sm">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white truncate max-w-[150px]">
                    {getUserDisplayName()}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted transition-transform",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-navy-900 border border-border rounded-xl shadow-luxury overflow-hidden z-50 animate-fade-up">
                  {/* User Info */}
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-medium text-white truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    {/* Profile */}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {t('nav.profile')}
                    </button>

                    {/* Language Toggle */}
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-3 text-sm text-muted mb-2">
                        <Globe className="w-4 h-4" />
                        {t('nav.language')}
                      </div>
                      <div className="flex gap-2 ml-7">
                        <button
                          onClick={() => setLanguage('es')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            language === 'es'
                              ? "bg-gold-500/10 text-gold-500 border border-gold-500/20"
                              : "text-muted hover:text-white hover:bg-white/5"
                          )}
                        >
                          {language === 'es' && <Check className="w-3 h-3" />}
                          Español
                        </button>
                        <button
                          onClick={() => setLanguage('en')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            language === 'en'
                              ? "bg-gold-500/10 text-gold-500 border border-gold-500/20"
                              : "text-muted hover:text-white hover:bg-white/5"
                          )}
                        >
                          {language === 'en' && <Check className="w-3 h-3" />}
                          English
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sign Out */}
                  <div className="p-2 border-t border-border">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
          <Card className="relative max-w-md w-full animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-display">{t('profile.title')}</CardTitle>
              <button onClick={() => setShowProfileModal(false)} className="p-2 rounded-lg hover:bg-surface text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gold-500/20 flex items-center justify-center">
                  <span className="text-gold-500 font-semibold text-2xl">
                    {getUserInitials()}
                  </span>
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <Label>{t('profile.email')}</Label>
                <Input value={user.email || ''} disabled className="bg-navy-800" />
              </div>

              {/* First Name */}
              <div>
                <Label>{t('profile.firstName')}</Label>
                <Input
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  placeholder={t('profile.firstName')}
                />
              </div>

              {/* Last Name */}
              <div>
                <Label>{t('profile.lastName')}</Label>
                <Input
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  placeholder={t('profile.lastName')}
                />
              </div>

              {/* Phone */}
              <div>
                <Label>{t('profile.phone')}</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+507 6000-0000"
                />
              </div>

              {/* Language */}
              <div>
                <Label>{t('profile.language')}</Label>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setLanguage('es')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      language === 'es'
                        ? "bg-gold-500/10 text-gold-500 border border-gold-500/20"
                        : "bg-surface border border-border text-muted hover:text-white"
                    )}
                  >
                    {language === 'es' && <Check className="w-4 h-4" />}
                    {t('profile.language.es')}
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      language === 'en'
                        ? "bg-gold-500/10 text-gold-500 border border-gold-500/20"
                        : "bg-surface border border-border text-muted hover:text-white"
                    )}
                  >
                    {language === 'en' && <Check className="w-4 h-4" />}
                    {t('profile.language.en')}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowProfileModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1" onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {t('common.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
