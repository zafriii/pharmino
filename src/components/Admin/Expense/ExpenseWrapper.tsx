'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import CustomDropdown from '@/components/shared ui/CustomDropdown';
import { GoPlus } from 'react-icons/go';
import ExpenseForm from './ExpenseForm';
import SearchExpense from './SearchExpense';

interface Option {
  label: string;
  value: string | number;
}

const periodOptions: Option[] = [
  { label: 'All Time', value: '' },
  // { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

export default function ExpenseWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [openForm, setOpenForm] = useState(false);

  const updateURL = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  const handleSearch = useCallback((query: string) => {
    updateURL('search', query);
  }, [updateURL]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        <div className="flex-1 w-full md:max-w-3xl">
          <SearchExpense
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>

        <div className="flex flex-wrap gap-3">
        <CustomDropdown
          options={periodOptions}
          selectedValue={searchParams.get('period') || ''}
          onSelect={(value) => updateURL('period', value.toString())}
          placeholder="All Time"
        />
      </div>

        <div className="flex-shrink-0">
          <Button
            className="flex items-center gap-2 px-3 py-2 rounded-full h-10"
            variant="primary"
            onClick={() => setOpenForm(true)}
          >
            <GoPlus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      </div>

      
      <ExpenseForm open={openForm} setOpen={setOpenForm} />
    </div>
  );
}
