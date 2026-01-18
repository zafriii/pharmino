'use client';

import { useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import { IoIosGitCompare } from "react-icons/io";

export default function ProfitLossWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  
  const rawPeriod = searchParams.get('period') || 'week';
  const currentPeriod = rawPeriod === 'today' ? 'week' : rawPeriod;
  const currentCompare = searchParams.get('compare') === 'true';

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
