'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchEmployee from '../SearchEmployee'; 
import CustomInput from '@/components/shared ui/CustomInput';

export default function AttendanceWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Handle search changes via debounced component
  const handleSearch = (query: string) => {
    updateURL('search', query);
  };

  // Handle date filter changes
  const handleDateChange = (date: string) => {
    updateURL('date', date);
  };

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset page to 1 on filter/search
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const selectedDate = searchParams.get('date') || today;

  return (
    <div className="space-y-6">
      {/* Search + Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        {/* Search Employee */}
        <div className="flex-1 w-full md:max-w-2xl">
          <SearchEmployee
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>

        {/* Date Filter */}
        <div className="flex-shrink-0">
          <div className="relative">            
            <CustomInput
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={today} // prevent future dates
            />
          </div>
        </div>
      </div>
    </div>
  );
}