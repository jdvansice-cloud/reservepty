'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plane,
  Ship,
  Home,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Gift,
  Activity,
  Zap,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isDevMode } from '@/lib/utils';

// Mock platform statistics
const platformStats = {
  organizations: {
    total: 47,
    active: 42,
    trial: 5,
    growth: 12.5,
  },
  users: {
    total: 683,
    activeThisMonth: 412,
    growth: 8.3,
  },
  revenue: {
    mrr: 24850,
    arr: 298200,
    growth: 15.2,
  },
  bookings: {
    thisMonth: 234,
    total: 4521,
    growth: 22.1,
  },
};

const sectionStats = [
  { name: 'Planes', icon: Plane, count: 89, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { name: 'Helicopters', icon: Plane, count: 34, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { name: 'Residences & Spaces', icon: Home, count: 156, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { name: 'Boats', icon: Ship, count: 67, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

const recentOrganizations = [
  {
    id: '1',
    name: 'Luxury Holdings LLC',
    plan: 'Enterprise',
    users: 45,
    status: 'active',
    createdAt: '2025-01-15',
    mrr: 1200,
  },
  {
    id: '2',
    name: 'Pacific Aviation Group',
    plan: 'Professional',
    users: 12,
    status: 'active',
    createdAt: '2025-01-14',
    mrr: 599,
  },
  {
    id: '3',
    name: 'Smith Family Office',
    plan: 'Starter',
    users: 5,
    status: 'trial',
    createdAt: '2025-01-13',
    mrr: 0,
  },
  {
    id: '4',
    name: 'Caribbean Charters Inc',
    plan: 'Professional',
    users: 18,
    status: 'active',
    createdAt: '2025-01-12',
    mrr: 599,
  },
  {
    id: '5',
    name: 'Alpine Retreats SA',
    plan: 'Professional',
    users: 8,
    status: 'complimentary',
    createdAt: '2025-01-10',
    mrr: 0,
  },
];

const recentActivity = [
  {
    id: '1',
    type: 'org_created',
    message: 'New organization "Luxury Holdings LLC" registered',
    time: '2 hours ago',
    icon: Building2,
  },
  {
    id: '2',
    type: 'subscription',
    message: 'Pacific Aviation Group upgraded to Professional',
    time: '5 hours ago',
    icon: CreditCard,
  },
  {
    id: '3',
    type: 'complimentary',
    message: 'Complimentary access granted to Alpine Retreats SA',
    time: '1 day ago',
    icon: Gift,
  },
  {
    id: '4',
    type: 'user_joined',
    message: '12 new users joined across 3 organizations',
    time: '1 day ago',
    icon: Users,
  },
  {
    id: '5',
    type: 'alert',
    message: 'Trial ending soon for Smith Family Office',
    time: '2 days ago',
    icon: AlertCircle,
  },
];

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  trial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  complimentary: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  past_due: 'bg-red-500/10 text-red-400 border-red-500/20',
  canceled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Platform Dashboard
          </h1>
          <p className="text-muted mt-1">
            Overview of ReservePTY platform performance
          </p>
        </div>
        {isDevMode() && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Dev Mode</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Organizations */}
        <div className="card p-6 hover:border-red-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              {platformStats.organizations.growth}%
            </div>
          </div>
          <p className="text-3xl font-display font-semibold text-white">
            {platformStats.organizations.total}
          </p>
          <p className="text-muted text-sm mt-1">Total Organizations</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span>{platformStats.organizations.active} active</span>
            <span>{platformStats.organizations.trial} trial</span>
          </div>
        </div>

        {/* Users */}
        <div className="card p-6 hover:border-red-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              {platformStats.users.growth}%
            </div>
          </div>
          <p className="text-3xl font-display font-semibold text-white">
            {platformStats.users.total}
          </p>
          <p className="text-muted text-sm mt-1">Total Users</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span>{platformStats.users.activeThisMonth} active this month</span>
          </div>
        </div>

        {/* MRR */}
        <div className="card p-6 hover:border-red-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              {platformStats.revenue.growth}%
            </div>
          </div>
          <p className="text-3xl font-display font-semibold text-white">
            ${platformStats.revenue.mrr.toLocaleString()}
          </p>
          <p className="text-muted text-sm mt-1">Monthly Recurring Revenue</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span>ARR: ${platformStats.revenue.arr.toLocaleString()}</span>
          </div>
        </div>

        {/* Bookings */}
        <div className="card p-6 hover:border-red-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              {platformStats.bookings.growth}%
            </div>
          </div>
          <p className="text-3xl font-display font-semibold text-white">
            {platformStats.bookings.thisMonth}
          </p>
          <p className="text-muted text-sm mt-1">Bookings This Month</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span>{platformStats.bookings.total.toLocaleString()} total</span>
          </div>
        </div>
      </div>

      {/* Section breakdown */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-white mb-4">
          Assets by Section
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sectionStats.map((section) => (
            <div
              key={section.name}
              className="p-4 rounded-xl bg-navy-800/50 border border-border hover:border-border/80 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${section.bg} flex items-center justify-center`}>
                  <section.icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <span className="text-white font-medium">{section.name}</span>
              </div>
              <p className="text-2xl font-display font-semibold text-white">
                {section.count}
              </p>
              <p className="text-sm text-muted">registered assets</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent organizations */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold text-white">
              Recent Organizations
            </h2>
            <Link href="/admin/organizations">
              <Button variant="ghost" size="sm">
                View All →
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrganizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 rounded-xl bg-navy-800/50 hover:bg-navy-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{org.name}</p>
                    <p className="text-sm text-muted">{org.users} users • {org.plan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[org.status as keyof typeof statusColors]}`}>
                    {org.status}
                  </span>
                  {org.mrr > 0 && (
                    <p className="text-sm text-muted mt-1">${org.mrr}/mo</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold text-white">
              Recent Activity
            </h2>
            <Link href="/admin/logs">
              <Button variant="ghost" size="sm">
                View All →
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-navy-800/30 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'alert' 
                    ? 'bg-amber-500/10' 
                    : activity.type === 'complimentary'
                    ? 'bg-purple-500/10'
                    : 'bg-navy-800'
                }`}>
                  <activity.icon className={`w-4 h-4 ${
                    activity.type === 'alert' 
                      ? 'text-amber-400' 
                      : activity.type === 'complimentary'
                      ? 'text-purple-400'
                      : 'text-muted'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{activity.message}</p>
                  <p className="text-xs text-muted mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/organizations/new">
            <div className="p-4 rounded-xl bg-navy-800/50 border border-border hover:border-red-500/30 transition-all cursor-pointer group">
              <Building2 className="w-8 h-8 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-white mb-1">Create Organization</h3>
              <p className="text-sm text-muted">Add a new organization manually</p>
            </div>
          </Link>
          <Link href="/admin/complimentary">
            <div className="p-4 rounded-xl bg-navy-800/50 border border-border hover:border-purple-500/30 transition-all cursor-pointer group">
              <Gift className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-white mb-1">Grant Complimentary</h3>
              <p className="text-sm text-muted">Give free access to an organization</p>
            </div>
          </Link>
          <Link href="/admin/logs">
            <div className="p-4 rounded-xl bg-navy-800/50 border border-border hover:border-blue-500/30 transition-all cursor-pointer group">
              <FileText className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-white mb-1">View Activity Logs</h3>
              <p className="text-sm text-muted">Monitor platform activity</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
