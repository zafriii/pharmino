'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchReceivedProducts from './SearchReceivedProducts';

interface ReceivedProductsWrapperProps {
  children: React.ReactNode;
}

function ReceivedProductsWrapper({ children }: ReceivedProductsWrapperProps) {
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
    
    if (value && value !== '') {
      params.set(key, value);
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
        {/* Search Received Products */}
        <div className="flex-1 w-full md:max-w-3xl">
          <SearchReceivedProducts
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Received Products List */}
      {children}
    </div>
  );
}

export default ReceivedProductsWrapper;