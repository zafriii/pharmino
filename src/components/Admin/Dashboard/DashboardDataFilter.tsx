'use client';

import React, { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomDropdown from '@/components/shared ui/CustomDropdown';
import { Calendar, Filter } from 'lucide-react';
import Button from '@/components/shared ui/Button';

interface Option {
  label: string;
  value: string | number;
}

const periodOptions: Option[] = [
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last Month', value: 'lastmonth' },
  { label: 'This Month', value: 'thismonth' },
  { label: 'Custom Range', value: 'custom' },
];

export default function DashboardDataFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const currentPeriod = searchParams.get('period') || '';
  const currentStartDate = searchParams.get('startDate') || '';
  const currentEndDate = searchParams.get('endDate') || '';
  
  const [showCustomRange, setShowCustomRange] = useState(currentPeriod === 'custom');
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);

  // Update state when URL parameters change
  useEffect(() => {
    setShowCustomRange(currentPeriod === 'custom');
    setStartDate(currentStartDate);
    setEndDate(currentEndDate);
  }, [currentPeriod, currentStartDate, currentEndDate]);

  const updateURL = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  const handlePeriodChange = useCallback((value: string) => {
    if (value === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
      // Clear custom date params when switching to predefined periods
      const params = new URLSearchParams(searchParams.toString());
      params.delete('startDate');
      params.delete('endDate');
      if (value) {
        params.set('period', value);
      } else {
        params.delete('period');
      }
      
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    }
  }, [searchParams, router]);

  const handleCustomDateApply = useCallback(() => {
    if (startDate && endDate) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('period', 'custom');
      params.set('startDate', startDate);
      params.set('endDate', endDate);
      
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    }
  }, [startDate, endDate, searchParams, router]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    setShowCustomRange(false);
    setStartDate('');
    setEndDate('');
    
    startTransition(() => {
      router.push('?', { scroll: false });
    });
  }, [router]);

  const hasFilters = currentPeriod || searchParams.get('startDate') || searchParams.get('endDate');

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
     
      
      <div className="flex flex-wrap gap-2 items-center">
        <CustomDropdown
          options={periodOptions}
          selectedValue={currentPeriod}
          onSelect={(value) => handlePeriodChange(value.toString())}
          placeholder="Select Period"
        />

        {showCustomRange && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-200 rounded-md bg-gray-50 text-sm">
            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border-0 bg-transparent focus:outline-none w-24"
              placeholder="Start Date"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border-0 bg-transparent focus:outline-none w-24"
              placeholder="End Date"
            />
            <button
              onClick={handleCustomDateApply}
              disabled={!startDate || !endDate || isPending}
              className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-1"
            >
              {isPending ? (
                <>
                  <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Applying</span>
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>
        )}

        {hasFilters && (
          <button
            onClick={clearFilters}
            disabled={isPending}
            className="px-2 py-1 text-xs text-blue-500 hover:text-blue-600 hover:underline disabled:opacity-50"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}