/**
 * Formatting Utility Functions
 *
 * Helpers for formatting numbers, currency, text, and other data types.
 */

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format a number with thousands separators
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercent(
  value: number,
  decimals = 0,
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format a number with a compact notation (e.g., 1.5K, 2.3M)
 */
export function formatCompact(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Format a decimal number with fixed precision
 */
export function formatDecimal(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

// ============================================================================
// TEXT FORMATTING
// ============================================================================

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalize the first letter of each word
 */
export function titleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert to kebab-case
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert to camelCase
 */
export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^./, (c) => c.toLowerCase());
}

/**
 * Convert to snake_case
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Truncate a string with ellipsis
 */
export function truncate(str: string, length: number, suffix = '...'): string {
  if (!str || str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Remove HTML tags from a string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Pluralize a word based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  const p = plural || singular + 's';
  return count === 1 ? singular : p;
}

/**
 * Format a name (first + last)
 */
export function formatName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = 'Unknown'
): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : fallback;
}

/**
 * Get initials from a name
 */
export function getInitials(
  name: string,
  maxLength = 2
): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, maxLength)
    .join('');
}

// ============================================================================
// PHONE NUMBER FORMATTING
// ============================================================================

/**
 * Format a phone number for display
 */
export function formatPhoneNumber(phone: string, countryCode = '+1'): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // US/Canada format: (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `${countryCode} (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // International with country code
  if (digits.length > 10) {
    return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  }

  return phone;
}

// ============================================================================
// ADDRESS FORMATTING
// ============================================================================

/**
 * Format an address for display
 */
export function formatAddress(
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  },
  multiLine = false
): string {
  const parts: string[] = [];

  if (address.street) parts.push(address.street);

  const cityState = [address.city, address.state].filter(Boolean).join(', ');
  if (cityState) parts.push(cityState);

  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);

  return multiLine ? parts.join('\n') : parts.join(', ');
}

// ============================================================================
// DURATION FORMATTING
// ============================================================================

/**
 * Format a duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

/**
 * Format a duration as HH:MM
 */
export function formatDurationHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// ============================================================================
// STATUS FORMATTING
// ============================================================================

/**
 * Get human-readable status label
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    canceled: 'Cancelled',
    completed: 'Completed',
    active: 'Active',
    inactive: 'Inactive',
    trial: 'Trial',
    past_due: 'Past Due',
    complimentary: 'Complimentary',
  };

  return statusMap[status] || titleCase(status.replace(/_/g, ' '));
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    approved: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50',
    canceled: 'text-stone-600 bg-stone-100',
    completed: 'text-blue-600 bg-blue-50',
    active: 'text-green-600 bg-green-50',
    inactive: 'text-stone-600 bg-stone-100',
    trial: 'text-purple-600 bg-purple-50',
    past_due: 'text-red-600 bg-red-50',
    complimentary: 'text-gold-600 bg-gold-50',
  };

  return colorMap[status] || 'text-stone-600 bg-stone-100';
}

// ============================================================================
// ASSET SECTION FORMATTING
// ============================================================================

/**
 * Get human-readable section label
 */
export function formatSection(section: string): string {
  const sectionMap: Record<string, string> = {
    planes: 'Planes',
    helicopters: 'Helicopters',
    residences: 'Residences',
    boats: 'Boats',
    watercraft: 'Watercraft',
  };

  return sectionMap[section] || titleCase(section);
}

/**
 * Get section icon name (for use with Lucide icons)
 */
export function getSectionIcon(section: string): string {
  const iconMap: Record<string, string> = {
    planes: 'Plane',
    helicopters: 'Helicopter',
    residences: 'Home',
    boats: 'Ship',
    watercraft: 'Ship',
  };

  return iconMap[section] || 'Package';
}

/**
 * Get section color class
 */
export function getSectionColor(section: string): string {
  const colorMap: Record<string, string> = {
    planes: 'text-blue-600 bg-blue-50 border-blue-200',
    helicopters: 'text-orange-600 bg-orange-50 border-orange-200',
    residences: 'text-green-600 bg-green-50 border-green-200',
    boats: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    watercraft: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  };

  return colorMap[section] || 'text-stone-600 bg-stone-50 border-stone-200';
}

// ============================================================================
// ROLE FORMATTING
// ============================================================================

/**
 * Format a role for display
 */
export function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    manager: 'Manager',
    member: 'Member',
    viewer: 'Viewer',
    super_admin: 'Super Admin',
    support: 'Support',
  };

  return roleMap[role] || titleCase(role);
}
