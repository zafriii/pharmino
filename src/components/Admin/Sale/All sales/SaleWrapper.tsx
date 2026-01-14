'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomDropdown from '@/components/shared ui/CustomDropdown';
import SearchSale from './SearchSale';

interface Option {
  label: string;
  value: string | number;
}

const statusOptions: Option[] = [
  { label: 'All Status', value: '' },
  { label: 'COMPLETED', value: 'COMPLETED' },
  { label: 'RETURNED', value: 'RETURNED' },
];

const paymentMethodOptions: Option[] = [
  { label: 'All Payment Methods', value: '' },
  { label: 'CASH', value: 'CASH' },
  { label: 'CARD', value: 'CARD' },
];

const paymentStatusOptions: Option[] = [
  { label: 'All Payment Status', value: '' },
  { label: 'PAID', value: 'PAID' },
  { label: 'REFUNDED', value: 'REFUNDED' },
];

const dateFilterOptions: Option[] = [
  { label: 'All Time', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

export default function SaleWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Handle search changes via debounced component
  const handleSearch = (query: string) => {
    updateURL('search', query);
  };

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValue = params.get(key) || '';
    
    // Only update if the value actually changed
    if (currentValue === value) return;
    
    if (value && value.trim() !== '') {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset page to 1 on filter/search
    
    const newUrl = `?${params.toString()}`;
    
    startTransition(() => {
      // Use replace instead of push to avoid scroll jumping
      router.replace(newUrl, { scroll: false });
    });
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        <div className="flex-1 w-full md:max-w-3xl">
          <SearchSale
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <CustomDropdown
          options={dateFilterOptions}
          selectedValue={searchParams.get('dateFilter') || ''}
          onSelect={(value) => updateURL('dateFilter', value.toString())}
          placeholder="All Time"
        />
        <CustomDropdown
          options={statusOptions}
          selectedValue={searchParams.get('status') || ''}
          onSelect={(value) => updateURL('status', value.toString())}
          placeholder="All Status"
        />
        <CustomDropdown
          options={paymentMethodOptions}
          selectedValue={searchParams.get('paymentMethod') || ''}
          onSelect={(value) => updateURL('paymentMethod', value.toString())}
          placeholder="Payment Method"
        />
        <CustomDropdown
          options={paymentStatusOptions}
          selectedValue={searchParams.get('paymentStatus') || ''}
          onSelect={(value) => updateURL('paymentStatus', value.toString())}
          placeholder="Payment Status"
        />
      </div>
    </div>
  );
}