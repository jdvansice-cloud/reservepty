'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  variant = 'default',
  isLoading = false,
  onClick,
  className,
}: StatCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-stone-50 dark:bg-stone-800',
      iconBg: 'bg-stone-100 dark:bg-stone-700',
      iconColor: 'text-stone-600 dark:text-stone-400',
    },
    primary: {
      bg: 'bg-[#0a1628]/5 dark:bg-[#0a1628]/50',
      iconBg: 'bg-[#0a1628]/10 dark:bg-[#0a1628]',
      iconColor: 'text-[#0a1628] dark:text-[#c8b273]',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-200',
        styles.bg,
        onClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
            {title}
          </p>

          {isLoading ? (
            <div className="mt-2 h-9 w-24 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}

          {subtitle && !isLoading && (
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              {subtitle}
            </p>
          )}

          {trend && !isLoading && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            'rounded-xl p-3',
            styles.iconBg
          )}
        >
          <Icon className={cn('h-6 w-6', styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-stone-50 dark:bg-stone-800 p-6 animate-pulse',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 rounded bg-stone-200 dark:bg-stone-700" />
          <div className="mt-2 h-9 w-32 rounded bg-stone-200 dark:bg-stone-700" />
          <div className="mt-2 h-4 w-20 rounded bg-stone-200 dark:bg-stone-700" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-stone-200 dark:bg-stone-700" />
      </div>
    </div>
  );
}

// ============================================================================
// GRID
// ============================================================================

export function StatCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
