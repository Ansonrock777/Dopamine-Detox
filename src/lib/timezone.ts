/**
 * Timezone utilities for consistent date handling across the habit tracking system
 * All dates use the user's local timezone to ensure proper day detection
 */

/**
 * Get today's date in the user's local timezone as YYYY-MM-DD string
 */
export function getTodayLocalDate(): string {
  const today = new Date();
  return formatLocalDate(today);
}

/**
 * Format a Date object to YYYY-MM-DD string using local timezone
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day in local timezone
 */
export function isSameLocalDay(date1: Date, date2: Date): boolean {
  return formatLocalDate(date1) === formatLocalDate(date2);
}

/**
 * Check if a date is today in local timezone
 */
export function isToday(date: Date): boolean {
  return isSameLocalDay(date, new Date());
}

/**
 * Check if a date is in the future (relative to today in local timezone)
 */
export function isFuture(date: Date): boolean {
  const today = new Date();
  return date > today;
}

/**
 * Get the start of today in local timezone
 */
export function getStartOfToday(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

/**
 * Parse a YYYY-MM-DD string to Date object (assumes local timezone)
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}