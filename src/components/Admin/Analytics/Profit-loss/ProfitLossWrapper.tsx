'use client';

import { useTransition, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import { IoIosGitCompare } from "react-icons/io";
import { Calendar } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export default function ProfitLossWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();


  const rawPeriod = searchParams.get('period') || 'week';
  const currentPeriod = rawPeriod === 'today' ? 'week' : rawPeriod;
  const currentCompare = searchParams.get('compare') === 'true';
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

  // Auto-initialize dates if missing
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

  const updateURL = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const currentValue = params.get(key) || '';

      if (currentValue === value) return;

      if (value && value.trim() !== '') {
        if (value === 'custom') {
          setShowCustomRange(true);
          return;
        }
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }

      // Calculate start/end dates for local time period
      if (key === 'period') {
        setShowCustomRange(false);
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        switch (value) {
          case 'week':
            // Last 7 days ending today (matching previous logic but consistent with Expense graph week)
            // OR standard week? The API logic uses "Last 7 days"
            // Let's stick to consistent "Last 7 days including today" as per API `period=week`
            // But better yet, let's use standard Local Time calc like sales for consistency?
            // Actually, the user wants "local date based filter".
            // Let's us date-fns for standard ranges to accept "This Week" = Monday-Sunday locally.
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
        }
      }

      const newUrl = `?${params.toString()}`;

      startTransition(() => {
        router.replace(newUrl, { scroll: false });
      });
    },
    [searchParams, router]
  );

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

      const newUrl = `?${params.toString()}`;

      startTransition(() => {
        router.replace(newUrl, { scroll: false });
      });
    }
  }, [startDate, endDate, searchParams, router]);

  const toggleCompare = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentCompare) {
      params.delete('compare');
    } else {
      params.set('compare', 'true');
    }

    // Ensure dates are set if missing (initial load case handled by effect usually, but here relies on URL)
    // If we toggle compare, we just preserve existing dates.

    const newUrl = `?${params.toString()}`;

    startTransition(() => {
      router.replace(newUrl, { scroll: false });
    });
  }, [searchParams, router, currentCompare]);

  return (
    <div className="overflow-x-auto mb-6 mt-4">
      <div className="flex items-center gap-2 min-w-max">
        {/* Period Filters  */}
        <Button
          variant={currentPeriod === 'week' ? 'primary' : 'secondary'}
          onClick={() => updateURL('period', 'week')}
          disabled={isPending}
          className="text-sm whitespace-nowrap min-w-[100px]"
        >
          {isPending && currentPeriod === 'week' ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing</span>
            </div>
          ) : 'This Week'}
        </Button>
        <Button
          variant={currentPeriod === 'month' ? 'primary' : 'secondary'}
          onClick={() => updateURL('period', 'month')}
          disabled={isPending}
          className="text-sm whitespace-nowrap min-w-[100px]"
        >
          {isPending && currentPeriod === 'month' ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing</span>
            </div>
          ) : 'This Month'}
        </Button>
        <Button
          variant={currentPeriod === 'year' ? 'primary' : 'secondary'}
          onClick={() => updateURL('period', 'year')}
          disabled={isPending}
          className="text-sm whitespace-nowrap min-w-[100px]"
        >
          {isPending && currentPeriod === 'year' ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing</span>
            </div>
          ) : 'This Year'}
        </Button>
        <Button
          variant={currentPeriod === 'custom' ? 'primary' : 'secondary'}
          onClick={() => updateURL('period', 'custom')}
          disabled={isPending}
          className="text-sm whitespace-nowrap"
        >
          Custom
        </Button>

        {showCustomRange && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-200 rounded-md bg-gray-50 text-sm h-9">
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
              className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-1 h-6 min-w-[60px] justify-center"
            >
              {isPending && currentPeriod === 'custom' ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : 'Apply'}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 mx-1"></div>

        {/* Compare Toggle */}
        <Button
          variant={currentCompare ? 'primary' : 'secondary'}
          leftIcon={isPending ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : !currentCompare && <IoIosGitCompare />}
          onClick={toggleCompare}
          disabled={isPending}
          className="text-sm whitespace-nowrap min-w-[150px] justify-center"
        >
          {isPending ? 'Verifying...' : currentCompare ? '✓ Comparing' : 'Compare Previous'}
        </Button>
      </div>
    </div>
  );
}
