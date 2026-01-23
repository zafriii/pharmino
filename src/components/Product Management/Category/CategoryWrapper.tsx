'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import { GoPlus } from 'react-icons/go';
import CategoryForm from './CategoryForm';
import SearchCategory from './SearchCategory'; 

export default function CategoryWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [openForm, setOpenForm] = useState(false);

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
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search + Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        {/* Search Category */}
        <div className="flex-1 w-full md:max-w-3xl">
          <SearchCategory
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>

        {/* Create Category Button */}
        <div className="flex-shrink-0">
          <Button
            className="flex items-center gap-2 px-3 py-2 rounded-full h-10 "
            variant="primary"
            onClick={() => setOpenForm(true)}
          >
            <GoPlus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Category Create Form Modal */}
      <CategoryForm open={openForm} setOpen={setOpenForm} />
    </div>
  );
}

