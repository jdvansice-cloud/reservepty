'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
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
  Crown,
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
  ChevronRight,
  Clock,
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
  const { user, profile, organization, membership, subscription, session, isLoading, signOut, refreshProfile } = useAuth();
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

  // Main navigation items (for sidebar/menu)
  const mainNavigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.assets'), href: '/assets', icon: Layers },
    { name: t('nav.calendar'), href: '/calendar', icon: Calendar },
    { name: t('nav.history'), href: '/reservations', icon: History },
    { name: t('nav.approvals'), href: '/approvals', icon: CheckCircle2 },
  ];

  // Bottom navigation for mobile (4 main items)
  const bottomNavigation = [
    { name: t('nav.assets'), href: '/assets', icon: Layers },
    { name: t('nav.calendar'), href: '/calendar', icon: Calendar },
    { name: t('nav.history'), href: '/reservations', icon: History },
    { name: t('nav.profile'), href: '#profile', icon: User, action: 'profile' },
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

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

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
    setSidebarOpen(false);
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
      toast({ title: t('common.error'), description: language === 'es' ? 'No se pudo guardar perfil' : 'Could not save profile', variant: 'error' });
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

  const getOrgName = () => {
    return organization?.commercial_name || organization?.legal_name || 'ReservePTY';
  };

  const handleBottomNavClick = (item: typeof bottomNavigation[0]) => {
    if (item.action === 'profile') {
      setShowProfileModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col lg:flex-row">
      {/* Mobile/Tablet: Slide-out menu overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar / Slide-out Menu */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-navy-900 border-r border-border',
          'transform transition-transform duration-300 ease-out',
          'lg:translate-x-0 lg:static lg:w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-border pt-safe">
            <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
              <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20">
                <span className="text-navy-950 font-display font-bold text-lg">R</span>
              </div>
              <span className="font-display text-lg font-semibold text-white">
                Reserve<span className="text-gold-500">PTY</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 -mr-2 text-muted hover:text-white rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organization selector */}
          {organization && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/50">
                {organization.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={getOrgName()}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                    <span className="text-gold-500 font-semibold">
                      {getOrgName().charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {getOrgName()}
                  </p>
                  <p className="text-xs text-muted truncate capitalize">
                    {membership?.role || 'Member'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
                    isActive
                      ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20 shadow-lg shadow-gold-500/5'
                      : 'text-muted hover:text-white hover:bg-white/5 active:bg-white/10'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                </Link>
              );
            })}

            {/* Admin navigation (Settings) */}
            {adminNavigation.length > 0 && (
              <div className="pt-4 mt-4 border-t border-border">
                <p className="px-4 mb-2 text-xs font-medium text-muted uppercase tracking-wider">
                  {language === 'es' ? 'Administración' : 'Administration'}
                </p>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
                        isActive
                          ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20 shadow-lg shadow-gold-500/5'
                          : 'text-muted hover:text-white hover:bg-white/5 active:bg-white/10'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User section in sidebar */}
          <div className="p-4 border-t border-border space-y-2 pb-safe">
            {/* Trial indicator */}
            {subscription?.status === 'trial' && subscription.trial_ends_at && (
              <Link
                href="/upgrade"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 hover:bg-gold-500/20 transition-colors"
              >
                <Clock className="w-4 h-4 text-gold-400" />
                <div className="flex-1">
                  <span className="text-gold-400 text-xs font-medium">
                    {(() => {
                      const daysLeft = Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                      return language === 'es' 
                        ? `${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} de prueba`
                        : `${daysLeft} trial ${daysLeft === 1 ? 'day' : 'days'} left`;
                    })()}
                  </span>
                </div>
                <Crown className="w-4 h-4 text-gold-400" />
              </Link>
            )}

            {/* User profile button */}
            <button
              onClick={() => {
                setSidebarOpen(false);
                setShowProfileModal(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center">
                <span className="text-gold-500 font-semibold text-sm">
                  {getUserInitials()}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted" />
            </button>

            {/* Language toggle */}
            <div className="px-3 py-2">
              <p className="text-xs text-muted mb-2 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                {t('nav.language')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('es')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                    language === 'es'
                      ? "bg-gold-500/20 text-gold-400 border border-gold-500/40"
                      : "text-white/70 border border-white/10 hover:bg-white/5"
                  )}
                >
                  {language === 'es' && <Check className="w-3 h-3" />}
                  Español
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                    language === 'en'
                      ? "bg-gold-500/20 text-gold-400 border border-gold-500/40"
                      : "text-white/70 border border-white/10 hover:bg-white/5"
                  )}
                >
                  {language === 'en' && <Check className="w-3 h-3" />}
                  English
                </button>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-14 md:h-16 bg-navy-900/80 backdrop-blur-xl border-b border-border flex items-center px-4 md:px-6 gap-3 pt-safe">
          {/* Burger menu (mobile/tablet) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-muted hover:text-white rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Organization name (mobile/tablet) */}
          <div className="lg:hidden flex-1 min-w-0">
            <h1 className="text-base font-semibold text-white truncate">
              {getOrgName()}
            </h1>
          </div>

          {/* Desktop: spacer */}
          <div className="hidden lg:block flex-1" />

          {/* Right side: notifications + user menu */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Notifications */}
            <button className="relative p-2.5 text-muted hover:text-white transition-colors rounded-xl hover:bg-white/5 active:bg-white/10">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-gold-500 rounded-full" />
            </button>

            {/* User Menu - Desktop only */}
            <div className="hidden lg:block relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                  <span className="text-gold-500 font-semibold text-sm">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white truncate max-w-[150px]">
                    {getUserDisplayName()}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted transition-transform",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              {/* Desktop Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-navy-800 border-2 border-gold-500/30 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-fade-up"
                  style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }}
                >
                  {/* User Info */}
                  <div className="p-4 bg-navy-900/80 border-b border-border">
                    <p className="text-sm font-medium text-white truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>

                  <div className="p-2 bg-navy-800">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:text-white hover:bg-gold-500/10 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {t('nav.profile')}
                    </button>

                    {/* Language Toggle */}
                    <div className="px-3 py-2.5">
                      <div className="flex items-center gap-3 text-sm text-white/80 mb-2">
                        <Globe className="w-4 h-4" />
                        {t('nav.language')}
                      </div>
                      <div className="flex gap-2 ml-7">
                        <button
                          onClick={() => setLanguage('es')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                            language === 'es'
                              ? "bg-gold-500/20 text-gold-400 border-gold-500/40"
                              : "text-white/70 border-white/10 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {language === 'es' && <Check className="w-3 h-3" />}
                          Español
                        </button>
                        <button
                          onClick={() => setLanguage('en')}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                            language === 'en'
                              ? "bg-gold-500/20 text-gold-400 border-gold-500/40"
                              : "text-white/70 border-white/10 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {language === 'en' && <Check className="w-3 h-3" />}
                          English
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-navy-900/50 border-t border-border">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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

        {/* Page content - with bottom padding for mobile nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          {children}
        </main>

        {/* Bottom Navigation Bar - Mobile/Tablet only */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-navy-900/95 backdrop-blur-xl border-t border-border pb-safe">
          <div className="flex items-stretch h-16">
            {bottomNavigation.map((item) => {
              const isActive = item.action !== 'profile' && 
                (pathname === item.href || pathname.startsWith(item.href + '/'));
              
              if (item.action === 'profile') {
                return (
                  <button
                    key={item.href}
                    onClick={() => handleBottomNavClick(item)}
                    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors active:bg-white/5"
                  >
                    <div className="w-7 h-7 rounded-full bg-gold-500/20 flex items-center justify-center">
                      <span className="text-gold-500 font-semibold text-[10px]">
                        {getUserInitials()}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-muted">
                      {item.name}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors active:bg-white/5",
                    isActive ? "text-gold-500" : "text-muted"
                  )}
                >
                  <item.icon className={cn(
                    "w-6 h-6 transition-transform",
                    isActive && "scale-110"
                  )} />
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive && "text-gold-500"
                  )}>
                    {item.name}
                  </span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 bg-gold-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowProfileModal(false)} 
          />
          <Card className="relative w-full max-w-md mx-0 md:mx-4 mb-0 rounded-t-3xl md:rounded-2xl animate-slide-up md:animate-fade-up">
            <div className="pb-safe">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-display">{t('profile.title')}</CardTitle>
                <button 
                  onClick={() => setShowProfileModal(false)} 
                  className="p-2 rounded-xl hover:bg-surface text-muted hover:text-white active:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
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
                  <Label className="text-muted">{t('profile.email')}</Label>
                  <Input value={user.email || ''} disabled className="bg-navy-800/50 border-border/50" />
                </div>

                {/* First Name */}
                <div>
                  <Label>{t('profile.firstName')}</Label>
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    placeholder={t('profile.firstName')}
                    className="h-12"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label>{t('profile.lastName')}</Label>
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    placeholder={t('profile.lastName')}
                    className="h-12"
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label>{t('profile.phone')}</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+507 6000-0000"
                    type="tel"
                    className="h-12"
                  />
                </div>

                {/* Language */}
                <div>
                  <Label className="text-muted">{t('profile.language')}</Label>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setLanguage('es')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
                        language === 'es'
                          ? "bg-gold-500/10 text-gold-500 border-2 border-gold-500/30"
                          : "bg-surface border-2 border-border text-muted hover:text-white"
                      )}
                    >
                      {language === 'es' && <Check className="w-4 h-4" />}
                      {t('profile.language.es')}
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
                        language === 'en'
                          ? "bg-gold-500/10 text-gold-500 border-2 border-gold-500/30"
                          : "bg-surface border-2 border-border text-muted hover:text-white"
                      )}
                    >
                      {language === 'en' && <Check className="w-4 h-4" />}
                      {t('profile.language.en')}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1 h-12" onClick={() => setShowProfileModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button className="flex-1 h-12" onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
