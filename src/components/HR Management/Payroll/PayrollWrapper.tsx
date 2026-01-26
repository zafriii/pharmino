'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomDropdown from '@/components/shared ui/CustomDropdown';
import SearchEmployee from '../SearchEmployee';

interface Option {
  label: string;
  value: string;
}

/*Static Status Options*/
const statusOptions: Option[] = [
  { label: 'All Status', value: '' },
  { label: 'PENDING', value: 'PENDING' },
  { label: 'PAID', value: 'PAID' },
];

/*Generate Month Options*/
function getMonthOptions(): Option[] {
  const options: Option[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
    const label = d.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });

    options.push({ label, value });
  }

  return [{ label: 'All Months', value: '' }, ...options];
}

export default function PayrollWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const monthOptions = getMonthOptions();

  React.useEffect(() => {
    if (!searchParams.get('month')) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      updateURL('month', currentMonth);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set('page', '1');

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        {/* Search */}
        <div className="flex-1 w-full md:max-w-2xl">
          <SearchEmployee
            value={searchParams.get('search') || ''}
            onSearch={(query) => updateURL('search', query)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-shrink-0">
          <CustomDropdown
            options={statusOptions}
            selectedValue={searchParams.get('status') || ''}
            onSelect={(value) => updateURL('status', value.toString())}
            placeholder="Filter by Status"
          />

          <CustomDropdown
            options={monthOptions}
            selectedValue={searchParams.get('month') || ''}
            onSelect={(value) => updateURL('month', value.toString())}
            placeholder="Filter by Month"
          />
        </div>
      </div>
    </div>
  );
}
