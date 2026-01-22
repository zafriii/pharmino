'use client';

import React, { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import CustomDropdown from '@/components/shared ui/CustomDropdown';
import { GoPlus } from 'react-icons/go';
import { Calendar } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import SearchExpense from './SearchExpense';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ImSpinner2 } from "react-icons/im";

interface Option {
  label: string;
  value: string | number;
}

// Chart filter options (with URL date range)
const chartPeriodOptions: Option[] = [
  { label: 'Weekly Chart', value: 'week' },
  { label: 'Monthly Chart', value: 'month' },
  { label: 'Yearly Chart', value: 'year' },
  { label: 'Custom Range', value: 'custom' },
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
  const currentStartDateRaw = searchParams.get('startDate') || '';
  const currentEndDateRaw = searchParams.get('endDate') || '';

  // Function to convert ISO or any date to local YYYY-MM-DD
  const toLocalYYYYMMDD = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const [showCustomRange, setShowCustomRange] = useState(currentPeriod === 'custom');
  const [startDate, setStartDate] = useState(toLocalYYYYMMDD(currentStartDateRaw));
  const [endDate, setEndDate] = useState(toLocalYYYYMMDD(currentEndDateRaw));

  // Initialize dates if missing for a period (for chart)
  useEffect(() => {
    setShowCustomRange(currentPeriod === 'custom');
    setStartDate(toLocalYYYYMMDD(currentStartDateRaw));
    setEndDate(toLocalYYYYMMDD(currentEndDateRaw));

    if (!searchParams.has('period')) {
      updateURL('period', 'week');
      return;
    }
    if (currentPeriod && currentPeriod !== 'custom' && !searchParams.has('startDate')) {
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
        if (value === 'custom') {
          setShowCustomRange(true);
          return; // Don't push yet, wait for manual apply
        }

        setShowCustomRange(false);
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
        setShowCustomRange(false);
      }
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  const handleCustomDateApply = useCallback(() => {
    if (startDate && endDate) {
      const params = new URLSearchParams(searchParams.toString());

      // Correctly create local midnights
      const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
      const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

      const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

      params.set('period', 'custom');
      params.set('startDate', start.toISOString());
      params.set('endDate', end.toISOString());
      params.set('page', '1');

      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    }
  }, [startDate, endDate, searchParams, router]);

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
                    {/* <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin"></div> */}
                    <ImSpinner2 className="animate-spin" />
                    <span>Applying</span>
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
          )}
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
