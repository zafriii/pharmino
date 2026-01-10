'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchPurchase from '../SearchPurchase';

interface ReceivedItemsWrapperProps {
  children: React.ReactNode;
}

function ReceivedItemsWrapper({ children }: ReceivedItemsWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Handle search changes via debounced component
  const handleSearch = (query: string) => {
    updateURL('search', query);
  };

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page to 1 on filter/search
    params.delete('page');
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 w-full mt-4 md:max-w-3xl">
          <SearchPurchase
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

export default ReceivedItemsWrapper;