'use client';

import React, { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import CustomDropdown from '@/components/shared ui/CustomDropdown';
import { GoPlus } from 'react-icons/go';
import ExpenseForm from './ExpenseForm';
import SearchExpense from './SearchExpense';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface Option {
  label: string;
  value: string | number;
}

// Chart filter options (with URL date range)
const chartPeriodOptions: Option[] = [
  { label: 'Weekly Chart', value: 'week' },
  { label: 'Monthly Chart', value: 'month' },
  { label: 'Yearly Chart', value: 'year' },
];

// List filter options (normal filter with URL change)
const listFilterOptions: Option[] = [
  { label: 'All Other Expense', value: 'all' },
  { label: 'Weekly Other Expense', value: 'week' },
  { label: 'Monthly Other Expense', value: 'month' },
];

export default function ExpenseWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [openForm, setOpenForm] = useState(false);
  const currentPeriod = searchParams.get('period');
  const currentListFilter = searchParams.get('listFilter');

  // Initialize dates if missing for a period (for chart)
  useEffect(() => {
    if (!searchParams.has('period')) {
      updateURL('period', 'week');
      return;
    }
    if (currentPeriod && !searchParams.has('startDate')) {
      const now = new Date();
      let start: Date | null = null;
      let end: Date | null = null;

      switch (currentPeriod) {
        case 'today':
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case 'week':
          start = startOfWeek(now, { weekStartsOn: 1 });
          end = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case 'year':
          start = startOfYear(now);
          end = endOfYear(now);
          break;
      }

      if (start && end) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('startDate', start.toISOString());
        params.set('endDate', end.toISOString());
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [currentPeriod, searchParams, router]);

  // Initialize list filter if missing
  useEffect(() => {
    if (!searchParams.has('listFilter')) {
      updateURL('listFilter', 'all');
    }
  }, [searchParams]);

  const updateURL = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);

      // Handle date calculation for chart period change
      if (key === 'period') {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        switch (value) {
          case 'today':
            start = startOfDay(now);
            end = endOfDay(now);
            break;
          case 'week':
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
            break;
          case 'month':
            start = startOfMonth(now);
            end = endOfMonth(now);
            break;
          case 'year':
            start = startOfYear(now);
            end = endOfYear(now);
            break;
        }

        if (start && end) {
          params.set('startDate', start.toISOString());
          params.set('endDate', end.toISOString());
        } else {
          params.delete('startDate');
          params.delete('endDate');
        }
      }

    } else {
      params.delete(key);
      if (key === 'period') {
        params.delete('startDate');
        params.delete('endDate');
      }
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  const handleSearch = useCallback((query: string) => {
    updateURL('search', query);
  }, [updateURL]);

  return (
    <div className="space-y-6">
      {/* Chart Filter Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Chart Filters</h3>
        <div className="flex flex-wrap gap-3">
          <CustomDropdown
            options={chartPeriodOptions}
            selectedValue={searchParams.get('period') || 'week'}
            onSelect={(value) => updateURL('period', value.toString())}
            placeholder="Weekly Chart"
          />
        </div>
      </div>

      {/* List Filter Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">List Filters</h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 w-full md:max-w-3xl">
            <SearchExpense
              value={searchParams.get('search') || ''}
              onSearch={handleSearch}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <CustomDropdown
              options={listFilterOptions}
              selectedValue={searchParams.get('listFilter') || 'all'}
              onSelect={(value) => updateURL('listFilter', value.toString())}
              placeholder="All Other Expense"
            />
          </div>

          <div className="flex-shrink-0">
            <Button
              className="flex items-center gap-2 px-3 py-2 rounded-full h-10"
              variant="primary"
              onClick={() => setOpenForm(true)}
            >
              <GoPlus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
        </div>
      </div>

      <ExpenseForm open={openForm} setOpen={setOpenForm} />
    </div>
  );
}
