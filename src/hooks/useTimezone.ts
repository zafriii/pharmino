"use client";

import { useEffect } from 'react';
import { getUserTimezone } from '@/lib/timezone-utils';

/**
 * Hook to automatically send user timezone to server via headers
 * This ensures server-side expiration logic uses user's local timezone
 */
export function useTimezone() {
  useEffect(() => {
    // Get user's timezone
    const userTimezone = getUserTimezone();
    
    // Store in localStorage for persistence
    localStorage.setItem('userTimezone', userTimezone);
    
    // Set up axios interceptor or fetch wrapper to include timezone in headers
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const headers = new Headers(init?.headers);
      headers.set('x-user-timezone', userTimezone);
      
      return originalFetch(input, {
        ...init,
        headers
      });
    };
    
    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return getUserTimezone();
}

/**
 * Get stored user timezone from localStorage
 * @returns User timezone string or null if not found
 */
export function getStoredTimezone(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userTimezone');
}