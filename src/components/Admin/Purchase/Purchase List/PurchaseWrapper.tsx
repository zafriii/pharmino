'use client';

import React, { useState, useTransition} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import SearchPurchase from '../SearchPurchase';
import PurchaseForm from './PurchaseForm';
import { GoPlus } from 'react-icons/go';


function PurchaseWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [openForm, setOpenForm] = useState(false);

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
      {/* Search + Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        {/* Search Purchase */}
        <div className="flex-1 w-full md:max-w-3xl">
          <SearchPurchase
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>

        {/* Create Purchase Button */}
        <div className="flex-shrink-0">
          <Button
            className="flex items-center gap-2 px-3 py-2 rounded-full h-10"
            variant="primary"
            onClick={() => setOpenForm(true)}
          >
            <GoPlus className="w-4 h-4" />
            Add Purchase List
          </Button>
        </div>
      </div>

      {/* Purchase Create Form Modal */}
      <PurchaseForm 
        open={openForm} 
        setOpen={setOpenForm} 
        onSuccess={() => {          
        }}
      />
    </div>
  );
}

export default PurchaseWrapper;