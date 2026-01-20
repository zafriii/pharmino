import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

/**
 * Get the application's configured timezone
 * Priority: APP_TIMEZONE env > Internationalization API > UTC
 */
export function getAppTimezone(): string {
  return process.env.APP_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/**
 * Get today's date in YYYY-MM-DD format using the application's timezone
 */
export function getTodayLocalDate(): string {
  const tz = getAppTimezone();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD
  return formatter.format(new Date());
}

/**
 * Get today's midnight (start of day) in the application's timezone, returned as UTC Date
 */
export function getTodayMidnightInTimezone(): Date {
  const tz = getAppTimezone();
  const now = new Date();

  // 1. Get components of the current date in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const year = parseInt(getPart('year'));
  const month = parseInt(getPart('month')) - 1; // 0-indexed
  const day = parseInt(getPart('day'));

  // 2. This is the Year-Month-Day we want at 00:00:00 in that timezone.
  const utcMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0));

  // 3. Find the offset by seeing what components utcMidnight has in the target TZ
  const partsTZ = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(utcMidnight);

  const getPartTZ = (type: string) => parseInt(partsTZ.find(p => p.type === type)?.value || '0');

  const yearTZ = getPartTZ('year');
  const monthTZ = getPartTZ('month') - 1;
  const dayTZ = getPartTZ('day');
  const hourTZ = getPartTZ('hour');
  const minuteTZ = getPartTZ('minute');

  const seenByTZ = Date.UTC(yearTZ, monthTZ, dayTZ, hourTZ, minuteTZ);
  const offsetMs = utcMidnight.getTime() - seenByTZ;

  return new Date(utcMidnight.getTime() + offsetMs);
}
