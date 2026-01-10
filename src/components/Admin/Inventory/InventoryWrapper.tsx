'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomDropdown from '@/components/shared ui/CustomDropdown';
import SearchInventory from './SearchInventory';

interface Option {
  label: string;
  value: string | number;
}

const stockStatusOptions: Option[] = [
  { label: 'All Stock Status', value: '' },
  { label: 'In Stock', value: 'IN_STOCK' },
  { label: 'Low Stock', value: 'LOW_STOCK' },
  { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
];

// const itemStatusOptions: Option[] = [
//   { label: 'All Item Status', value: '' },
//   { label: 'Active', value: 'ACTIVE' },
//   { label: 'Inactive', value: 'INACTIVE' },
// ];

export default function InventoryWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Handle search input
  const handleSearch = (query: string) => {
    updateURL('search', query);
  };

  // Update URL with filters/search
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

    params.set('page', '1'); // Reset page to 1 on search/filter change

    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        <div className="flex-1 w-full md:max-w-3xl">
          <SearchInventory
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <CustomDropdown
          options={stockStatusOptions}
          selectedValue={searchParams.get('stockStatus') || ''}
          onSelect={(value) => updateURL('stockStatus', value.toString())}
          placeholder="All Stock Status"
        />
        {/* <CustomDropdown
          options={itemStatusOptions}
          selectedValue={searchParams.get('itemStatus') || ''}
          onSelect={(value) => updateURL('itemStatus', value.toString())}
          placeholder="All Item Status"
        /> */}
      </div>
    </div>
  );
}
