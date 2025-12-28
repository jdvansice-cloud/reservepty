'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  LayoutDashboard,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Plane,
  ChevronUp,
  Globe,
  User
} from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, organization, loading, signOut, subscription } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2b4a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c8b273] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/assets', icon: Package, label: t('assets') },
    { href: '/calendar', icon: Calendar, label: t('calendar') },
    { href: '/reservations', icon: Clock, label: t('reservations') },
    { href: '/approvals', icon: CheckCircle, label: t('approvals') },
    { href: '/settings', icon: Settings, label: t('settings') },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2b4a]">
      {/* Trial Banner */}
      {subscription?.status === 'trial' && trialDaysLeft > 0 && (
        <div className="bg-[#c8b273] text-[#0a1628] text-center py-2 text-sm font-medium">
          {language === 'en' 
            ? `${trialDaysLeft} days left in your free trial.`
            : `${trialDaysLeft} días restantes de tu prueba gratuita.`
          }
          <Link href="/upgrade" className="underline ml-2">
            {language === 'en' ? 'Upgrade Now' : 'Mejorar Ahora'}
          </Link>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#0a1628]/50 border-r border-white/10">
          <div className="p-6 border-b border-white/10">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#c8b273] rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-[#0a1628]" />
              </div>
              <span className="text-white font-semibold text-lg">ReservePTY</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-[#c8b273] text-[#0a1628]'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <div className="w-8 h-8 bg-[#c8b273] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-[#0a1628]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-white">{profile?.first_name || 'User'}</p>
                  <p className="text-xs text-white/50">{organization?.commercial_name}</p>
                </div>
                <ChevronUp className={`w-4 h-4 transition-transform ${userMenuOpen ? '' : 'rotate-180'}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a2b4a] rounded-lg border border-white/10 overflow-hidden">
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Globe className="w-5 h-5" />
                    {language === 'en' ? 'Español' : 'English'}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <LogOut className="w-5 h-5" />
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#0a1628] border-b border-white/10 z-50">
          <div className="flex items-center justify-between p-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#c8b273] rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-[#0a1628]" />
              </div>
              <span className="text-white font-semibold">ReservePTY</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-[#0a1628] z-40 pt-16">
            <nav className="p-4 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-[#c8b273] text-[#0a1628]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
                {t('signOut')}
              </button>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t border-white/10 safe-area-bottom">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 ${
                pathname === item.href ? 'text-[#c8b273]' : 'text-white/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
