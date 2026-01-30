/**
 * Utilities Index
 *
 * Re-export all utility functions for easy imports
 */

// Date utilities
export {
  // Formatting
  toISODateString,
  toISODateTimeString,
  formatDate,
  formatDateTime,
  formatTime,
  formatRelative,
  // Calculations
  addDays,
  addHours,
  addMinutes,
  daysBetween,
  hoursBetween,
  minutesBetween,
  // Comparisons
  isPast,
  isFuture,
  isToday,
  rangesOverlap,
  isWithinRange,
  // Date range helpers
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  // Calendar helpers
  getDaysInMonth,
  getCalendarDates,
  // Timezone helpers
  toTimezone,
  getTimezoneOffset,
  getTimezoneName,
} from './date';

// Formatting utilities
export {
  // Number formatting
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBytes,
  formatCompact,
  formatDecimal,
  // Text formatting
  capitalize,
  titleCase,
  kebabCase,
  camelCase,
  snakeCase,
  truncate,
  stripHtml,
  pluralize,
  formatName,
  getInitials,
  // Phone formatting
  formatPhoneNumber,
  // Address formatting
  formatAddress,
  // Duration formatting
  formatDuration,
  formatDurationHHMM,
  // Status formatting
  formatStatus,
  getStatusColor,
  // Section formatting
  formatSection,
  getSectionIcon,
  getSectionColor,
  // Role formatting
  formatRole,
} from './formatting';
