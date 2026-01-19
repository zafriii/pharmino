"use client";

import { useTimezone } from '@/hooks/useTimezone';

/**
 * Component that initializes timezone detection and header injection
 * Should be included in the root layout to ensure all API calls include timezone
 */
export default function TimezoneProvider({ children }: { children: React.ReactNode }) {
  // Initialize timezone detection and header injection
  useTimezone();
  
  return <>{children}</>;
}