'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomDropdown from '@/components/shared ui/CustomDropdown';

interface Option {
  label: string;
  value: string | number;
}

const statusOptions: Option[] = [
  { label: 'All Status', value: '' },
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
  { label: 'EXPIRED', value: 'EXPIRED' },
  { label: 'SOLD OUT', value: 'SOLD_OUT' },
];

export default function BatchWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get('status') || '';

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      {/* Batch Status Filter */}
      <div className="flex flex-wrap gap-3 items-center mt--4">
        <CustomDropdown
          options={statusOptions}
          selectedValue={currentStatus}
          onSelect={(value) => updateURL('status', value.toString())}
          placeholder="All Status"
        />
        {/* {currentStatus && (
          <span className="text-sm text-gray-600">
            Showing: {currentStatus.replace('_', ' ')} batches
          </span>
        )} */}
      </div>
    </div>
  );
}