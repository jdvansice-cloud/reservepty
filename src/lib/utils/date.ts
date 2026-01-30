/**
 * Date Utility Functions
 *
 * Helpers for date manipulation, formatting, and timezone handling.
 */

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format a date to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format a date to ISO datetime string
 */
export function toISODateTimeString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Format a date for display (localized)
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale = 'en-US'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, options);
}

/**
 * Format a date and time for display
 */
export function formatDateTime(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  locale = 'en-US'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, options);
}

/**
 * Format time only
 */
export function formatTime(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  },
  locale = 'en-US'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale, options);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelative(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSecs) < 60) {
    return rtf.format(diffSecs, 'second');
  } else if (Math.abs(diffMins) < 60) {
    return rtf.format(diffMins, 'minute');
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  } else if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, 'day');
  } else if (Math.abs(diffWeeks) < 4) {
    return rtf.format(diffWeeks, 'week');
  } else {
    return rtf.format(diffMonths, 'month');
  }
}

// ============================================================================
// DATE CALCULATIONS
// ============================================================================

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add hours to a date
 */
export function addHours(date: Date | string, hours: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date | string, minutes: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setTime(d.getTime() + minutes * 60 * 1000);
  return d;
}

/**
 * Get the difference between two dates in days
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get the difference between two dates in hours
 */
export function hoursBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60));
}

/**
 * Get the difference between two dates in minutes
 */
export function minutesBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (1000 * 60));
}

// ============================================================================
// DATE COMPARISONS
// ============================================================================

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if two date ranges overlap
 */
export function rangesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? new Date(start1) : start1;
  const e1 = typeof end1 === 'string' ? new Date(end1) : end1;
  const s2 = typeof start2 === 'string' ? new Date(start2) : start2;
  const e2 = typeof end2 === 'string' ? new Date(end2) : end2;

  return s1 < e2 && e1 > s2;
}

/**
 * Check if a date is within a range
 */
export function isWithinRange(
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;

  return d >= s && d <= e;
}

// ============================================================================
// DATE RANGE HELPERS
// ============================================================================

/**
 * Get the start of a day
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a day
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get the start of a week (Sunday)
 */
export function startOfWeek(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a week (Saturday)
 */
export function endOfWeek(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get the start of a month
 */
export function startOfMonth(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a month
 */
export function endOfMonth(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ============================================================================
// CALENDAR HELPERS
// ============================================================================

/**
 * Get days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get an array of dates for a calendar month view
 * Includes padding days from previous/next months
 */
export function getCalendarDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    dates.push(d);
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }

  // Add padding days from next month to complete the grid
  const endPadding = 42 - dates.length; // 6 rows * 7 days
  for (let i = 1; i <= endPadding; i++) {
    dates.push(new Date(year, month + 1, i));
  }

  return dates;
}

// ============================================================================
// TIMEZONE HELPERS
// ============================================================================

/**
 * Convert a date to a specific timezone
 */
export function toTimezone(date: Date | string, timezone: string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: timezone }));
}

/**
 * Get the current timezone offset in minutes
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Get the timezone name
 */
export function getTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
