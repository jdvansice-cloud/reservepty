'use client';

import { Plane, Navigation, Home, Anchor, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

type AssetSection = Database['public']['Enums']['asset_section'];

export interface SectionStatsCardProps {
  section: AssetSection;
  assetCount: number;
  bookingCount: number;
  utilizationRate: number;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const sectionConfig: Record<
  AssetSection,
  {
    icon: typeof Plane;
    label: string;
    labelEs: string;
    color: string;
    bgColor: string;
    iconBgColor: string;
  }
> = {
  planes: {
    icon: Plane,
    label: 'Planes',
    labelEs: 'Aviones',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/40',
  },
  helicopters: {
    icon: Navigation,
    label: 'Helicopters',
    labelEs: 'Helicópteros',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    iconBgColor: 'bg-purple-100 dark:bg-purple-900/40',
  },
  residences: {
    icon: Home,
    label: 'Residences',
    labelEs: 'Residencias',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconBgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  watercraft: {
    icon: Anchor,
    label: 'Watercraft',
    labelEs: 'Embarcaciones',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    iconBgColor: 'bg-cyan-100 dark:bg-cyan-900/40',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SectionStatsCard({
  section,
  assetCount,
  bookingCount,
  utilizationRate,
  isLoading = false,
  onClick,
  className,
}: SectionStatsCardProps) {
  const config = sectionConfig[section];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-2xl p-5 transition-all duration-200',
        config.bgColor,
        onClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('rounded-xl p-2.5', config.iconBgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">
          {config.label}
        </h3>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-20 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          <div className="h-4 w-24 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          <div className="h-4 w-16 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500 dark:text-stone-400">Assets</span>
            <span className="font-medium text-stone-900 dark:text-stone-100">
              {assetCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500 dark:text-stone-400">
              Bookings (Month)
            </span>
            <span className="font-medium text-stone-900 dark:text-stone-100">
              {bookingCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500 dark:text-stone-400">
              Utilization
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {utilizationRate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {!isLoading && (
        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                config.color.replace('text-', 'bg-')
              )}
              style={{ width: `${Math.min(100, utilizationRate)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

export function SectionStatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-stone-50 dark:bg-stone-800 p-5 animate-pulse',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-stone-200 dark:bg-stone-700" />
        <div className="h-5 w-24 rounded bg-stone-200 dark:bg-stone-700" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-stone-200 dark:bg-stone-700" />
        <div className="h-4 w-full rounded bg-stone-200 dark:bg-stone-700" />
        <div className="h-4 w-full rounded bg-stone-200 dark:bg-stone-700" />
      </div>
      <div className="mt-4 h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-700" />
    </div>
  );
}

// ============================================================================
// GRID
// ============================================================================

export function SectionStatsGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        className
      )}
    >
      {children}
    </div>
  );
}
