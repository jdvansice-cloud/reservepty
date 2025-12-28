import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if we're in development mode (bypass payments, etc.)
 */
export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true';
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random ID
 */
export function generateId(length: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Section configuration
 */
export const SECTIONS = {
  planes: {
    label: 'Planes',
    icon: 'Plane',
    color: '#c8b273',
    description: 'Private jets and aircraft',
  },
  helicopters: {
    label: 'Helicopters',
    icon: 'Helicopter',
    color: '#22c55e',
    description: 'Helicopters and rotorcraft',
  },
  residences: {
    label: 'Residences & Spaces',
    icon: 'Home',
    color: '#3b82f6',
    description: 'Properties, homes, and meeting spaces',
  },
  watercraft: {
    label: 'Watercraft',
    icon: 'Ship',
    color: '#8b5cf6',
    description: 'Yachts, boats, and marine vessels',
  },
} as const;

/**
 * Seat tier options
 */
export const SEAT_TIERS = [5, 10, 25, 50, 100] as const;

/**
 * Role display names and permissions
 */
export const ROLES = {
  owner: {
    label: 'Owner',
    description: 'Full organization control',
    permissions: ['all'],
  },
  admin: {
    label: 'Administrator',
    description: 'Manage assets and members',
    permissions: ['manage_assets', 'manage_members', 'approve_bookings'],
  },
  manager: {
    label: 'Manager',
    description: 'Approve bookings and view reports',
    permissions: ['approve_bookings', 'view_reports'],
  },
  member: {
    label: 'Member',
    description: 'Create and manage own bookings',
    permissions: ['create_bookings', 'view_assets'],
  },
  viewer: {
    label: 'Viewer',
    description: 'View-only access',
    permissions: ['view_assets', 'view_calendar'],
  },
} as const;
