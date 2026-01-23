'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterTabs from '@/components/shared ui/FilterTabs';
import SearchProduct from '@/components/Product Management/Products/SearchProduct';

interface SaleProductWrapperProps {
  categories: Array<{id: number; name: string}>;
}

export default function SaleProductWrapper({ categories }: SaleProductWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Handle search changes via debounced component
  const handleSearch = (query: string) => {
    updateURL('search', query);
  };

  const handleCategoryChange = (categoryId: string) => {
    updateURL('categoryId', categoryId === 'all' ? '' : categoryId);
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

  // Prepare category tabs
  const categoryTabs = [
    { id: "all", label: "All Products" },
    ...categories.map(category => ({
      id: category.id.toString(),
      label: category.name
    }))
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <SearchProduct
        value={searchParams.get('search') || ''}
        onSearch={handleSearch}
      />
      
      {/* Category Filter */}
      {categories.length > 0 && (
        <FilterTabs
          tabs={categoryTabs}
          onTabChange={handleCategoryChange}
          initialActiveTab={searchParams.get('categoryId') || 'all'}
        />
      )}
    </div>
  );
}