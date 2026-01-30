'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface LoadingStateProps {
  /** Loading message to display */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show as full page */
  fullPage?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// SIZE MAPPINGS
// ============================================================================

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

// ============================================================================
// LOADING SPINNER COMPONENT
// ============================================================================

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        'animate-spin text-[#c8b273]',
        spinnerSizes[size],
        className
      )}
    />
  );
}

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  fullPage = false,
  className,
}: LoadingStateProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      <LoadingSpinner size={size} />
      {message && (
        <p className={cn('text-stone-500', textSizes[size])}>{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-stone-200 dark:bg-stone-700',
        className
      )}
    />
  );
}

// ============================================================================
// SKELETON VARIANTS
// ============================================================================

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border bg-white p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return <Skeleton className={cn('rounded-full', sizes[size], className)} />;
}

export function SkeletonButton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return <Skeleton className={cn('rounded-lg', sizes[size], className)} />;
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

export function LoadingOverlay({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-white/80 dark:bg-stone-900/80 flex items-center justify-center z-50',
        className
      )}
    >
      <LoadingState message={message} />
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LoadingState;
