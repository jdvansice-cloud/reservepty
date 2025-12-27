'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, SECTIONS, formatDate, formatRelativeTime, isDevMode } from '@/lib/utils';
import {
  Plane,
  Ship,
  Home,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const SECTION_ICONS: Record<string, React.ElementType> = {
  planes: Plane,
  helicopters: Plane,
  residences: Home,
  boats: Ship,
};

// Mock data for development
const mockStats = {
  totalAssets: 12,
  activeBookings: 5,
  totalMembers: 23,
  thisMonthBookings: 18,
};

const mockSectionStats = [
  { section: 'planes', count: 3, bookings: 8 },
  { section: 'helicopters', count: 2, bookings: 3 },
  { section: 'residences', count: 5, bookings: 12 },
  { section: 'boats', count: 2, bookings: 4 },
];

const mockRecentBookings = [
  {
    id: '1',
    assetName: 'Gulfstream G650',
    section: 'planes',
    userName: 'John Smith',
    startDate: new Date(Date.now() + 86400000 * 2),
    endDate: new Date(Date.now() + 86400000 * 2 + 36000000),
    status: 'approved',
  },
  {
    id: '2',
    assetName: 'Miami Beach Villa',
    section: 'residences',
    userName: 'Sarah Johnson',
    startDate: new Date(Date.now() + 86400000 * 5),
    endDate: new Date(Date.now() + 86400000 * 10),
    status: 'pending',
  },
  {
    id: '3',
    assetName: 'Azimut 72',
    section: 'boats',
    userName: 'Michael Chen',
    startDate: new Date(Date.now() + 86400000 * 7),
    endDate: new Date(Date.now() + 86400000 * 9),
    status: 'approved',
  },
  {
    id: '4',
    assetName: 'Bell 429',
    section: 'helicopters',
    userName: 'Emma Williams',
    startDate: new Date(Date.now() - 86400000),
    endDate: new Date(Date.now() - 86400000 + 14400000),
    status: 'completed',
  },
];

const quickActions = [
  { name: 'New Booking', href: '/calendar', icon: Calendar, description: 'Schedule an asset' },
  { name: 'Add Asset', href: '/assets/new', icon: Plus, description: 'Register new asset' },
  { name: 'Invite Member', href: '/members/invite', icon: Users, description: 'Add team members' },
];

export default function DashboardPage() {
  const { profile, organization, membership } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-emerald-400 bg-emerald-400/10';
      case 'pending':
        return 'text-amber-400 bg-amber-400/10';
      case 'rejected':
        return 'text-red-400 bg-red-400/10';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10';
      default:
        return 'text-muted bg-muted/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircle2;
      case 'pending':
        return AlertCircle;
      case 'rejected':
        return XCircle;
      case 'completed':
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            {greeting}, {profile?.first_name || 'there'}
          </h1>
          <p className="text-muted mt-1">
            Here's what's happening with your assets today.
          </p>
        </div>
        {isDevMode() && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Demo Data</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Total Assets</p>
                <p className="text-3xl font-display font-bold text-white mt-1">
                  {mockStats.totalAssets}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                <Plane className="w-6 h-6 text-gold-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Active Bookings</p>
                <p className="text-3xl font-display font-bold text-white mt-1">
                  {mockStats.activeBookings}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Total Members</p>
                <p className="text-3xl font-display font-bold text-white mt-1">
                  {mockStats.totalMembers}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">This Month</p>
                <p className="text-3xl font-display font-bold text-white mt-1">
                  {mockStats.thisMonthBookings}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mockSectionStats.map((stat) => {
          const Icon = SECTION_ICONS[stat.section];
          const sectionInfo = SECTIONS[stat.section as keyof typeof SECTIONS];
          return (
            <Link key={stat.section} href={`/assets?section=${stat.section}`}>
              <Card className="card-hover h-full">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${sectionInfo?.color}20` }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: sectionInfo?.color }}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted capitalize">{stat.section}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-display font-bold text-white">
                          {stat.count}
                        </span>
                        <span className="text-xs text-muted">assets</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted">
                      <span className="text-white font-medium">{stat.bookings}</span> bookings
                      this month
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-display">Recent Bookings</CardTitle>
              <Link href="/calendar">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockRecentBookings.map((booking) => {
                  const Icon = SECTION_ICONS[booking.section];
                  const StatusIcon = getStatusIcon(booking.status);
                  const sectionInfo = SECTIONS[booking.section as keyof typeof SECTIONS];
                  return (
                    <div
                      key={booking.id}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-surface transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${sectionInfo?.color}20` }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: sectionInfo?.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {booking.assetName}
                        </p>
                        <p className="text-xs text-muted">
                          {booking.userName} • {formatDate(booking.startDate)}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                          getStatusColor(booking.status)
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {booking.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface hover:bg-navy-800 transition-all group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                      <action.icon className="w-5 h-5 text-gold-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white group-hover:text-gold-500 transition-colors">
                        {action.name}
                      </p>
                      <p className="text-xs text-muted">{action.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Organization Info */}
          {organization && (
            <Card className="mt-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-display">Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {organization.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={organization.commercial_name || organization.legal_name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gold-500/20 flex items-center justify-center">
                      <span className="text-gold-500 font-display text-2xl font-bold">
                        {(organization.commercial_name || organization.legal_name).charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">
                      {organization.commercial_name || organization.legal_name}
                    </p>
                    {organization.ruc && (
                      <p className="text-xs text-muted mt-0.5">
                        RUC: {organization.ruc}
                        {organization.dv && `-${organization.dv}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Link href="/settings">
                    <Button variant="secondary" size="sm" className="w-full">
                      Manage Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
