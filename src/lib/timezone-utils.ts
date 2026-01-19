/**
 * Timezone utility functions for handling user timezone detection and conversion
 */

/**
 * Get user's timezone from browser or default to a fallback
 * @param fallbackTimezone - Fallback timezone if detection fails
 * @returns User's timezone string (e.g., 'Asia/Kolkata', 'America/New_York')
 */
export function getUserTimezone(fallbackTimezone: string = 'UTC'): string {
  try {
    // Try to get timezone from browser
    if (typeof window !== 'undefined' && Intl && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    
    // Fallback for server-side or unsupported browsers
    return fallbackTimezone;
  } catch (error) {
    console.warn('Failed to detect user timezone:', error);
    return fallbackTimezone;
  }
}

/**
 * Get timezone from request headers (for server-side detection)
 * @param request - NextRequest object
 * @returns Timezone string or null if not found
 */
export function getTimezoneFromRequest(request: Request): string | null {
  try {
    // Check for timezone in headers (if client sends it)
    const timezoneHeader = request.headers.get('x-user-timezone');
    if (timezoneHeader) {
      return timezoneHeader;
    }
    
    // Could also check for other timezone indicators in headers
    // like Accept-Language, but timezone is more accurate
    
    return null;
  } catch (error) {
    console.warn('Failed to get timezone from request:', error);
    return null;
  }
}

/**
 * Get current date in a specific timezone
 * @param timezone - Timezone string (e.g., 'Asia/Kolkata')
 * @returns Date object representing current date in the specified timezone
 */
export function getCurrentDateInTimezone(timezone: string): Date {
  try {
    const now = new Date();
    const userDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    return new Date(userDate.getFullYear(), userDate.getMonth(), userDate.getDate());
  } catch (error) {
    console.warn('Failed to get date in timezone:', timezone, error);
    // Fallback to system timezone
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

/**
 * Convert a date to UTC for database storage while preserving the local date
 * @param localDate - Local date object
 * @returns UTC date object for database storage
 */
export function convertLocalDateToUTC(localDate: Date): Date {
  return new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate()
  ));
}

/**
 * Common timezone mappings for fallback
 */
export const COMMON_TIMEZONES = {
  'Bangladesh': 'Asia/Dhaka',
  'India': 'Asia/Kolkata',
  'US_Eastern': 'America/New_York',
  'US_Central': 'America/Chicago',
  'US_Mountain': 'America/Denver',
  'US_Pacific': 'America/Los_Angeles',
  'UK': 'Europe/London',
  'Germany': 'Europe/Berlin',
  'Japan': 'Asia/Tokyo',
  'Australia_Sydney': 'Australia/Sydney',
  'UTC': 'UTC'
} as const;