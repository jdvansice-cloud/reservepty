'use client';

import { formatDistanceToNow, format } from 'date-fns';
import { Plane, Navigation, Home, Anchor, Clock, User, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';
import type { RecentBooking } from '@/lib/services/DashboardService';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

type AssetSection = Database['public']['Enums']['asset_section'];
type ReservationStatus = Database['public']['Enums']['reservation_status'];

export interface RecentBookingsListProps {
  bookings: RecentBooking[];
  title?: string;
  emptyMessage?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const sectionIcons: Record<AssetSection, typeof Plane> = {
  planes: Plane,
  helicopters: Navigation,
  residences: Home,
  watercraft: Anchor,
};

const statusConfig: Record<
  ReservationStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
  },
  canceled: {
    label: 'Canceled',
    color: 'text-stone-500 dark:text-stone-400',
    bgColor: 'bg-stone-100 dark:bg-stone-800',
  },
};

function formatBookingTime(startDatetime: string, endDatetime: string): string {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const isSameDay = start.toDateString() === end.toDateString();

  if (isSameDay) {
    return `${format(start, 'MMM d')} • ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  }

  return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RecentBookingsList({
  bookings,
  title = 'Recent Bookings',
  emptyMessage = 'No recent bookings',
  showViewAll = true,
  viewAllHref = '/reservations',
  isLoading = false,
  className,
}: RecentBookingsListProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">
          {title}
        </h3>
        {showViewAll && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-[#c8b273] hover:text-[#c8b273]/80 transition-colors flex items-center gap-1"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <BookingItemSkeleton key={i} />
          ))
        ) : bookings.length === 0 ? (
          // Empty state
          <div className="px-6 py-8 text-center">
            <Clock className="h-10 w-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {emptyMessage}
            </p>
          </div>
        ) : (
          // Booking items
          bookings.map((booking) => (
            <BookingItem key={booking.id} booking={booking} />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BOOKING ITEM
// ============================================================================

function BookingItem({ booking }: { booking: RecentBooking }) {
  const SectionIcon = sectionIcons[booking.assetSection];
  const status = statusConfig[booking.status];

  return (
    <Link
      href={`/calendar?reservation=${booking.id}`}
      className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {booking.userAvatar ? (
          <img
            src={booking.userAvatar}
            alt={booking.userName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <User className="h-5 w-5 text-stone-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
            {booking.title || booking.assetName}
          </p>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              status.bgColor,
              status.color
            )}
          >
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-stone-500 dark:text-stone-400">
          <SectionIcon className="h-3.5 w-3.5" />
          <span className="truncate">{booking.assetName}</span>
          <span>•</span>
          <span>{booking.userName}</span>
        </div>
      </div>

      {/* Time */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
          {formatBookingTime(booking.startDatetime, booking.endDatetime)}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function BookingItemSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 rounded bg-stone-200 dark:bg-stone-700" />
        <div className="h-3 w-32 rounded bg-stone-200 dark:bg-stone-700" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-stone-200 dark:bg-stone-700" />
        <div className="h-3 w-16 rounded bg-stone-200 dark:bg-stone-700" />
      </div>
    </div>
  );
}

export function RecentBookingsListSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800',
        className
      )}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="h-5 w-32 rounded bg-stone-200 dark:bg-stone-700 animate-pulse" />
        <div className="h-4 w-16 rounded bg-stone-200 dark:bg-stone-700 animate-pulse" />
      </div>
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {Array.from({ length: 3 }).map((_, i) => (
          <BookingItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
