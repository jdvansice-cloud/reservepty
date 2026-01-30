'use client';

import { LucideIcon, Package, Search, FileText, Users, Calendar, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// SIZE MAPPINGS
// ============================================================================

const iconContainerSizes = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

const iconSizes = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const titleSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

const descriptionSizes = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4',
          iconContainerSizes[size]
        )}
      >
        <Icon
          className={cn(
            'text-stone-400 dark:text-stone-500',
            iconSizes[size]
          )}
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'font-semibold text-stone-900 dark:text-stone-100',
          titleSizes[size]
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-stone-500 dark:text-stone-400 mt-1 max-w-sm',
            descriptionSizes[size]
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {action && (
            <Button
              onClick={action.onClick}
              className="bg-[#0a1628] hover:bg-[#0a1628]/90 gap-2"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PRESET EMPTY STATES
// ============================================================================

interface PresetEmptyStateProps {
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state for no search results
 */
export function NoSearchResults({
  query,
  onClear,
  className,
}: {
  query?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        query
          ? `No results match "${query}". Try adjusting your search or filters.`
          : 'Try adjusting your search or filters.'
      }
      action={
        onClear
          ? { label: 'Clear Search', onClick: onClear }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * Empty state for no assets
 */
export function NoAssets({ action, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="No assets yet"
      description="Add your first asset to start managing reservations."
      action={action ? { label: action.label, onClick: action.onClick, icon: Package } : undefined}
      className={className}
    />
  );
}

/**
 * Empty state for no reservations
 */
export function NoReservations({ action, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Calendar}
      title="No reservations"
      description="There are no reservations to display. Create your first booking to get started."
      action={action ? { label: action.label, onClick: action.onClick, icon: Calendar } : undefined}
      className={className}
    />
  );
}

/**
 * Empty state for no pending approvals
 */
export function NoPendingApprovals({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={FileText}
      title="All caught up!"
      description="There are no pending reservations that require your approval."
      size="sm"
      className={className}
    />
  );
}

/**
 * Empty state for no members
 */
export function NoMembers({ action, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Users}
      title="No members yet"
      description="Invite team members to collaborate on asset management."
      action={action ? { label: action.label, onClick: action.onClick, icon: Users } : undefined}
      className={className}
    />
  );
}

/**
 * Empty state for no upcoming trips/flights
 */
export function NoUpcomingTrips({ action, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Plane}
      title="No upcoming trips"
      description="You don't have any upcoming reservations. Book your next trip to see it here."
      action={action ? { label: action.label, onClick: action.onClick } : undefined}
      size="sm"
      className={className}
    />
  );
}

/**
 * Empty state for error/failed to load
 */
export function LoadError({
  onRetry,
  message = 'Failed to load data',
  className,
}: {
  onRetry?: () => void;
  message?: string;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Package}
      title="Something went wrong"
      description={message}
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
      className={className}
    />
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default EmptyState;
