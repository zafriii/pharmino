'use client';

import { useTransition, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import { IoIosGitCompare } from "react-icons/io";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export default function ProfitLossWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();


  const rawPeriod = searchParams.get('period') || 'week';
  const currentPeriod = rawPeriod === 'today' ? 'week' : rawPeriod;
  const currentCompare = searchParams.get('compare') === 'true';

  // Auto-initialize dates if missing
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
        params.set(key, value.trim());
      } else {
        params.delete(key);
      }

      // Calculate start/end dates for local time period
      if (key === 'period') {
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
          className="text-sm whitespace-nowrap"
        >
          This Week
        </Button>
        <Button
          variant={currentPeriod === 'month' ? 'primary' : 'secondary'}
          onClick={() => updateURL('period', 'month')}
          className="text-sm whitespace-nowrap"
        >
          This Month
        </Button>
        <Button
          variant={currentPeriod === 'year' ? 'primary' : 'secondary'}
          onClick={() => updateURL('period', 'year')}
          className="text-sm whitespace-nowrap"
        >
          This Year
        </Button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 mx-1"></div>

        {/* Compare Toggle */}
        <Button
          variant={currentCompare ? 'primary' : 'secondary'}
          leftIcon={!currentCompare && <IoIosGitCompare />}
          onClick={toggleCompare}
          className="text-sm whitespace-nowrap"
        >
          {currentCompare ? '✓ Comparing' : 'Compare Previous'}
        </Button>
      </div>
    </div>
  );
}
